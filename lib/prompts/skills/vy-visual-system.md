# Skill 03 — Visual System (900×900 LinkedIn)

## Mục đích
Tạo hình 900×900 cho bài LinkedIn sáng (bài có hình).
Hình là HTML file → screenshot thành PNG để đăng.

## Phân loại trước khi làm

### TYPE 1 — Data / Comparison Visual
Dùng khi bài có:
- So sánh số liệu (lương, chi phí, ROI)
- Country vs country
- Before vs after metrics
- Bảng benchmark

**Layout TYPE 1:**
- Metadata label top-left (ví dụ: SENIOR DEV • 5 MARKETS • 2026)
- Headline lớn 2 dòng, keyword quan trọng màu vàng (#F5A623)
- Section note: "Estimated monthly cost index, 2026"
- 4-5 rows với flag + tên thị trường + bar + số tiền
- Row Vietnam: background đen, bar vàng, badge "Best Value"
- Insight box: border cyan (#00C2CB), số lớn màu vàng, % cost gap
- Takeaway 1 dòng: keyword quan trọng highlight vàng hoặc nền vàng

### TYPE 2 — Educational / How-to Visual
Dùng khi bài có:
- Các bước (3-6 bước)
- Framework / checklist
- Process / workflow
- Hướng dẫn cách làm

**Layout TYPE 2:**
- Metadata label top-left (ví dụ: N8N WORKFLOW • GUIDE • 2026)
- Headline lớn 2 dòng, dòng 2 màu vàng
- Subtitle 1 dòng màu xám
- Row 1: 3 cards ngang (bước 1-2-3) với mũi tên cyan giữa
- Connector: đường cong cyan từ card 3 xuống bắt đầu row 2
- Row 2: 2 cards (bước 4-5) + 1 ghost card giữ lưới
- Takeaway 2 dòng, keyword cuối màu vàng

## Brand System (KHÔNG thay đổi)

```
Canvas:      900×900px, background #FFFFFF
Font:        Manrope (Google Fonts)
Headline:    font-size 60-68px, weight 900, color #0A0A0A
Cyan:        #00C2CB — labels, bars, borders, arrows, connectors
Yellow:      #F5A623 — key numbers, emphasis, highlight keyword
Black:       #0A0A0A — dominant text, highlight rows
Gray text:   #888888 — subtitle, description
Border:      #E2E2E0 — card borders
Brand marker TOP-RIGHT:
  - Cyan square 28×28px, border-radius 6px
  - Yellow dot 14×14px, border-radius 3px, bottom-right
Padding:     52px top, 58px sides, 48px bottom
```

## Checklist trước khi output

- [ ] Canvas đúng 900×900px
- [ ] Brand marker top-right có đủ cyan square + yellow dot
- [ ] Headline cân đối, không bị break lạ
- [ ] Keyword quan trọng đúng màu vàng
- [ ] Không có footer text
- [ ] Không có logo GoldenSea
- [ ] Đọc được trên mobile
- [ ] Background trắng, không gradient

## Lưu file

Output: `output/images/[topic]-[YYYY-MM-DD].html`
Screenshot thành: `output/images/[topic]-[YYYY-MM-DD].png`
