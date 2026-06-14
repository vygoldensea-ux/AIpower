import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, brand_profiles(profile_data)')
    .eq('status', 'active')

  for (const client of clients || []) {
    log('CRON_CONTENT', 'info', `Processing client ${client.id}`)
    // generateContent will be called in Phase 3
  }

  return NextResponse.json({ success: true, clients_processed: clients?.length || 0 })
}
