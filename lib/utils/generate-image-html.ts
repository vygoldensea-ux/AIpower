// Generate 900x900 LinkedIn image HTML for Vy Hoàng — GoldenSea Gold Edition

export interface ComparisonRow {
  badge: string
  label: string
  value: string
  amount: number // for bar width calculation
  isHighlight?: boolean
}

export interface ImageData {
  type: 'comparison' | 'educational' | 'statement' | 'mindmap' | 'datatable'
  meta: string
  headline: string
  headline_line2?: string
  headlineHighlight?: string
  rows?: ComparisonRow[]
  insightNumber?: string
  insightLabel?: string
  takeaway?: string
  takeawayHighlight?: string
  steps?: { title: string; desc: string }[]
  subtitle?: string
  statNumber?: string
  statLabel?: string
  bodyText?: string
  // mindmap
  centerNode?: string
  branches?: { label: string; items: string[] }[]
  // datatable
  tableHeaders?: string[]
  tableRows?: string[][]
  tableHighlightRow?: number
}

const BASE_STYLES = `
* { margin:0; padding:0; box-sizing:border-box; }
body { width:900px; height:900px; background:#FFFFFF; font-family:'Manrope',sans-serif; overflow:hidden; }
.canvas { width:900px; height:900px; padding:52px 58px 48px; position:relative; display:flex; flex-direction:column; }
.brand-marker { position:absolute; top:32px; right:32px; }
.gold-sq { width:28px; height:28px; background:#C9A84C; border-radius:6px; position:relative; }
.yellow-dot { width:14px; height:14px; background:#F5A623; border-radius:3px; position:absolute; bottom:-4px; right:-4px; }
.meta { font-size:13px; font-weight:700; color:#C9A84C; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:10px; }
.gold-line { width:40px; height:3px; background:#C9A84C; border-radius:2px; margin-bottom:18px; }
.headline { font-size:58px; font-weight:900; color:#0A0A0A; line-height:1.1; margin-bottom:6px; }
.hl { color:#F5A623; }
.note { font-size:12px; color:#888888; margin-bottom:14px; }
`

