import { NextRequest, NextResponse } from 'next/server'
import { handleBriefBot } from '@/lib/modules/module1-brief-bot'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret
    const secret = req.headers.get('x-telegram-bot-api-secret-token')
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      log('TELEGRAM_WEBHOOK', 'warn', 'Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    log('TELEGRAM_WEBHOOK', 'info', 'Received update', { update_id: body.update_id })

    const message = body.message || body.edited_message
    if (!message?.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id.toString()
    const text = message.text
    const userId = message.from?.id?.toString()

    log('TELEGRAM_WEBHOOK', 'info', `Message from ${chatId}: ${text.slice(0, 50)}`)

    // Lookup existing client
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('*, brand_profiles(profile_data)')
      .eq('telegram_chat_id', chatId)
      .single()

    if (!client || client.status === 'onboarding' || client.status === undefined) {
      // New client hoặc đang onboarding → Brief Bot
      await handleBriefBot({ chatId, text, userId, channel: 'telegram', existingClient: client })
    } else {
      // Client đã active → xử lý content request (Phase 3)
      const { handleContentRequest } = await import('@/lib/modules/module2-content-brain')
      await handleContentRequest({ chatId, text, client, channel: 'telegram' })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    log('TELEGRAM_WEBHOOK', 'error', error.message)
    // Luôn return 200 để Telegram không retry
    return NextResponse.json({ ok: true })
  }
}

// GET để kiểm tra webhook đang sống
export async function GET() {
  return NextResponse.json({
    status: 'Telegram webhook active',
    timestamp: new Date().toISOString(),
  })
}
