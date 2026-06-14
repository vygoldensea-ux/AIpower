import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: clients } = await supabaseAdmin.from('clients').select('id').eq('status', 'active')
  return NextResponse.json({ success: true, clients_processed: clients?.length || 0 })
}
