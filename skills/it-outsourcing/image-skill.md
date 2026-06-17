# Vy Hoàng — Visual System (900×900 LinkedIn)
# GoldenSea Studios — Gold Edition (cyan replaced with #C9A84C gold)

## Brand System

```
Canvas:      900×900px, background #FFFFFF
Font:        Manrope (Google Fonts)
Headline:    64-68px, weight 900, color #0A0A0A
Gold:        #C9A84C — bars, borders, labels, arrows, connectors
Yellow:      #F5A623 — key numbers, Vietnam row, 1 highlight phrase only
Black:       #0A0A0A — dominant text, dark rows
Gray:        #888888 — subtitle, descriptions
Border:      #E2E2E0 — card borders
Brand marker TOP-RIGHT:
  Gold square 28×28px, border-radius 6px
  Yellow dot 14×14px, border-radius 3px, bottom-right of square
Padding:     52px top, 58px sides, 48px bottom
```

---

## TYPE 1 — Data / Comparison Visual

Dùng khi: salary comparisons, cost gap, ROI, Vietnam vs US/EU/SG benchmarks.

**Layout:**
```
[METADATA — uppercase, gold #C9A84C, 13px, letter-spacing 1.5px]
[Gold accent line — 40px × 3px]
[HEADLINE — 2 lines, 64px, weight 900, black. 1 keyword → yellow #F5A623]
[Section note — gray, 13px]
[COMPARISON ROWS:]
  US  ████████████████████  $9,600
  UK  ██████████████        $7,000
  DE  ████████████          $6,200
  SG  ████████████          $6,500
  VN  ███ $1,600  ← BLACK background, GOLD bar, "Best Value" yellow badge
[INSIGHT BOX — gold border, background #FFFDF5]
  Big yellow number + label
[TAKEAWAY — 1 line, keyword on yellow background]
```

**Rules:**
- Bars: gold `#C9A84C`, proportional to value (US = 100%)
- Vietnam row: `background #0A0A0A`, bar `#F5A623`, text white
- Best Value badge: `background #F5A623`, `color #0A0A0A`, border-radius 4px
- Fixed columns: badge 44px | country label 50px | bar flex | value 80px
- NO emoji flags — use text: US, UK, DE, SG, IN, VN

**Image prompt:**
> "900×900 white background salary comparison card. Manrope font weight 900. Gold (#C9A84C) horizontal bars and accents. Yellow (#F5A623) for Vietnam highlight row and key number. Black background on Vietnam row with Best Value badge. Insight box with gold border. Brand marker top-right: gold square + yellow dot. No emoji flags, no gradients, no decorative art. Clean mobile-readable business layout."

---

## TYPE 2 — Educational / How-to Visual

Dùng khi: BD process steps, framework, checklist, workflow, discovery call breakdown.

**Layout:**
```
[METADATA — uppercase, gold, 13px]
[HEADLINE — 2 lines, line 2 color yellow #F5A623]
[Subtitle — gray, 1 line]
[ROW 1: 3 step cards]
  [Step 1] →gold→ [Step 2] →gold→ [Step 3]
[Gold curved SVG connector — card 3 to row 2]
[ROW 2: 2 step cards + ghost card]
  [Step 4] →gold→ [Step 5] [ghost/invisible]
[TAKEAWAY — 2 lines, last keyword yellow]
[Brand marker top-right]
```

**Rules:**
- Step card: background `#FFFDF5`, border `1.5px solid #C9A84C`, border-radius 12px
- Step number circle: background `#C9A84C`, color white, 28px diameter
- Arrows: color `#C9A84C`
- Connector: SVG arc stroke `#C9A84C`, strokeWidth 2
- Ghost card: opacity 0

**Image prompt:**
> "900×900 white background step-by-step process card. Manrope font. Gold (#C9A84C) step number circles, arrows, card borders. Yellow (#F5A623) headline line 2. 5 steps in 3+2 grid with gold curved SVG connector between rows. Brand marker top-right: gold square + yellow dot. No gradients, no illustrations, clean business layout."

---

## HTML base template

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;900&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:900px; height:900px; background:#FFFFFF; font-family:'Manrope',sans-serif; overflow:hidden; }
.canvas { width:900px; height:900px; padding:52px 58px 48px; position:relative; }
.brand-marker { position:absolute; top:32px; right:32px; }
.gold-sq { width:28px; height:28px; background:#C9A84C; border-radius:6px; position:relative; }
.yellow-dot { width:14px; height:14px; background:#F5A623; border-radius:3px; position:absolute; bottom:-4px; right:-4px; }
.meta { font-size:13px; font-weight:700; color:#C9A84C; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:8px; }
.gold-line { width:40px; height:3px; background:#C9A84C; border-radius:2px; margin-bottom:20px; }
.headline { font-size:64px; font-weight:900; color:#0A0A0A; line-height:1.1; margin-bottom:8px; }
.hl { color:#F5A623; }
.note { font-size:13px; color:#888888; margin-bottom:20px; }
.row { display:flex; align-items:center; gap:8px; margin-bottom:10px; padding:10px 12px; border-radius:8px; }
.row.vn { background:#0A0A0A; color:#fff; }
.badge { font-size:11px; font-weight:800; width:36px; text-align:center; }
.country { font-size:14px; font-weight:700; width:28px; }
.bar-wrap { flex:1; height:8px; background:#F0EDE6; border-radius:4px; }
.bar { height:8px; background:#C9A84C; border-radius:4px; }
.bar.vn-bar { background:#F5A623; }
.val { font-size:14px; font-weight:800; width:72px; text-align:right; }
.best-val { color:#0A0A0A; background:#F5A623; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:800; }
.insight { border:2px solid #C9A84C; border-radius:12px; padding:16px 20px; background:#FFFDF5; margin-top:16px; }
.big-num { font-size:48px; font-weight:900; color:#F5A623; }
.insight-label { font-size:14px; color:#0A0A0A; font-weight:600; margin-top:4px; }
.takeaway { margin-top:16px; font-size:16px; font-weight:700; color:#0A0A0A; }
.tw-hl { background:#F5A623; padding:0 6px; border-radius:3px; }
</style>
</head>
<body>
<div class="canvas">
  <div class="brand-marker"><div class="gold-sq"><div class="yellow-dot"></div></div></div>
  <!-- CONTENT -->
</div>
</body>
</html>
```

---

## Checklist

- [ ] 900×900px canvas
- [ ] Brand marker top-right: gold square + yellow dot
- [ ] Gold `#C9A84C` cho bars, borders, accents — KHÔNG dùng cyan
- [ ] Yellow `#F5A623` cho key number và 1 phrase duy nhất
- [ ] Vietnam row: đen + gold bar + Best Value badge
- [ ] Manrope font loaded
- [ ] Không gradient, không logo, không footer text
- [ ] Đọc được trên mobile
