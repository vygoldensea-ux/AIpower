// Generate 900x900 LinkedIn image HTML for Vy Hoàng — GoldenSea Gold Edition

export interface ComparisonRow {
  badge: string
  label: string
  value: string
  amount: number // for bar width calculation
  isHighlight?: boolean
}

export interface ImageData {
  type: 'comparison' | 'educational'
  meta: string
  headline: string
  headlineHighlight?: string
  rows?: ComparisonRow[]
  insightNumber?: string
  insightLabel?: string
  takeaway?: string
  takeawayHighlight?: string
  steps?: { title: string; desc: string }[]
  subtitle?: string
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
  const maxAmount = Math.max(...rows.map(r => r.amount))

  const rowsHTML = rows.map(r => {
    const barWidth = Math.round((r.amount / maxAmount) * 220)
    if (r.isHighlight) {
      return `
      <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;background:#0A0A0A;margin-bottom:7px;">
        <span style="font-size:11px;font-weight:800;color:#F5A623;width:36px;text-align:center;background:rgba(245,166,35,0.15);border-radius:3px;padding:2px 4px;">${r.badge}</span>
        <span style="font-size:14px;font-weight:700;color:#FFFFFF;width:30px;">${r.label}</span>
        <div style="flex:1;height:8px;background:rgba(255,255,255,0.1);border-radius:4px;">
          <div style="height:8px;background:#F5A623;border-radius:4px;width:${barWidth}px;"></div>
        </div>
        <span style="font-size:14px;font-weight:800;color:#F5A623;width:80px;text-align:right;">${r.value}</span>
        <span style="font-size:10px;font-weight:800;background:#F5A623;color:#0A0A0A;padding:2px 7px;border-radius:4px;white-space:nowrap;">Best Value</span>
      </div>`
    }
    return `
    <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:8px;margin-bottom:7px;">
      <span style="font-size:11px;font-weight:700;color:#888888;width:36px;text-align:center;background:#F5F5F5;border-radius:3px;padding:2px 4px;">${r.badge}</span>
      <span style="font-size:14px;font-weight:600;color:#0A0A0A;width:30px;">${r.label}</span>
      <div style="flex:1;height:8px;background:#F0EDE6;border-radius:4px;">
        <div style="height:8px;background:#C9A84C;border-radius:4px;width:${barWidth}px;"></div>
      </div>
      <span style="font-size:14px;font-weight:800;color:#0A0A0A;width:80px;text-align:right;">${r.value}</span>
    </div>`
  }).join('')

  const headlineHTML = data.headlineHighlight
    ? data.headline.replace(data.headlineHighlight, `<span class="hl">${data.headlineHighlight}</span>`)
    : data.headline

  const takeawayHL = data.takeawayHighlight && data.takeaway
    ? data.takeaway.replace(data.takeawayHighlight, `<span style="background:#F5A623;padding:0 5px;border-radius:3px;">${data.takeawayHighlight}</span>`)
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
  <div class="note">Estimated monthly cost index, 2026</div>
  <div style="flex:1;">${rowsHTML}</div>
  ${data.insightNumber ? `
  <div style="border:2px solid #C9A84C;border-radius:12px;padding:14px 20px;background:#FFFDF5;margin-top:8px;">
    <div style="font-size:44px;font-weight:900;color:#F5A623;line-height:1;">${data.insightNumber}</div>
    <div style="font-size:14px;color:#0A0A0A;font-weight:600;margin-top:4px;">${data.insightLabel || ''}</div>
  </div>` : ''}
  ${takeawayHL ? `<div style="margin-top:14px;font-size:15px;font-weight:700;color:#0A0A0A;">${takeawayHL}</div>` : ''}
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
