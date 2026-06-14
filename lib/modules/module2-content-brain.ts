import { callClaude, parseClaudeJson } from '@/lib/ai/claude'
import { buildRagContext } from '@/lib/rag/retriever'
import { loadIndustrySkills } from '@/lib/skills/loader'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'
import {
  PROMPT_2A_TOPIC_SUGGESTER,
  PROMPT_2B_CONTENT_GENERATOR,
  PROMPT_2C_QUALITY_CHECKER,
  PROMPT_9C_CONTENT_REQUEST,
} from '@/lib/prompts/p2-content'

export async function generateContent(request: {
  clientId: string
  platforms: string[]
  contentType?: string
  topic?: string
}) {
  const { clientId, platforms, contentType = 'regular', topic } = request

  const { data: profile } = await supabaseAdmin
    .from('brand_profiles')
    .select('profile_data')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single()

  if (!profile) throw new Error('Brand profile not found')

  const skills = loadIndustrySkills(profile.profile_data.industry)
  const results = []

  for (const platform of platforms) {
    const ragContext = await buildRagContext(clientId, `${contentType} content ${topic || ''} for ${platform}`)

    let finalTopic = topic
    if (!finalTopic) {
      const topicsRaw = await callClaude({
        systemPrompt: PROMPT_2A_TOPIC_SUGGESTER.replace('{rag_context_block}', ragContext).replace(
          '{industry_content_skill}',
          skills.content
        ),
        userMessage: JSON.stringify({ platform, content_types_needed: [contentType], recent_topics: [], upcoming_events: [] }),
        maxTokens: 400,
        temperature: 0.7,
        clientId,
        module: 'MODULE_2A',
      })
      const topics = parseClaudeJson<any[]>(topicsRaw)
      finalTopic = topics[0]?.topic || 'general'
    }

    const contentRaw = await callClaude({
      systemPrompt: PROMPT_2B_CONTENT_GENERATOR.replace('{rag_context_block}', ragContext)
        .replace('{industry_content_skill}', skills.content)
        .replace('{platform}', platform)
        .replace('{content_type}', contentType)
        .replace('{topic}', finalTopic ?? 'general')
        .replace('{language}', profile.profile_data.language || 'vi')
        .replace('{week_theme}', ''),
      userMessage: 'Generate content based on the system prompt above.',
      maxTokens: 1200,
      temperature: 0.6,
      clientId,
      module: 'MODULE_2B',
    })

    const content = parseClaudeJson<any>(contentRaw)

    const qcRaw = await callClaude({
      systemPrompt: PROMPT_2C_QUALITY_CHECKER,
      userMessage: JSON.stringify({ generated_content: content, brand_profile: profile.profile_data, platform }),
      maxTokens: 300,
      temperature: 0,
      clientId,
      module: 'MODULE_2C',
    })

    const qc = parseClaudeJson<any>(qcRaw)
    if (qc.overall === 'rejected') {
      log('MODULE_2C', 'warn', `Content rejected (score ${qc.score}): ${qc.revision_notes}`)
    }

    const postCode = `${clientId.slice(0, 8)}_${platform.toUpperCase()}_${Date.now()}`
    const { data: savedPost } = await supabaseAdmin
      .from('content_queue')
      .insert({
        client_id: clientId,
        post_code: postCode,
        platforms: [platform],
        content_type: contentType,
        copy_vi: content.language === 'vi' ? content.copy : null,
        copy_en: content.language === 'en' ? content.copy : null,
        hook_alternatives: content.hook_alternatives,
        visual_brief: content.visual_brief,
        status: 'draft',
        auto_approve_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    results.push({ post: savedPost, qc })
    log('MODULE_2', 'success', `Content created: ${postCode}`)
  }

  return results
}

export async function handleContentRequest(params: {
  chatId: string
  text: string
  client: any
  channel: string
}) {
  const { data: profile } = await supabaseAdmin
    .from('brand_profiles')
    .select('profile_data')
    .eq('client_id', params.client.id)
    .eq('is_active', true)
    .single()

  const parsed = await callClaude({
    systemPrompt: PROMPT_9C_CONTENT_REQUEST.replace('{language}', profile?.profile_data?.language || 'vi'),
    userMessage: JSON.stringify({ user_message: params.text, brand_profile: profile?.profile_data }),
    maxTokens: 300,
    temperature: 0.3,
    module: 'MODULE_9C',
  })

  const result = parseClaudeJson<any>(parsed)

  const { sendTelegramMessage, sendZaloMessage } = await import('@/lib/bots/messenger')

  if (result.needs_clarification) {
    if (params.channel === 'telegram') await sendTelegramMessage(params.chatId, result.clarification_question)
    else await sendZaloMessage(params.chatId, result.clarification_question)
    return
  }

  if (result.content_request?.type) {
    await generateContent({
      clientId: params.client.id,
      platforms: result.content_request.platform?.length
        ? result.content_request.platform
        : params.client.brand_profiles?.[0]?.profile_data?.platforms || ['facebook'],
      contentType: result.content_request.type,
      topic: result.content_request.topic,
    })

    if (params.channel === 'telegram') await sendTelegramMessage(params.chatId, result.confirmation_message)
    else await sendZaloMessage(params.chatId, result.confirmation_message)
  }
}
