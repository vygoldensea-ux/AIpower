// Fetch latest AI news from VnExpress — called live before each post generation
export async function fetchLatestAINews(): Promise<string> {
  try {
    const res = await fetch('https://vnexpress.net/khoa-hoc-cong-nghe/ai', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GoldenSeaBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    const html = await res.text()

    const titles: string[] = []
    const re = /class="title-news[^"]*"[^>]*>\s*<a[^>]*>([^<]+)<\/a>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null) {
      const t = m[1].trim()
      if (t && titles.length < 20) titles.push(t)
    }

    if (titles.length === 0) return ''

    return `## Latest AI News (VnExpress, live — use as hooks/proof points, never summarize directly):\n${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
  } catch {
    return ''
  }
}
