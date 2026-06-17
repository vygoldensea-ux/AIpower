export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'
import { generateContent } from '@/lib/modules/module2-content-brain'
import { generateWeeklyCalendar } from '@/lib/modules/module4-scheduler'
import { log } from '@/lib/utils/logger'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: clients } = await supabaseAdmin
    .from('clients')
    .select('id, brand_profiles(profile_data)')
    .eq('status', 'active')

  const results: Array<{ clientId: string; status: string; error?: string }> = []

  for (const client of clients || []) {
    try {
      log('CRON_CONTENT', 'info', `Generating content for client ${client.id}`)

      const profile = (client as any).brand_profiles?.[0]?.profile_data || {}
      const platforms = profile.platforms || ['facebook']

      await generateContent({
        clientId: client.id,
        platforms,
        contentType: 'regular',
      })

      // Auto-schedule newly approved posts
      const weekStart = new Date().toISOString().split('T')[0]
      await generateWeeklyCalendar(client.id, weekStart)

      results.push({ clientId: client.id, status: 'ok' })
    } catch (error: any) {
      log('CRON_CONTENT', 'error', `Client ${client.id}: ${error.message}`)
      results.push({ clientId: client.id, status: 'error', error: error.message })
    }
  }

  return NextResponse.json({ success: true, results })
}
