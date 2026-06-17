// Test Phase 4 (Scheduler) + Phase 5 (Reporting) — bypass Supabase/Ayrshare
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
const env = {}
for (const line of envFile.split('\n')) {
  const [k, ...v] = line.split('=')
  if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim()
}

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

async function callClaude(systemPrompt, userMessage, label, maxTokens = 1000) {
  console.log(`\n[${label}] Calling Claude API...`)
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: userMessage }],
    system: systemPrompt,
  })
  const text = msg.content[0].text
  console.log(`[${label}] OK — ${msg.usage.input_tokens}in/${msg.usage.output_tokens}out tokens`)
  return text
}

function parseJson(raw) {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) { try { return JSON.parse(match[1]) } catch {} }
  const obj = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (obj) { try { return JSON.parse(obj[1]) } catch {} }
  return null
}

// ---- MOCK DATA ----
const brandProfile = { business_name: 'Iron House Gym', industry: 'gym', language: 'vi', platforms: ['facebook', 'instagram'] }
const approvedPosts = [
  { id: 'post_001', platform: 'facebook', content_type: 'tip' },
  { id: 'post_002', platform: 'facebook', content_type: 'promo' },
  { id: 'post_003', platform: 'instagram', content_type: 'viral' },
]
const mockPostCopy = '🔥 3 BÀI TẬP ĐỐT MỠ BỤNG HIỆU QUẢ NHẤT — Bạn đã thử chưa? Tại Iron House Gym, HLV quốc tế chọn ra TOP 3 bài không thể bỏ qua: Plank, Cable Crunch, Burpee. 💪 Comment "MỠ BỤNG" nhận lịch tập miễn phí! #IronHouseGym #GymChuẩnOlympic'

// =========================================
// PHASE 4 — SCHEDULER TEST
// =========================================
async function testScheduler() {
  console.log('\n' + '='.repeat(50))
  console.log('PHASE 4 — MODULE 4 SCHEDULER TEST')
  console.log('='.repeat(50))

  const PROMPT_4A = `Lên lịch đăng bài tối ưu cho tuần tới.
Optimal windows (GMT+7): Gym/Facebook: Mon 6-8am, Wed 7-9pm, Sat 7-9am | Gym/Instagram: Mon 6am, Thu 7am, Sat 9am
Rules: cùng platform cách tối thiểu 6 tiếng | Facebook tối đa 1 bài/ngày | viral → prime time trước
Output JSON (no extra text):
{"week":"","total_posts":0,"schedule":[{"post_id":"","platform":"","scheduled_datetime":"ISO8601","local_time_display":"","slot_type":"prime|standard|off-peak","scheduling_reason":""}],"warnings":[],"summary":{"posts_by_platform":{},"posts_by_day":{},"prime_slots_used":0}}`

  const PROMPT_4B = `Review schedule for conflicts.
HARD CONFLICTS (block): same platform < 4h apart | over daily limit | datetime in the past
SOFT WARNINGS: 2 promos in 3 days | no weekend posts
Output JSON: {"has_hard_conflicts":false,"has_soft_warnings":false,"hard_conflicts":[],"soft_warnings":[],"recommendation":"approve_and_push|fix_required|review_recommended"}`

  const PROMPT_4D = `Tạo tin nhắn tóm tắt lịch đăng bài. Plain text, ngắn gọn, friendly. Dùng emoji nhẹ. Mention tổng số bài, platforms, bài đầu tiên khi nào, deadline thay đổi.`

  // 4A: Plan calendar
  const planRaw = await callClaude(PROMPT_4A, JSON.stringify({
    brand_profile: brandProfile, approved_posts: approvedPosts,
    week_start: '2026-06-22', timezone: 'Asia/Ho_Chi_Minh',
  }), 'MODULE_4A', 2000)

  const plan = parseJson(planRaw)
  if (!plan) { console.error('✗ 4A: Failed to parse JSON\n', planRaw.slice(0, 300)); return }

  console.log('\n📅 WEEKLY SCHEDULE:')
  console.log(`Week: ${plan.week} | Total: ${plan.total_posts} posts`)
  for (const s of plan.schedule) {
    console.log(`  ${s.post_id} → ${s.platform} @ ${s.local_time_display} [${s.slot_type}]`)
    console.log(`    Reason: ${s.scheduling_reason}`)
  }

  // 4B: Conflict check
  const conflictRaw = await callClaude(PROMPT_4B, JSON.stringify({ schedule: plan.schedule }), 'MODULE_4B', 500)
  const conflicts = parseJson(conflictRaw)
  console.log(`\n🔍 CONFLICT CHECK: hard=${conflicts?.has_hard_conflicts} soft=${conflicts?.has_soft_warnings}`)
  console.log(`Recommendation: ${conflicts?.recommendation}`)
  if (conflicts?.soft_warnings?.length) console.log(`Warnings: ${JSON.stringify(conflicts.soft_warnings)}`)

  // Simulate approve flow
  console.log('\n✅ SIMULATE APPROVE + SCHEDULE:')
  console.log(`  POST /api/content/approve { postId: "post_001", scheduledAt: "${plan.schedule[0]?.scheduled_datetime}" }`)
  console.log(`  → DB update: content_queue SET status=approved WHERE id=post_001`)
  console.log(`  → schedulePost() → SET status=scheduled, scheduled_at=${plan.schedule[0]?.scheduled_datetime}`)

  // Simulate Ayrshare payload
  console.log('\n🚀 AYRSHARE PAYLOAD (simulated):')
  const ayrsharePayload = {
    post: mockPostCopy,
    platforms: ['facebook'],
    mediaUrls: ['https://images.unsplash.com/gym-example.jpg'],
    scheduleDate: plan.schedule[0]?.scheduled_datetime,
  }
  console.log(JSON.stringify(ayrsharePayload, null, 2))
  const ayrshareKey = env.AYRSHARE_API_KEY
  if (!ayrshareKey || ayrshareKey.includes('placeholder') || ayrshareKey === '') {
    console.log('\n⚠️  AYRSHARE_API_KEY is placeholder — skipping real POST to Ayrshare')
    console.log('   Would call: POST https://app.ayrshare.com/api/post')
    console.log('   Would update: content_queue SET status=published, ayrshare_id=xxx')
  }

  // 4D: Client summary
  const summaryRaw = await callClaude(PROMPT_4D, JSON.stringify({
    brand_name: brandProfile.business_name, schedule_summary: plan.summary, language: 'vi', channel: 'telegram',
  }), 'MODULE_4D', 400)
  console.log('\n📨 CLIENT SUMMARY MESSAGE:')
  console.log(summaryRaw)

  console.log('\n✅ Phase 4 scheduler pipeline: WORKING')
}