export function generateComparisonHTML(data: ImageData): string {
  const rows = data.rows || []
  const maxAmount = Math.max(...rows.map(r => r.amount), 1)

  // Strip emoji from badge — Puppeteer headless can't render flag emoji
  const cleanBadge = (b: string) => b.replace(/[\u{1F300}-\u{1FFFF}]/gu, '').replace(/[\u{FE00}-\u{FE0F}]/gu, '').trim() || b.slice(0, 3)

  const rowsHTML = rows.map(r => {
    const pct = Math.round((r.amount / maxAmount) * 100)
    const isHL = !!r.isHighlight
    const bg = isHL ? '#0A0A0A' : '#FFFDF5'
    const border = isHL ? '2px solid #F5A623' : '2px solid #E8E2D4'
    const badgeBg = isHL ? '#F5A623' : '#C9A84C'
    const badgeColor = '#0A0A0A'
    const labelColor = isHL ? '#FFFFFF' : '#0A0A0A'
    const valueColor = isHL ? '#F5A623' : '#0A0A0A'
    const barBg = isHL ? 'rgba(255,255,255,0.12)' : '#EDE8DC'
    const barFill = isHL ? '#F5A623' : '#C9A84C'
    const badge = cleanBadge(r.badge)
    return `
    <div style="background:${bg};border:${border};border-radius:14px;padding:20px 24px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="background:${badgeBg};color:${badgeColor};font-size:13px;font-weight:900;padding:5px 10px;border-radius:7px;letter-spacing:0.5px;min-width:44px;text-align:center;">${badge}</div>
          <div style="font-size:17px;font-weight:700;color:${labelColor};line-height:1.2;">${r.label}</div>
        </div>
        <div style="font-size:26px;font-weight:900;color:${valueColor};">${r.value}</div>
      </div>
      <div style="background:${barBg};border-radius:6px;height:12px;width:100%;">
        <div style="background:${barFill};border-radius:6px;height:12px;width:${pct}%;transition:none;"></div>
      </div>
      ${isHL ? `<div style="margin-top:10px;font-size:11px;font-weight:800;color:#F5A623;letter-spacing:1px;text-transform:uppercase;">Best Value</div>` : ''}
    </div>`
  }).join('')

  const headlineHTML = data.headlineHighlight
    ? data.headline.replace(data.headlineHighlight, `<span class="hl">${data.headlineHighlight}</span>`)
    : data.headline

  const line2 = data.headline_line2
    ? `<div style="font-size:54px;font-weight:900;color:#C9A84C;line-height:1.05;margin-bottom:8px;">${data.headline_line2}</div>`
    : ''

  const takeawayHL = data.takeawayHighlight && data.takeaway
    ? data.takeaway.replace(data.takeawayHighlight, `<span style="background:#F5A623;color:#0A0A0A;padding:1px 6px;border-radius:3px;">${data.takeawayHighlight}</span>`)
    : data.takeaway

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="canvas">
  <div class="brand-marker"><div class="gold-sq"><div class="yellow-dot"></div></div></div>
  <div class="meta">${data.meta}</div>
  <div class="gold-line"></div>
  <div class="headline">${headlineHTML}</div>
  ${line2}
  <div style="margin-top:28px;flex:1;display:flex;flex-direction:column;justify-content:center;">${rowsHTML}</div>
  ${data.insightNumber ? `
  <div style="border:2px solid #C9A84C;border-radius:14px;padding:18px 24px;background:#FFFDF5;margin-top:12px;display:flex;align-items:center;gap:20px;">
    <div style="font-size:48px;font-weight:900;color:#F5A623;line-height:1;">${data.insightNumber}</div>
    <div style="font-size:15px;color:#0A0A0A;font-weight:600;line-height:1.3;">${data.insightLabel || ''}</div>
  </div>` : ''}
  ${takeawayHL ? `<div style="margin-top:16px;font-size:15px;font-weight:700;color:#0A0A0A;line-height:1.4;">${takeawayHL}</div>` : ''}
</div>
</body>
</html>`
}

export function generateEducationalHTML(data: ImageData): string {
  const steps = data.steps || []

  const stepCard = (s: { title: string; desc: string }, i: number) => `
    <div style="flex:1;background:#FFFDF5;border:1.5px solid #C9A84C;border-radius:12px;padding:14px 12px;">
      <div style="width:28px;height:28px;background:#C9A84C;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:13px;margin-bottom:8px;">${i + 1}</div>
      <div style="font-size:13px;font-weight:700;color:#0A0A0A;margin-bottom:4px;">${s.title}</div>
      <div style="font-size:11px;color:#888888;line-height:1.4;">${s.desc}</div>
    </div>`

  const row1 = steps.slice(0, 3)
  const row2 = steps.slice(3, 5)

  const headlineLines = data.headline.split('\n')
  const line2 = headlineLines[1] ? `<br><span class="hl">${headlineLines[1]}</span>` : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="canvas">
  <div class="brand-marker"><div class="gold-sq"><div class="yellow-dot"></div></div></div>
  <div class="meta">${data.meta}</div>
  <div class="gold-line"></div>
  <div class="headline" style="font-size:50px;">${headlineLines[0]}${line2}</div>
  ${data.subtitle ? `<div style="font-size:14px;color:#888888;margin-bottom:16px;">${data.subtitle}</div>` : ''}
  <div style="display:flex;gap:12px;margin-top:12px;align-items:stretch;">
    ${row1.map((s, i) => stepCard(s, i)).join('<div style="display:flex;align-items:center;color:#C9A84C;font-size:20px;font-weight:900;padding:0 2px;">→</div>')}
  </div>
  ${row2.length ? `
  <div style="display:flex;justify-content:flex-start;margin:6px 0 0 20px;">
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><path d="M25 2 Q28 15 10 15" stroke="#C9A84C" stroke-width="2" fill="none"/><path d="M10 15 L10 28" stroke="#C9A84C" stroke-width="2"/><polygon points="6,25 10,30 14,25" fill="#C9A84C"/></svg>
  </div>
  <div style="display:flex;gap:12px;margin-top:4px;">
    ${row2.map((s, i) => stepCard(s, i + 3)).join('<div style="display:flex;align-items:center;color:#C9A84C;font-size:20px;font-weight:900;padding:0 2px;">→</div>')}
    <div style="flex:1;"></div>
  </div>` : ''}
  ${data.takeaway ? `
  <div style="margin-top:auto;padding-top:14px;font-size:15px;font-weight:700;color:#0A0A0A;line-height:1.5;">
    ${data.takeawayHighlight ? data.takeaway.replace(data.takeawayHighlight, `<span style="background:#F5A623;padding:0 5px;border-radius:3px;">${data.takeawayHighlight}</span>`) : data.takeaway}
  </div>` : ''}
</div>
</body>
</html>`
}

