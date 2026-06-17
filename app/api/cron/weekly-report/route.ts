export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { sendWeeklyReport } from '@/lib/modules/module5-reporting'
import { log } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('status', 'active')

  const results: Array<{ clientId: string; status: string; error?: string }> = []

  for (const client of clients || []) {
    try {
      log('CRON_REPORT', 'info', `Sending weekly report for client ${client.id}`)
      await sendWeeklyReport(client.id)
      results.push({ clientId: client.id, status: 'ok' })
    } catch (error: any) {
      log('CRON_REPORT', 'error', `Client ${client.id}: ${error.message}`)
      results.push({ clientId: client.id, status: 'error', error: error.message })
    }
  }

  return NextResponse.json({ success: true, results })
}
