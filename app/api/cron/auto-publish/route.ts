export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { publishPost } from '@/lib/social/ayrshare'
import { sendTelegramMessage } from '@/lib/bots/messenger'
import { log } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Find posts due to publish (scheduled_at <= now, status = 'approved' or 'scheduled')
  const { data: posts, error } = await supabaseAdmin
    .from('content_queue')
    .select('*, clients(telegram_chat_id, preferred_channel)')
    .in('status', ['approved', 'scheduled'])
    .lte('scheduled_at', now.toISOString())
    .is('published_at', null)
    .limit(10)

  if (error) {
    log('CRON_PUBLISH', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!posts?.length) {
    return NextResponse.json({ ok: true, published: 0 })
  }

  let published = 0
  for (const post of posts) {
    const content = post.copy_en || post.copy_vi || ''
    if (!content) continue

    try {
      const result = await publishPost({
        post: content,
        platforms: post.platforms || ['linkedin'],
      })

      await supabaseAdmin
        .from('content_queue')
        .update({
          status: 'published',
          published_at: now.toISOString(),
          ayrshare_id: result.id,
        })
        .eq('id', post.id)

      // Notify user on Telegram
      const chatId = post.clients?.telegram_chat_id
      if (chatId) {
        await sendTelegramMessage(chatId, `Đã đăng bài lên ${post.platforms?.join(', ')} lúc ${now.toLocaleTimeString('vi-VN')} rồi Vy.`)
      }

      published++
      log('CRON_PUBLISH', 'success', `Published post ${post.post_code}`)
    } catch (e: any) {
      log('CRON_PUBLISH', 'error', `Failed to publish ${post.post_code}: ${e.message}`)
      await supabaseAdmin
        .from('content_queue')
        .update({ status: 'error', rejection_reason: e.message })
        .eq('id', post.id)
    }
  }

  return NextResponse.json({ ok: true, published })
}