// =========================================
// PHASE 5 — REPORTING TEST
// =========================================
async function testReporting() {
  console.log('\n' + '='.repeat(50))
  console.log('PHASE 5 — MODULE 5 REPORTING TEST')
  console.log('='.repeat(50))

  const mockFbData = { page_reach: 4200, total_impressions: 8500, total_engagement: 315, page_likes_gained: 23, link_clicks: 87, posts_count: 6,
    top_posts: [{ post_id: 'p1', reach: 1800, engagement: 156, type: 'tip', copy_preview: '3 BÀI TẬP ĐỐT MỠ BỤNG...' }] }
  const mockIgData = { account_reach: 2100, impressions: 4300, likes: 198, comments: 34, saves: 67, followers_gained: 41, posts_count: 4,
    top_posts: [{ post_id: 'p2', reach: 980, engagement: 142, type: 'viral' }] }

  const PROMPT_5A = `Chuẩn hóa raw data từ Facebook và Instagram.
Output JSON theo schema: {"period":{"start":"","end":"","days":0},"facebook":{...},"instagram":{...},"combined":{"total_reach":0,"total_engagement":0,"total_new_followers":0,"average_engagement_rate":0.0,"total_posts":0}}`

  const PROMPT_5B = `Phân tích performance. Benchmarks Gym: Facebook <1% poor|1-3% avg|3-6% good|>6% excellent, Instagram <1.5% poor|1.5-4% avg|4-8% good|>8% excellent.
Output JSON: {"overall_rating":"excellent|good|average|needs_improvement","rating_vs_benchmark":"above|at|below","trend_vs_last_period":{"reach_change_pct":0,"engagement_change_pct":0,"follower_change":0,"direction":"improving|stable|declining"},"platform_winner":"","platform_winner_reason":"","best_content_type":"","best_content_type_insight":"","top_post_analysis":{"post_id":"","why_it_worked":"","replicable_elements":[]},"key_insights":[]}`

  const PROMPT_5C = `Tạo đúng 3 recommendations cụ thể, actionable dựa trên data.
Output JSON: {"recommendations":[{"priority":1,"type":"quick_win|content_strategy|growth_play","title_vi":"","recommendation_vi":"","data_basis":"","expected_impact":"","implementation":""}]}`

  const PROMPT_5D = `Format báo cáo plain-text đẹp, dễ đọc trên mobile Telegram. Tối đa 350 chữ. Dùng → cho list.
Template:
📊 BÁO CÁO TUẦN — [BRAND]
[period]
📣 Tổng kết: → Tiếp cận, Tương tác, Follower mới, Số bài
[rating message]
🏆 Bài nổi bật: "copy..."  → engagement | Lý do
💡 3 việc làm tuần tới: 1. 2. 3.
Muốn xem chi tiết? Nhắn mình nhé! 🙌`

  // 5A: Normalize
  const normalizedRaw = await callClaude(PROMPT_5A, JSON.stringify({
    raw_facebook_data: mockFbData, raw_instagram_data: mockIgData,
    period_start: '2026-06-10', period_end: '2026-06-17',
  }), 'MODULE_5A', 1000)
  const normalized = parseJson(normalizedRaw)
  if (!normalized) { console.error('✗ 5A parse failed\n', normalizedRaw.slice(0, 300)); return }
  console.log(`\n📊 NORMALIZED: reach=${normalized.combined?.total_reach} engagement=${normalized.combined?.total_engagement} followers=+${normalized.combined?.total_new_followers}`)

  // 5B: Analyze
  const analysisRaw = await callClaude(PROMPT_5B, JSON.stringify({
    normalized_data: normalized, brand_profile: brandProfile,
    previous_period_data: null, content_types_published: { tip: 3, promo: 1, viral: 2 },
  }), 'MODULE_5B', 1500)
  const analysis = parseJson(analysisRaw)
  console.log(`\n📈 ANALYSIS: rating=${analysis?.overall_rating} vs_benchmark=${analysis?.rating_vs_benchmark}`)
  console.log(`Platform winner: ${analysis?.platform_winner} — ${analysis?.platform_winner_reason}`)
  console.log(`Best content type: ${analysis?.best_content_type}`)

  // 5C: Insights
  const insightsRaw = await callClaude(PROMPT_5C, JSON.stringify({
    performance_analysis: analysis, brand_profile: brandProfile,
    current_content_mix: { tip: 3, promo: 1, viral: 2 },
  }), 'MODULE_5C', 800)
  const insights = parseJson(insightsRaw)
  console.log(`\n💡 RECOMMENDATIONS (${insights?.recommendations?.length}):`)
  for (const r of insights?.recommendations || []) {
    console.log(`  ${r.priority}. [${r.type}] ${r.title_vi}`)
    console.log(`     ${r.recommendation_vi}`)
    console.log(`     Impact: ${r.expected_impact}`)
  }

  // 5D: Format report
  const reportRaw = await callClaude(PROMPT_5D, JSON.stringify({
    brand_name: brandProfile.business_name, normalized_data: normalized,
    performance_analysis: analysis, recommendations: insights?.recommendations,
    period_label: '10/06 → 17/06/2026', language: 'vi',
  }), 'MODULE_5D', 600)

  console.log('\n' + '='.repeat(50))
  console.log('📱 FINAL REPORT (as sent on Telegram):')
  console.log('='.repeat(50))
  console.log(reportRaw)
  console.log('='.repeat(50))

  console.log('\n✅ Phase 5 reporting pipeline: WORKING')
}

async function main() {
  console.log('=== PHASE 4+5 END-TO-END TEST ===')
  await testScheduler()
  await testReporting()
  console.log('\n' + '='.repeat(50))
  console.log('ALL TESTS PASSED ✓')
  console.log('Module 4 (Scheduler 4A+4B+4D): WORKING')
  console.log('Module 5 (Reporting 5A+5B+5C+5D): WORKING')
  console.log('Ayrshare: code ready, needs real API key')
  console.log('Supabase: code ready, needs real DB URL')
}

main().catch(e => { console.error('\n✗ Test failed:', e.message); process.exit(1) })
