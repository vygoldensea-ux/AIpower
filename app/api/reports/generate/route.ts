import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyReport } from '@/lib/modules/module5-reporting'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const report = await generateWeeklyReport(clientId)
    return NextResponse.json({ ok: true, report })
  } catch (error: any) {
    log('API_REPORTS_GENERATE', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
