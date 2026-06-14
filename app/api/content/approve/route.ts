import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  const { postId, scheduledAt } = await req.json()
  await supabaseAdmin.from('content_queue').update({ status: 'approved', scheduled_at: scheduledAt }).eq('id', postId)
  return NextResponse.json({ success: true })
}
