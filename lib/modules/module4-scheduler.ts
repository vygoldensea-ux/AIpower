import { callClaude, parseClaudeJson } from '@/lib/ai/claude'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'
import { publishPost } from '@/lib/social/ayrshare'
import {
  PROMPT_4A_CALENDAR_PLANNER,
  PROMPT_4B_CONFLICT_CHECKER,
  PROMPT_4D_CLIENT_SUMMARY,
} from '@/lib/prompts/p4-scheduler'

export async function schedulePost(postId: string, scheduledAt: string) {
  const { data: post } = await supabaseAdmin
    .from('content_queue')
    .select('*, clients(brand_profiles(profile_data))')
    .eq('id', postId)
    .single()

  if (!post) throw new Error(`Post ${postId} not found`)

  await supabaseAdmin
    .from('content_queue')
    .update({ status: 'scheduled', scheduled_at: scheduledAt })
    .eq('id', postId)

  log('MODULE_4', 'success', `Post ${postId} scheduled for ${scheduledAt}`)
  return { postId, scheduledAt }
}

export async function generateWeeklyCalendar(clientId: string, weekStart: string) {
  const { data: profile } = await supabaseAdmin
    .from('brand_profiles')
    .select('profile_data')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single()

  const { data: approvedPosts } = await supabaseAdmin
    .from('content_queue')
    .select('id, platforms, content_type')
    .eq('client_id', clientId)
    .eq('status', 'approved')
    .is('scheduled_at', null)

  if (!approvedPosts?.length) {
    log('MODULE_4A', 'info', `No approved posts to schedule for client ${clientId}`)
    return null
  }

  // 4A: Calendar Planner
  const planRaw = await callClaude({
    systemPrompt: PROMPT_4A_CALENDAR_PLANNER,
    userMessage: JSON.stringify({
      brand_profile: profile?.profile_data,
      approved_posts: approvedPosts.map((p) => ({
        id: p.id,
        platform: p.platforms?.[0],
        content_type: p.content_type,
      })),
      week_start: weekStart,
      timezone: 'Asia/Ho_Chi_Minh',
    }),
    maxTokens: 2000,
    temperature: 0.3,
    clientId,
    module: 'MODULE_4A',
  })

  const plan = parseClaudeJson<any>(planRaw)
  if (!plan) throw new Error('MODULE_4A failed to return valid JSON')
  log('MODULE_4A', 'success', `Planned ${plan.total_posts} posts for week ${plan.week}`)

  // 4B: Conflict Checker
  const conflictRaw = await callClaude({
    systemPrompt: PROMPT_4B_CONFLICT_CHECKER,
    userMessage: JSON.stringify({ schedule: plan.schedule }),
    maxTokens: 600,
    temperature: 0,
    clientId,
    module: 'MODULE_4B',
  })

  const conflicts = parseClaudeJson<any>(conflictRaw)
  log('MODULE_4B', conflicts?.has_hard_conflicts ? 'warn' : 'success', `Recommendation: ${conflicts?.recommendation}`)

  if (conflicts?.has_hard_conflicts) {
    log('MODULE_4', 'error', `Hard conflicts — schedule blocked: ${JSON.stringify(conflicts.hard_conflicts)}`)
    return { plan, conflicts, applied: false }
  }

  // Apply schedule to DB
  for (const slot of plan.schedule) {
    await supabaseAdmin
      .from('content_queue')
      .update({ scheduled_at: slot.scheduled_datetime, status: 'scheduled' })
      .eq('id', slot.post_id)
  }

  log('MODULE_4', 'success', `Applied schedule for ${plan.schedule.length} posts`)
  return { plan, conflicts, applied: true }
}

export async function publishScheduledPost(postId: string) {
  const { data: post } = await supabaseAdmin
    .from('content_queue')
    .select('*, visual_assets(image_url)')
    .eq('id', postId)
    .single()

  if (!post) throw new Error(`Post ${postId} not found`)

  const copy = post.copy_vi || post.copy_en || ''
  const mediaUrls = (post.visual_assets as any[])
    ?.map((v) => v.image_url)
    .filter(Boolean) || []

  // Build Ayrshare payload (log even if key is placeholder)
  const payload = {
    post: copy,
    platforms: post.platforms || ['facebook'],
    mediaUrls,
  }
  log('MODULE_4', 'info', `Ayrshare payload: platforms=${payload.platforms.join(',')} copy_len=${copy.length} media=${mediaUrls.length}`)

  const result = await publishPost(payload)

  await supabaseAdmin
    .from('content_queue')
    .update({ status: 'published', ayrshare_id: result.id, published_at: new Date().toISOString() })
    .eq('id', postId)

  log('MODULE_4', 'success', `Post ${postId} published — Ayrshare id: ${result.id}`)
  return result
}

export async function sendClientScheduleSummary(params: {
  clientId: string
  chatId: string
  channel: string
  brandName: string
  scheduleSummary: any
  language: string
}) {
  const messageRaw = await callClaude({
    systemPrompt: PROMPT_4D_CLIENT_SUMMARY,
    userMessage: JSON.stringify({
      brand_name: params.brandName,
      schedule_summary: params.scheduleSummary,
      language: params.language,
      channel: params.channel,
    }),
    maxTokens: 400,
    temperature: 0.3,
    clientId: params.clientId,
    module: 'MODULE_4D',
  })

  const { sendTelegramMessage, sendZaloMessage } = await import('@/lib/bots/messenger')
  if (params.channel === 'telegram') await sendTelegramMessage(params.chatId, messageRaw)
  else await sendZaloMessage(params.chatId, messageRaw)

  log('MODULE_4D', 'success', `Schedule summary sent to ${params.clientId}`)
}
