export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { generateWeeklyCalendar } from '@/lib/modules/module4-scheduler'
import { log } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  try {
    const { clientId, weekStart } = await req.json()

    if (!clientId || !weekStart) {
      return NextResponse.json({ error: 'clientId and weekStart are required' }, { status: 400 })
    }

    const result = await generateWeeklyCalendar(clientId, weekStart)
    if (!result) {
      return NextResponse.json({ ok: true, message: 'No approved posts to schedule' })
    }

    return NextResponse.json({ ok: true, result })
  } catch (error: any) {
    log('API_SCHEDULE_PLAN', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
