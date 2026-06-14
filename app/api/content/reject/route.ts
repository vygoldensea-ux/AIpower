import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function POST(req: NextRequest) {
  const { postId, reason } = await req.json()
  await supabaseAdmin.from('content_queue').update({ status: 'rejected', rejection_reason: reason }).eq('id', postId)
  return NextResponse.json({ success: true })
}