export function generateStatementHTML(data: ImageData): string {
  const headlineLines = data.headline.split('\n')
  const line1 = headlineLines[0] || ''
  const line2 = headlineLines[1] || ''

  const headlineHTML = data.headlineHighlight
    ? (line1 + (line2 ? `\n${line2}` : '')).replace(
        data.headlineHighlight,
        `<span class="hl">${data.headlineHighlight}</span>`
      )
    : line1

  const line2HTML = line2
    ? `<div style="font-size:64px;font-weight:900;color:#C9A84C;line-height:1.05;margin-top:2px;">${line2}</div>`
    : ''

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>${BASE_STYLES}
.big-stat { font-size:88px; font-weight:900; color:#C9A84C; line-height:1; }
.stat-label { font-size:18px; font-weight:600; color:#888888; margin-top:6px; }
.divider { width:60px; height:4px; background:#C9A84C; border-radius:2px; margin:24px 0; }
.body { font-size:17px; color:#344054; line-height:1.65; font-weight:500; max-width:760px; }
.tw { font-size:20px; font-weight:700; color:#0A0A0A; line-height:1.4; margin-top:auto; padding-top:16px; }
.tw .tw-hl { background:#F5A623; padding:1px 8px; border-radius:4px; }
</style>
</head>
<body>
<div class="canvas">
  <div class="brand-marker"><div class="gold-sq"><div class="yellow-dot"></div></div></div>

  <div class="meta">${data.meta}</div>
  <div class="gold-line"></div>

  ${data.statNumber ? `
  <div class="big-stat">${data.statNumber}</div>
  <div class="stat-label">${data.statLabel || ''}</div>
  <div class="divider"></div>
  ` : ''}

  <div style="font-size:58px;font-weight:900;color:#0A0A0A;line-height:1.05;max-width:780px;">${headlineHTML}</div>
  ${line2HTML}

  ${data.bodyText ? `<div class="body" style="margin-top:20px;">${data.bodyText}</div>` : ''}

  ${data.takeaway ? `
  <div class="tw">
    ${data.takeawayHighlight
      ? data.takeaway.replace(data.takeawayHighlight, `<span class="tw-hl">${data.takeawayHighlight}</span>`)
      : data.takeaway}
  </div>` : ''}
</div>
</body>
</html>`
}

export function generateMindMapHTML(data: ImageData): string {
  const branches = data.branches || []
  const colors = ['#C9A84C', '#F5A623', '#0A0A0A', '#888888']

  const row1 = branches.slice(0, 2)
  const row2 = branches.slice(2, 4)

  const row1HTML = row1.map((b, i) => {
    const col = colors[i % colors.length]
    const items = b.items.map(item =>
      `<div style="font-size:12px;color:#344054;padding:4px 10px;background:#F9F6EE;border-radius:6px;margin-bottom:4px;border-left:3px solid ${col};">${item}</div>`
    ).join('')
    return `<div style="background:#FFFDF5;border:2px solid ${col};border-radius:12px;padding:14px 16px;flex:1;min-width:0;"><div style="font-size:13px;font-weight:800;color:${col};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">${b.label}</div>${items}</div>`
  }).join('<div style="width:16px;"></div>')

  const row2HTML = row2.map((b, i) => {
    const col = colors[(i + 2) % colors.length]
    const items = b.items.map(item =>
      `<div style="font-size:12px;color:#344054;padding:4px 10px;background:#F9F6EE;border-radius:6px;margin-bottom:4px;border-left:3px solid ${col};">${item}</div>`
    ).join('')
    return `<div style="background:#FFFDF5;border:2px solid ${col};border-radius:12px;padding:14px 16px;flex:1;min-width:0;"><div style="font-size:13px;font-weight:800;color:${col};text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">${b.label}</div>${items}</div>`
  }).join('<div style="width:16px;"></div>')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="canvas">
  <div class="brand-marker"><div class="gold-sq"><div class="yellow-dot"></div></div></div>
  <div class="meta">${data.meta}</div>
  <div class="gold-line"></div>
  <div style="font-size:46px;font-weight:900;color:#0A0A0A;line-height:1.1;margin-bottom:4px;">${data.headline}</div>
  ${data.headline_line2 ? `<div style="font-size:46px;font-weight:900;color:#C9A84C;line-height:1.1;margin-bottom:12px;">${data.headline_line2}</div>` : ''}
  ${data.centerNode ? `
  <div style="display:inline-block;background:#0A0A0A;color:#F5A623;font-size:14px;font-weight:800;padding:8px 20px;border-radius:20px;margin-bottom:14px;letter-spacing:0.5px;">
    ${data.centerNode}
  </div>` : ''}
  <div style="display:flex;gap:16px;flex:1;margin-bottom:12px;">${row1HTML}</div>
  ${row2HTML ? `<div style="display:flex;gap:16px;">${row2HTML}</div>` : ''}
  ${data.takeaway ? `
  <div style="margin-top:12px;font-size:14px;font-weight:700;color:#0A0A0A;">
    ${data.takeawayHighlight
      ? data.takeaway.replace(data.takeawayHighlight, `<span style="background:#F5A623;padding:0 5px;border-radius:3px;">${data.takeawayHighlight}</span>`)
      : data.takeaway}
  </div>` : ''}
</div>
</body>
</html>`
}

export function generateDataTableHTML(data: ImageData): string {
  const headers = data.tableHeaders || []
  const rows = data.tableRows || []
  const hlRow = data.tableHighlightRow ?? -1

  const headerHTML = headers.map(h =>
    `<th style="font-size:12px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:0.8px;padding:10px 14px;text-align:left;border-bottom:2px solid #C9A84C;">${h}</th>`
  ).join('')

  const rowsHTML = rows.map((r, ri) => {
    const isHL = ri === hlRow
    const bg = isHL ? '#0A0A0A' : ri % 2 === 0 ? '#FFFDF5' : '#FFFFFF'
    const cells = r.map((cell, ci) => {
      const isFirst = ci === 0
      const cellColor = isHL ? (isFirst ? '#F5A623' : '#FFFFFF') : (isFirst ? '#0A0A0A' : '#344054')
      const fw = isFirst || isHL ? '700' : '500'
      return `<td style="font-size:13px;font-weight:${fw};color:${cellColor};padding:10px 14px;border-bottom:1px solid #EAECF0;">${cell}</td>`
    }).join('')
    return `<tr style="background:${bg};">${cells}${isHL ? '<td style="padding:6px 10px;border-bottom:1px solid #EAECF0;"><span style="font-size:10px;font-weight:800;background:#F5A623;color:#0A0A0A;padding:2px 8px;border-radius:4px;white-space:nowrap;">Best</span></td>' : '<td style="border-bottom:1px solid #EAECF0;"></td>'}</tr>`
  }).join('')

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>${BASE_STYLES}</style>
</head>
<body>
<div class="canvas">
  <div class="brand-marker"><div class="gold-sq"><div class="yellow-dot"></div></div></div>
  <div class="meta">${data.meta}</div>
  <div class="gold-line"></div>
  <div style="font-size:50px;font-weight:900;color:#0A0A0A;line-height:1.1;margin-bottom:4px;">${data.headline}</div>
  ${data.headline_line2 ? `<div style="font-size:50px;font-weight:900;color:#C9A84C;line-height:1.1;margin-bottom:14px;">${data.headline_line2}</div>` : ''}
  <div style="flex:1;overflow:hidden;">
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr>${headerHTML}</tr></thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  </div>
  ${data.insightNumber ? `
  <div style="border:2px solid #C9A84C;border-radius:10px;padding:12px 18px;background:#FFFDF5;margin-top:10px;display:flex;align-items:center;gap:16px;">
    <div style="font-size:40px;font-weight:900;color:#F5A623;line-height:1;">${data.insightNumber}</div>
    <div style="font-size:14px;color:#0A0A0A;font-weight:600;">${data.insightLabel || ''}</div>
  </div>` : ''}
  ${data.takeaway ? `
  <div style="margin-top:12px;font-size:14px;font-weight:700;color:#0A0A0A;">
    ${data.takeawayHighlight
      ? data.takeaway.replace(data.takeawayHighlight, `<span style="background:#F5A623;padding:0 5px;border-radius:3px;">${data.takeawayHighlight}</span>`)
      : data.takeaway}
  </div>` : ''}
</div>
</body>
</html>`
}
