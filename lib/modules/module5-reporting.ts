import { callClaude, parseClaudeJson } from '@/lib/ai/claude'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'
import {
  PROMPT_5A_DATA_NORMALIZER,
  PROMPT_5B_PERFORMANCE_ANALYZER,
  PROMPT_5C_INSIGHT_GENERATOR,
  PROMPT_5D_REPORT_FORMATTER,
} from '@/lib/prompts/p5-reporting'

async function fetchFacebookData(clientId: string, start: string, end: string) {
  try {
    const { data } = await supabaseAdmin
      .from('analytics_cache')
      .select('data')
      .eq('client_id', clientId)
      .eq('platform', 'facebook')
      .gte('period_start', start)
      .lte('period_end', end)
      .single()
    return data?.data || null
  } catch { return null }
}

async function fetchInstagramData(clientId: string, start: string, end: string) {
  try {
    const { data } = await supabaseAdmin
      .from('analytics_cache')
      .select('data')
      .eq('client_id', clientId)
      .eq('platform', 'instagram')
      .gte('period_start', start)
      .lte('period_end', end)
      .single()
    return data?.data || null
  } catch { return null }
}

export async function generateWeeklyReport(clientId: string) {
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('*, brand_profiles(profile_data)')
    .eq('id', clientId)
    .single()

  if (!client) throw new Error(`Client ${clientId} not found`)

  const profile = (client as any).brand_profiles?.[0]?.profile_data || {}
  const language = profile.language || 'vi'
  const brandName = profile.business_name || client.brand_name || 'Brand'

  const now = new Date()
  const weekEnd = now.toISOString().split('T')[0]
  const weekStartDate = new Date(now)
  weekStartDate.setDate(weekStartDate.getDate() - 7)
  const weekStart = weekStartDate.toISOString().split('T')[0]
  const periodLabel = `${weekStart} → ${weekEnd}`

  log('MODULE_5', 'info', `Generating report for ${brandName} (${periodLabel})`)

  // Fetch analytics data
  const facebookData = await fetchFacebookData(clientId, weekStart, weekEnd)
  const instagramData = await fetchInstagramData(clientId, weekStart, weekEnd)

  // Fetch published posts from content_queue for the period
  const { data: publishedPosts } = await supabaseAdmin
    .from('content_queue')
    .select('id, content_type, platforms, published_at, copy_vi, copy_en')
    .eq('client_id', clientId)
    .eq('status', 'published')
    .gte('published_at', weekStartDate.toISOString())

  const contentTypesMix = (publishedPosts || []).reduce((acc: Record<string, number>, p) => {
    acc[p.content_type] = (acc[p.content_type] || 0) + 1
    return acc
  }, {})

  // 5A: Normalize data
  const normalizedRaw = await callClaude({
    systemPrompt: PROMPT_5A_DATA_NORMALIZER,
    userMessage: JSON.stringify({
      raw_facebook_data: facebookData,
      raw_instagram_data: instagramData,
      period_start: weekStart,
      period_end: weekEnd,
    }),
    maxTokens: 1000,
    temperature: 0,
    clientId,
    module: 'MODULE_5A',
  })

  const normalized = parseClaudeJson<any>(normalizedRaw)
  log('MODULE_5A', 'success', `Data normalized — reach: ${normalized?.combined?.total_reach}`)

  // 5B: Performance analysis
  const analysisRaw = await callClaude({
    systemPrompt: PROMPT_5B_PERFORMANCE_ANALYZER,
    userMessage: JSON.stringify({
      normalized_data: normalized,
      brand_profile: profile,
      previous_period_data: null,
      content_types_published: contentTypesMix,
    }),
    maxTokens: 1200,
    temperature: 0.2,
    clientId,
    module: 'MODULE_5B',
  })

  const analysis = parseClaudeJson<any>(analysisRaw)
  log('MODULE_5B', 'success', `Overall rating: ${analysis?.overall_rating}`)

  // 5C: Insights & recommendations
  const insightsRaw = await callClaude({
    systemPrompt: PROMPT_5C_INSIGHT_GENERATOR,
    userMessage: JSON.stringify({
      performance_analysis: analysis,
      brand_profile: profile,
      current_content_mix: contentTypesMix,
    }),
    maxTokens: 1200,
    temperature: 0.4,
    clientId,
    module: 'MODULE_5C',
  })

  const insights = parseClaudeJson<any>(insightsRaw)
  log('MODULE_5C', 'success', `Generated ${insights?.recommendations?.length || 0} recommendations`)

  // 5D: Format report message
  const reportRaw = await callClaude({
    systemPrompt: PROMPT_5D_REPORT_FORMATTER,
    userMessage: JSON.stringify({
      brand_name: brandName,
      normalized_data: normalized,
      performance_analysis: analysis,
      recommendations: insights?.recommendations,
      period_label: periodLabel,
      language,
    }),
    maxTokens: 600,
    temperature: 0.3,
    clientId,
    module: 'MODULE_5D',
  })

  // Save report to DB
  try {
    await supabaseAdmin.from('reports').insert({
      client_id: clientId,
      period_start: weekStart,
      period_end: weekEnd,
      normalized_data: normalized,
      performance_analysis: analysis,
      recommendations: insights?.recommendations,
      report_text: reportRaw,
      language,
    })
  } catch { /* Supabase placeholder — non-fatal */ }

  log('MODULE_5', 'success', `Report generated for ${brandName}`)

  return {
    periodLabel,
    normalized,
    analysis,
    recommendations: insights?.recommendations,
    reportText: reportRaw,
  }
}

export async function sendWeeklyReport(clientId: string) {
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('telegram_chat_id, zalo_user_id, preferred_channel, brand_profiles(profile_data)')
    .eq('id', clientId)
    .single()

  if (!client) throw new Error(`Client ${clientId} not found`)

  const report = await generateWeeklyReport(clientId)

  const { sendTelegramMessage, sendZaloMessage } = await import('@/lib/bots/messenger')
  const channel = (client as any).preferred_channel || 'telegram'

  if (channel === 'telegram' && (client as any).telegram_chat_id) {
    await sendTelegramMessage((client as any).telegram_chat_id, report.reportText)
  } else if (channel === 'zalo' && (client as any).zalo_user_id) {
    await sendZaloMessage((client as any).zalo_user_id, report.reportText)
  }

  log('MODULE_5', 'success', `Report sent to client ${clientId} via ${channel}`)
  return report
}
