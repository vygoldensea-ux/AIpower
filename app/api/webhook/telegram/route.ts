export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { handleBriefBot } from '@/lib/modules/module1-brief-bot'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'

// Chat IDs của team nội bộ GoldenSea — thêm vào Railway Variables: INTERNAL_CHAT_IDS=id1,id2
function isInternalUser(chatId: string): boolean {
  const ids = (process.env.INTERNAL_CHAT_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  return ids.includes(chatId)
}

async function getOrCreateInternalClient(chatId: string) {
  // Tìm client đã có
  const { data: existing } = await supabaseAdmin
    .from('clients')
    .select('*, brand_profiles(profile_data)')
    .eq('telegram_chat_id', chatId)
    .single()
  if (existing) return existing

  // Tạo record internal user tự động
  const { data: newClient } = await supabaseAdmin
    .from('clients')
    .insert({
      client_code: `INTERNAL_${chatId}`,
      brand_name: 'GoldenSea Studios',
      industry: 'it-outsourcing',
      business_type: 'B2B',
      preferred_channel: 'telegram',
      telegram_chat_id: chatId,
      status: 'active',
    })
    .select('*, brand_profiles(profile_data)')
    .single()

  log('TELEGRAM_WEBHOOK', 'info', `Auto-created internal client for chat_id: ${chatId}`)
  return newClient
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-telegram-bot-api-secret-token')
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      log('TELEGRAM_WEBHOOK', 'warn', 'Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    log('TELEGRAM_WEBHOOK', 'info', 'Received update', { update_id: body.update_id })

    const message = body.message || body.edited_message
    if (!message?.text) return NextResponse.json({ ok: true })

    const chatId = message.chat.id.toString()
    const text = message.text
    const userId = message.from?.id?.toString()

    log('TELEGRAM_WEBHOOK', 'info', `Message from ${chatId}: ${text.slice(0, 50)}`)

    // Internal team → tự động có client record, đi thẳng vào content mode
    if (isInternalUser(chatId)) {
      const client = await getOrCreateInternalClient(chatId)
      const { handleContentRequest } = await import('@/lib/modules/module2-content-brain')
      await handleContentRequest({ chatId, text, client, channel: 'telegram' })
      return NextResponse.json({ ok: true })
    }

    // External client flow
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('*, brand_profiles(profile_data)')
      .eq('telegram_chat_id', chatId)
      .single()

    if (!client || client.status === 'onboarding') {
      await handleBriefBot({ chatId, text, userId, channel: 'telegram', existingClient: client })
    } else {
      const { handleContentRequest } = await import('@/lib/modules/module2-content-brain')
      await handleContentRequest({ chatId, text, client, channel: 'telegram' })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    log('TELEGRAM_WEBHOOK', 'error', error.message)
    return NextResponse.json({ ok: true })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Telegram webhook active', timestamp: new Date().toISOString() })
}
