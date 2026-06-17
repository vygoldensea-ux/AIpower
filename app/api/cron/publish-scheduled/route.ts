import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { publishScheduledPost } from '@/lib/modules/module4-scheduler'
import { log } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: duePosts } = await supabaseAdmin
    .from('content_queue')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  let published = 0
  for (const post of duePosts || []) {
    try {
      await publishScheduledPost(post.id)
      published++
    } catch (error: any) {
      log('CRON_PUBLISH', 'error', `Failed to publish ${post.id}: ${error.message}`)
    }
  }

  return NextResponse.json({ success: true, published })
}
