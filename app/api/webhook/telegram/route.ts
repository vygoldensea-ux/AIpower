export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { handleBriefBot } from '@/lib/modules/module1-brief-bot'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'

const INTERNAL_USERS: Record<string, { name: string; role: string; industry: string }> = {
  '5492626179': {
    name: 'Vy Hoàng',
    role: 'Business Development Manager',
    industry: 'it-outsourcing',
  },
}

function getInternalUser(chatId: string) {
  const ids = (process.env.INTERNAL_CHAT_IDS || '').split(',').map(s => s.trim())
  if (ids.includes(chatId)) return INTERNAL_USERS[chatId] || { name: 'Team Member', role: 'Staff', industry: 'it-outsourcing' }
  return INTERNAL_USERS[chatId] || null
}

async function getOrCreateInternalClient(chatId: string, user: { name: string; role: string; industry: string }) {
  const { data: existing } = await supabaseAdmin
    .from('clients')
    .select('*, brand_profiles(profile_data)')
    .eq('telegram_chat_id', chatId)
    .single()
  if (existing) return existing

  const { data: newClient } = await supabaseAdmin
    .from('clients')
    .insert({
      client_code: `INTERNAL_${chatId}`,
      brand_name: 'GoldenSea Studios',
      industry: user.industry,
      business_type: 'B2B',
      preferred_channel: 'telegram',
      telegram_chat_id: chatId,
      status: 'active',
    })
    .select('*, brand_profiles(profile_data)')
    .single()

  log('TELEGRAM_WEBHOOK', 'info', `Created internal client for ${user.name} (${user.role})`)
  return newClient
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-telegram-bot-api-secret-token')
    if (process.env.TELEGRAM_WEBHOOK_SECRET && secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    log('TELEGRAM_WEBHOOK', 'info', 'Received update', { update_id: body.update_id })

    const message = body.message || body.edited_message
    if (!message?.text) return NextResponse.json({ ok: true })

    const chatId = message.chat.id.toString()
    const text = message.text

    log('TELEGRAM_WEBHOOK', 'info', `Message from ${chatId}: ${text.slice(0, 50)}`)

    const internalUser = getInternalUser(chatId)

    if (internalUser) {
      const client = await getOrCreateInternalClient(chatId, internalUser)
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
      await handleBriefBot({ chatId, text, userId: message.from?.id?.toString(), channel: 'telegram', existingClient: client })
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
