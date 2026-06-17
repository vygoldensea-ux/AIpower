export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/utils/logger'
import fs from 'fs'
import path from 'path'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const res = await fetch('https://vnexpress.net/khoa-hoc-cong-nghe/ai', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GoldenSeaBot/1.0)' },
      next: { revalidate: 0 },
    })
    const html = await res.text()

    // Extract article titles from VnExpress HTML
    const titles: string[] = []
    const re1 = /class="title-news[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g
    let m1: RegExpExecArray | null
    while ((m1 = re1.exec(html)) !== null) {
      const title = m1[1].trim()
      if (title) titles.push(title)
    }

    // Also try h3 titles
    const re2 = /<h3[^>]*class="[^"]*title[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g
    let m2: RegExpExecArray | null
    while ((m2 = re2.exec(html)) !== null) {
      const title = m2[1].trim()
      if (title && !titles.includes(title)) titles.push(title)
    }

    if (titles.length === 0) {
      log('CRON_NEWS', 'warn', 'No titles extracted from VnExpress')
      return NextResponse.json({ ok: true, count: 0 })
    }

    const date = new Date().toISOString().split('T')[0]
    const content = `# AI News Context — Auto-fetched from VnExpress
# Source: https://vnexpress.net/khoa-hoc-cong-nghe/ai
# Last updated: ${date}
# Use as hooks, proof points, or tension for Vy Hoàng's LinkedIn content.
# Frame from BD/outsourcing lens. Never summarize — use as supporting data.

## Latest Headlines

${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

## Post angle examples for Vy

**Hook using Vietnam AI data:**
"Vietnam just ranked 2nd in Southeast Asia for AI adoption.
Yet half the companies I talk to still ask if Vietnamese developers can handle modern stacks.
The data disagrees."

**Hook using talent war angle:**
"US researchers are moving to China to build AGI.
Vietnamese developers are building for US and EU startups.
The talent war is happening — just not where most founders are looking."

**Hook using disruption angle:**
"Pre-ChatGPT unicorns are struggling.
The companies that built Vietnam dev teams 3 years ago are not switching back.
They're doubling down."
`

    const filePath = path.join(process.cwd(), 'skills', 'it-outsourcing', 'ai-news-context.md')
    fs.writeFileSync(filePath, content, 'utf-8')

    log('CRON_NEWS', 'success', `Updated ai-news-context.md with ${titles.length} headlines`)
    return NextResponse.json({ ok: true, count: titles.length, date })
  } catch (error: any) {
    log('CRON_NEWS', 'error', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
