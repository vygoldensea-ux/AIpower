# GYM VIDEO SKILL
# Inject vào Prompt 3C + chọn Remotion template khi industry = gym

## Remotion template cho Gym
Template ID: GymMotivationV1

## Concept clip theo content type

### TIP clip (15–30 giây)
[0–3s] HOOK: Text overlay bold lên nhanh + sound effect
Text: "[Pain point ngắn]" hoặc "[Số liệu sốc]"
Visual: Gym background blur hoặc dark solid

[3–15s] CONTENT: List tips xuất hiện lần lượt
Mỗi tip slide in từ trái → giữ 2s → mờ ra
Font: Bold sans-serif, màu accent (yellow/white)
Icon: Emoji hoặc checkmark ✓

[15–25s] SOLUTION/INSIGHT: Text lớn hơn, contrast cao
"Kết quả: [outcome cụ thể]"

[25–30s] CTA: Logo/brand name fade in
"DM để biết thêm" hoặc "Link in bio"
Background nhạc fade out

### MOTIVATION clip (15–20 giây)
[0–3s] HOOK: Quote lớn + dramatic music hit
Text xuất hiện từng chữ (typewriter effect)
Background: dark với gym silhouette

[3–15s] STORY/BUILD-UP: Text nhỏ hơn giải thích context
Cut to: close-up equipment / hand gripping bar

[15–20s] CLIMAX + CTA: Quote lớn trở lại + brand name
Music hit peak "💪 [Brand name]"

### PROMO clip (20–30 giây)
[0–3s] OFFER HOOK: Giá / % giảm xuất hiện bold
Màu đỏ hoặc vàng trên nền đen
Sound: upbeat, energetic

[3–15s] BENEFITS: 3 benefits xuất hiện lần lượt
Icon + text animation
✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]

[15–25s] SOCIAL PROOF: "X+ học viên đã đăng ký"

[25–30s] CTA MẠNH: "Đăng ký ngay — [deadline]"
Số điện thoại / địa chỉ
Brand logo

## Animation style cho Gym
- Transitions: CUT hoặc QUICK FADE (không slow dissolve)
- Text animation: POP IN hoặc SLIDE UP (không typewriter — trừ motivation)
- Duration: Mỗi text element tối đa 2–3s trên màn hình
- Motion: Fast, energetic

## Music mood cho Gym
- Tip clips: Upbeat electronic / hip-hop instrumental (120–140 BPM)
- Motivation clips: Epic/cinematic build-up + drop
- Promo clips: High energy, upbeat
- TRÁNH: slow, acoustic, lofi

## Text style trong video Gym
Font: Bold geometric sans-serif (Bebas Neue, Impact, hoặc Montserrat Black)
Weight: 800–900 (cực bold)
Case: ALL CAPS cho headlines
Color: White hoặc Electric Yellow #F5E642 trên nền đen
Size: Headline = 80–120px equivalent, Body = 40–60px

## Remotion props cho GymMotivationV1
```typescript
{
  headline: string,        // tối đa 6 từ, ALL CAPS
  subtext: string,         // tối đa 12 từ
  ctaText: string,         // tối đa 5 từ
  brandName: string,
  bgColor: "#0A0A0A",
  accentColor: "#F5E642",
  duration: 150,           // frames @ 30fps = 5s
  animationStyle: "pop" | "slideUp" | "typewriter",
  showLogo: boolean,
  musicMood: "upbeat" | "epic" | "hype"
}
```
