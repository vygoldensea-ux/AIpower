import { callClaude, parseClaudeJson } from '@/lib/ai/claude'
import { buildRagContext } from '@/lib/rag/retriever'
import { loadIndustrySkills } from '@/lib/skills/loader'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'
import { fetchLatestAINews } from '@/lib/utils/fetch-news'
import { generateComparisonHTML, generateEducationalHTML, generateStatementHTML } from '@/lib/utils/generate-image-html'
import {
  PROMPT_2A_TOPIC_SUGGESTER,
  PROMPT_2B_CONTENT_GENERATOR,
  PROMPT_2C_QUALITY_CHECKER,
  PROMPT_9C_CONTENT_REQUEST,
  PROMPT_9C_IMAGE_GENERATOR,
} from '@/lib/prompts/p2-content'

// Load last N messages for context
async function loadHistory(clientId: string, limit = 10) {
  const { data } = await supabaseAdmin
    .from('conversation_history')
    .select('role, message')
    .eq('client_id', clientId)
    .eq('module', 'MODULE_9C')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data || []).reverse()
}

async function saveMessage(clientId: string, role: 'user' | 'assistant', message: string) {
  await supabaseAdmin.from('conversation_history').insert({
    client_id: clientId,
    channel: 'telegram',
    module: 'MODULE_9C',
    role,
    message,
  })
}

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

  const skills = loadIndustrySkills(profile.profile_data.industry || 'it-outsourcing')
  const results = []

  for (const platform of platforms) {
    const ragContext = await buildRagContext(clientId, `${contentType} content ${topic || ''} for ${platform}`)

    let finalTopic = topic
    if (!finalTopic) {
      const topicsRaw = await callClaude({
        systemPrompt: PROMPT_2A_TOPIC_SUGGESTER.replace('{rag_context_block}', ragContext).replace('{industry_content_skill}', skills.content),
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
      systemPrompt: PROMPT_2B_CONTENT_GENERATOR
        .replace('{rag_context_block}', ragContext)
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

  const { sendTelegramMessage, sendTelegramPhoto, sendZaloMessage } = await import('@/lib/bots/messenger')
  const send = async (msg: string) => {
    if (params.channel === 'telegram') await sendTelegramMessage(params.chatId, msg)
    else await sendZaloMessage(params.chatId, msg)
  }

  // Load conversation history for context
  const history = await loadHistory(params.client.id)
  const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.message}`).join('\n')

  // Save user message
  await saveMessage(params.client.id, 'user', params.text)

  // Load skills + live news
  const industry = profile?.profile_data?.industry || 'it-outsourcing'
  const skills = loadIndustrySkills(industry)
  const liveNews = await fetchLatestAINews()

  const systemPrompt = PROMPT_9C_CONTENT_REQUEST
    .replace('{language}', profile?.profile_data?.language || 'vi')
    .replace('{skill_context}', skills.content)
    .replace('{news_context}', liveNews || skills.newsContext || '')

  const userPayload = JSON.stringify({
    user_message: params.text,
    brand_profile: profile?.profile_data,
    conversation_history: historyText || 'No prior conversation.',
  })

  const parsed = await callClaude({
    systemPrompt,
    userMessage: userPayload,
    maxTokens: 1500,
    temperature: 0.4,
    module: 'MODULE_9C',
    clientId: params.client.id,
  })

  let result: any
  try {
    result = parseClaudeJson<any>(parsed)
  } catch {
    await saveMessage(params.client.id, 'assistant', parsed)
    await send(parsed)
    return
  }

  // General chat
  if (result.type === 'chat' || (!result.draft_post && result.chat_reply)) {
    const reply = result.chat_reply || parsed
    await saveMessage(params.client.id, 'assistant', reply)
    await send(reply)
    return
  }

  // Needs clarification
  if (result.needs_clarification) {
    await saveMessage(params.client.id, 'assistant', result.clarification_question)
    await send(result.clarification_question)
    return
  }

  // Publish intent — user wants to post what was just written
  if (result.type === 'publish') {
    const postText = result.post_content || result.draft_post
    const platforms = result.platforms || ['linkedin']

    if (!postText) {
      const noPost = 'Tao chưa có bài nào để đăng. Nhắn "viết bài về [chủ đề]" trước nhé.'
      await saveMessage(params.client.id, 'assistant', noPost)
      await send(noPost)
      return
    }

    try {
      const { publishPost } = await import('@/lib/social/ayrshare')
      await publishPost({ post: postText, platforms })
      const ok = `Đã đăng lên ${platforms.join(', ')} rồi Vy.`
      await saveMessage(params.client.id, 'assistant', ok)
      await send(ok)
    } catch (e: any) {
      const errMsg = `Lỗi khi đăng: ${e.message}`
      await send(errMsg)
    }
    return
  }

  // Write content + generate image
  if (result.draft_post) {
    if (result.confirmation_message) await send(result.confirmation_message)
    await saveMessage(params.client.id, 'assistant', result.draft_post)
    await send(result.draft_post)

    // Generate matching image HTML
    try {
      const imagePrompt = PROMPT_9C_IMAGE_GENERATOR
        .replace('{post}', result.draft_post)
        .replace('{image_skill}', skills.image || '')

      const imageRaw = await callClaude({
        systemPrompt: imagePrompt,
        userMessage: 'Generate the image data JSON for this post.',
        maxTokens: 1200,
        temperature: 0.2,
        module: 'MODULE_9C_IMG',
        clientId: params.client.id,
      })

      const imgData = parseClaudeJson<any>(imageRaw)

      let html = ''
      if (imgData.type === 'comparison') {
        html = generateComparisonHTML(imgData)
      } else if (imgData.type === 'educational') {
        html = generateEducationalHTML(imgData)
      } else if (imgData.type === 'statement') {
        html = generateStatementHTML(imgData)
      }

      if (html) {
        if (params.channel === 'telegram') {
          try {
            const { htmlToImageBuffer } = await import('@/lib/utils/html-to-image')
            const imgBuffer = await htmlToImageBuffer(html)
            await sendTelegramPhoto(params.chatId, imgBuffer, 'Hình LinkedIn 900×900 — duyệt xong nhắn "đăng đi" để post')
          } catch (imgErr: any) {
            log('MODULE_9C_IMG', 'warn', `Puppeteer failed: ${imgErr.message}`)
            await send('Viết bài xong nhưng không render được hình — thử lại sau.')
          }
        }
      }
    } catch (e: any) {
      log('MODULE_9C_IMG', 'warn', `Image generation skipped: ${e.message}`)
    }
    return
  }
}
