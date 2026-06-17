// Test Phase 4: Module 4 Scheduler pipeline
// Calls Claude API directly, bypasses Supabase/Ayrshare
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

async function callClaude(systemPrompt, userMessage, label) {
  console.log(`\n[${label}] Calling Claude...`)
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: userMessage }],
    system: systemPrompt,
  })
  const text = msg.content[0].text
  console.log(`[${label}] OK — ${msg.usage.input_tokens}in/${msg.usage.output_tokens}out tokens`)
  return text
}

function parseJson(raw) {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/) || raw.match(/(\[[\s\S]*\]|\{[\s\S]*\})/)
  try { return JSON.parse(match ? match[1] : raw) } catch { return null }
}

const brandProfile = {
  business_name: 'Iron House Gym',
  industry: 'gym',
  brand_tone: 'motivating, energetic',
  language: 'vi',
  platforms: ['facebook', 'instagram'],
}

const approvedPosts = [
  { id: 'post_001', platform: 'facebook', content_type: 'tip' },
  { id: 'post_002', platform: 'facebook', content_type: 'promo' },
  { id: 'post_003', platform: 'instagram', content_type: 'viral' },
  { id: 'post_004', platform: 'facebook', content_type: 'regular' },
]

const PROMPT_4A = `
Lên lịch đăng bài tối ưu cho tuần tới.

## Optimal posting windows (Vietnam timezone GMT+7)
Facebook - Gym: Mon 6-8am, Wed 7-9pm, Sat 7-9am
Instagram - Gym: Mon 6am, Thu 7am, Sat 9am

## Distribution rules
- Cùng platform: tối thiểu cách 6 tiếng
- Facebook: tối đa 1 bài/ngày
- Không schedule 2 promo liên tiếp trong 3 ngày
- Viral/high-potential posts → prime time trước

Input: {brand_profile}, {approved_posts}, {week_start}, {timezone}

Output JSON:
{
  "week": "",
  "total_posts": 0,
  "schedule": [{"post_id":"","platform":"","scheduled_datetime":"ISO8601","local_time_display":"","slot_type":"prime | standard | off-peak","scheduling_reason":""}],
  "warnings": [],
  "summary": {"posts_by_platform": {}, "posts_by_day": {}, "prime_slots_used": 0}
}
`

const PROMPT_4B = `
Review lịch trước khi push Ayrshare.

HARD CONFLICTS (block): Cùng platform cách < 4 tiếng | Quá giới hạn bài/ngày | Datetime đã qua
SOFT WARNINGS: 2 promo trong 3 ngày | Không có posts cuối tuần

Output JSON:
{"has_hard_conflicts": false, "has_soft_warnings": false, "hard_conflicts": [], "soft_warnings": [], "recommendation": "approve_and_push | fix_required | review_recommended"}
`

const PROMPT_4D = `
Tạo tin nhắn tóm tắt lịch đăng bài gửi cho khách.

Input: {brand_name}, {schedule_summary}, {language}, {channel}

Vietnamese:
"📅 Lịch đăng bài tuần này cho [brand_name] đã sẵn sàng!
→ Tổng số bài: [n] bài
→ Nền tảng: [platforms]
→ Bài đầu tiên: [day], [time] trên [platform]
Nội dung đã được duyệt và sẽ tự động đăng theo lịch. Nếu muốn thay đổi, nhắn mình trước 2 tiếng nhé! 🚀"

Rules: Không liệt kê từng bài — chỉ tóm tắt tổng. Luôn mention deadline.
`

async function main() {
  console.log('=== PHASE 4 END-TO-END TEST ===')
  console.log(`Brand: ${brandProfile.business_name} | Approved posts: ${approvedPosts.length}`)

  // Step 1: Plan weekly schedule (4A)
  const planRaw = await callClaude(PROMPT_4A, JSON.stringify({
    brand_profile: brandProfile,
    approved_posts: approvedPosts,
    week_start: '2026-06-22',
    timezone: 'Asia/Ho_Chi_Minh',
  }), 'MODULE_4A')
  const plan = parseJson(planRaw)

  if (!plan) {
    console.error('\n✗ Failed to parse plan JSON')
    console.log('Raw:', planRaw.slice(0, 500))
    process.exit(1)
  }

  console.log('\n=== WEEKLY SCHEDULE ===')
  console.log(`Week: ${plan.week} | Total posts: ${plan.total_posts}`)
  for (const slot of plan.schedule) {
    console.log(`  ${slot.post_id} → ${slot.platform} @ ${slot.local_time_display} (${slot.slot_type}) — ${slot.scheduling_reason}`)
  }
  if (plan.warnings?.length) console.log(`Warnings: ${plan.warnings.join('; ')}`)

  // Step 2: Conflict check (4B)
  const checkRaw = await callClaude(PROMPT_4B, JSON.stringify({ schedule: plan.schedule }), 'MODULE_4B')
  const check = parseJson(checkRaw)

  console.log('\n=== CONFLICT CHECK ===')
  console.log(`Hard conflicts: ${check.has_hard_conflicts} | Soft warnings: ${check.has_soft_warnings}`)
  console.log(`Recommendation: ${check.recommendation}`)
  if (check.soft_warnings?.length) console.log(`Warnings: ${JSON.stringify(check.soft_warnings)}`)

  if (check.has_hard_conflicts) {
    console.log(`✗ Hard conflicts: ${JSON.stringify(check.hard_conflicts)}`)
  } else {
    console.log('✓ [MOCK] Schedule applied — content_queue updated with scheduled_at + status=scheduled')
  }

  // Step 3: Client summary (4D)
  const summaryRaw = await callClaude(PROMPT_4D, JSON.stringify({
    brand_name: brandProfile.business_name,
    schedule_summary: plan.summary,
    language: 'vi',
    channel: 'telegram',
  }), 'MODULE_4D')

  console.log('\n=== CLIENT SUMMARY MESSAGE ===')
  console.log(summaryRaw)

  // Step 4: Simulate Ayrshare publish (key is placeholder, so just show what would happen)
  console.log('\n=== AYRSHARE PUBLISH (simulated) ===')
  if (env.AYRSHARE_API_KEY && env.AYRSHARE_API_KEY.length > 0 && !env.AYRSHARE_API_KEY.includes('placeholder')) {
    console.log('AYRSHARE_API_KEY is set — would call POST https://app.ayrshare.com/api/post')
  } else {
    console.log('AYRSHARE_API_KEY is empty/placeholder — skipping real publish call')
    console.log(`✓ [MOCK] Would publish: { post: "...", platforms: ["facebook"], mediaUrls: [...] }`)
    console.log(`✓ [MOCK] Would update content_queue: { status: "published", ayrshare_id: "mock_id_123" }`)
  }

  console.log('\n=== PHASE 4 TEST COMPLETE ✓ ===')
  console.log('Module 4A (Calendar Planner): WORKING')
  console.log('Module 4B (Conflict Checker): WORKING')
  console.log('Module 4D (Client Summary): WORKING')
  console.log('Ayrshare publish: code ready, needs real AYRSHARE_API_KEY to test live')
}

main().catch(e => { console.error('\n✗ Test failed:', e.message); process.exit(1) })
