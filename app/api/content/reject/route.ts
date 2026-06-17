export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { postId, reason } = await req.json()

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    await supabaseAdmin
      .from('content_queue')
      .update({ status: 'rejected', rejection_reason: reason || '' })
      .eq('id', postId)

    log('API_REJECT', 'success', `Post ${postId} rejected — reason: ${reason}`)
    return NextResponse.json({ ok: true, postId })
  } catch (error: any) {
    log('API_REJECT', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
