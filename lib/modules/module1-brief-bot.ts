import { callClaude, parseClaudeJson } from '@/lib/ai/claude'
import { supabaseAdmin } from '@/lib/supabase/client'
import { indexBrandProfile } from '@/lib/rag/indexer'
import { sendTelegramMessage, sendZaloMessage } from '@/lib/bots/messenger'
import { log } from '@/lib/utils/logger'
import {
  PROMPT_1A_LANGUAGE_DETECTOR,
  PROMPT_1B_ONBOARDING,
  PROMPT_1D_PROFILE_COMPILER,
  PROMPT_1E_CONFIRMATION,
} from '@/lib/prompts/p1-onboarding'

interface BriefBotInput {
  chatId: string
  text: string
  userId?: string
  channel: 'telegram' | 'zalo'
  existingClient: any
}

export async function handleBriefBot(input: BriefBotInput) {
  const { chatId, text, channel, existingClient } = input

  try {
    // Load conversation history
    const clientId = existingClient?.id || null

    const { data: history } = clientId
      ? await supabaseAdmin
          .from('conversation_history')
          .select('role, message')
          .eq('client_id', clientId)
          .eq('module', 'brief_bot')
          .order('created_at', { ascending: true })
          .limit(30)
      : { data: [] }

    const historyText =
      history?.map((h) => `${h.role === 'user' ? 'Khách' : 'Bot'}: ${h.message}`).join('\n') || ''
    const exchangeCount = history?.length || 0

    // Detect language
    const langRaw = await callClaude({
      systemPrompt: PROMPT_1A_LANGUAGE_DETECTOR,
      userMessage: text,
      maxTokens: 50,
      temperature: 0,
      module: 'MODULE_1A',
    })
    const { language } = parseClaudeJson<{ language: 'vi' | 'en' }>(langRaw)

    // Build onboarding prompt
    const systemPrompt = PROMPT_1B_ONBOARDING.replace('{AGENCY_NAME}', process.env.AGENCY_NAME || 'GoldenSea Studios')
      .replace('{detected_language}', language)
      .replace('{exchange_count}', exchangeCount.toString())
      .replace('{current_step}', Math.floor(exchangeCount / 2).toString())
      .replace('{collected_fields}', '{}')

    const response = await callClaude({
      systemPrompt,
      userMessage: `HISTORY:\n${historyText}\n\nLATEST MESSAGE FROM CLIENT:\n${text}`,
      maxTokens: 600,
      temperature: 0.3,
      module: 'MODULE_1B',
    })

    // Check nếu đủ thông tin
    if (response.includes('<<<PROCEED_TO_CONFIRMATION>>>')) {
      await completeOnboarding({ chatId, historyText, language, channel })
      return
    }

    const cleanResponse = response.replace('<<<PROCEED_TO_CONFIRMATION>>>', '').trim()

    await sendMessage(channel, chatId, cleanResponse)

    // Lưu conversation
    if (clientId) {
      await supabaseAdmin.from('conversation_history').insert([
        { client_id: clientId, channel, module: 'brief_bot', role: 'user', message: text },
        { client_id: clientId, channel, module: 'brief_bot', role: 'assistant', message: cleanResponse },
      ])
    }
  } catch (error: any) {
    log('MODULE_1', 'error', error.message)
    const errMsg =
      language_fallback() === 'vi'
        ? 'Xin lỗi, có lỗi nhỏ xảy ra. Bạn thử nhắn lại nhé! 🙏'
        : 'Sorry, there was a small error. Please try again!'
    await sendMessage(channel, chatId, errMsg)
  }
}

function language_fallback() {
  return 'vi'
}

async function completeOnboarding(params: {
  chatId: string
  historyText: string
  language: string
  channel: 'telegram' | 'zalo'
}) {
  const { chatId, historyText, language, channel } = params

  // Compile profile từ conversation
  const profileRaw = await callClaude({
    systemPrompt: PROMPT_1D_PROFILE_COMPILER,
    userMessage: `CONVERSATION:\n${historyText}`,
    maxTokens: 1200,
    temperature: 0,
    module: 'MODULE_1D',
  })

  const profileData = parseClaudeJson<any>(profileRaw)
  profileData.compiled_at = new Date().toISOString()

  // Tạo client_code
  const clientCode = `${profileData.industry.toUpperCase().replace(/\s/g, '_').slice(0, 8)}_${Date.now()}`

  // Insert client
  const { data: newClient, error } = await supabaseAdmin
    .from('clients')
    .insert({
      client_code: clientCode,
      brand_name: profileData.brand_name,
      industry: profileData.industry,
      business_type: profileData.business_type || 'B2C',
      preferred_channel: channel,
      telegram_chat_id: channel === 'telegram' ? chatId : null,
      zalo_user_id: channel === 'zalo' ? chatId : null,
      status: 'active',
    })
    .select()
    .single()

  if (error || !newClient) throw new Error(`Failed to create client: ${error?.message}`)

  // Save brand profile
  await supabaseAdmin.from('brand_profiles').insert({
    client_id: newClient.id,
    version: 1,
    profile_data: profileData,
    is_active: true,
  })

  // Index vào RAG
  await indexBrandProfile(newClient.id, profileData)

  // Format confirmation message
  const confirmRaw = await callClaude({
    systemPrompt: PROMPT_1E_CONFIRMATION,
    userMessage: JSON.stringify({ brand_profile_json: profileData, language }),
    maxTokens: 500,
    temperature: 0.2,
    module: 'MODULE_1E',
  })

  await sendMessage(channel, chatId, confirmRaw)

  // Notify internal team
  if (process.env.INTERNAL_TELEGRAM_CHAT_ID) {
    await sendTelegramMessage(
      process.env.INTERNAL_TELEGRAM_CHAT_ID,
      `🆕 *Client mới onboard!*\n\n*${profileData.brand_name}*\nNgành: ${profileData.industry}\nPlatforms: ${profileData.platforms?.join(', ')}\nID: \`${newClient.id}\``
    )
  }

  log('MODULE_1', 'success', `Client onboarded: ${clientCode}`)
}

async function sendMessage(channel: 'telegram' | 'zalo', chatId: string, text: string) {
  if (channel === 'telegram') {
    await sendTelegramMessage(chatId, text)
  } else {
    await sendZaloMessage(chatId, text)
  }
}
