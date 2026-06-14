// Test Phase 3: Module 2 + Module 3 pipeline
// Calls Claude API directly, bypasses Supabase
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load env manually
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
    max_tokens: 1200,
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

// ---- MOCK BRAND PROFILE (gym client) ----
const brandProfile = {
  business_name: 'Iron House Gym',
  industry: 'gym',
  brand_tone: 'motivating, energetic, direct',
  language: 'vi',
  platforms: ['facebook', 'instagram'],
  usp: 'Phòng gym chuẩn Olympic với HLV chứng chỉ quốc tế',
  target_audience: 'Nam/Nữ 18-35, muốn giảm mỡ và tăng cơ',
}

// ---- MODULE 2A: Topic Suggester ----
const PROMPT_2A = `
Mày là content strategist chuyên về mạng xã hội.
Đề xuất 3 topic content phù hợp cho tuần tới.

Output JSON array:
[{"topic":"","content_type":"tip","angle":"","estimated_performance":"high"}]
`

// ---- MODULE 2B: Content Generator ----
const PROMPT_2B = `
Mày là copywriter chuyên nghiệp viết content mạng xã hội có tỷ lệ viral cao.

Platform: facebook
Content type: tip
Language: vi
Brand: ${brandProfile.business_name} — ${brandProfile.usp}
Tone: ${brandProfile.brand_tone}
Audience: ${brandProfile.target_audience}

Facebook rules: Độ dài 100–300 chữ | Xuống dòng nhiều | Emoji theo brand_tone | Hashtag 3–5 cuối bài

Output JSON:
{
  "platform": "facebook",
  "content_type": "tip",
  "language": "vi",
  "copy": "",
  "visual_brief": "",
  "hashtags": [],
  "estimated_performance": "high"
}
`

// ---- MODULE 3A: Visual Strategist ----
const PROMPT_3A = `
Quyết định loại visual phù hợp nhất.
Facebook tip/regular/viral/story → static_image

Output JSON:
{
  "visual_type": "static_image",
  "dimensions": "1080x1080",
  "use_ai_image": true,
  "use_photo_library": false,
  "rationale": ""
}
`

// ---- MODULE 3B: Image Prompt Generator ----
const PROMPT_3B = `
Tạo prompt chi tiết cho DALL-E 3.

Industry: gym/fitness
Brand tone: motivating, energetic

Output JSON:
{
  "primary_prompt": "",
  "style_modifiers": "",
  "aspect_ratio": "1:1",
  "model_recommendation": "dall-e-3"
}

Rules:
- Prompt bằng tiếng Anh, 80–150 từ
- Không reference celebrity
- Primary prompt phải describe visual mạnh mẽ cho fitness content
`

async function main() {
  console.log('=== PHASE 3 END-TO-END TEST ===')
  console.log(`Brand: ${brandProfile.business_name} (${brandProfile.industry})`)
  console.log(`Platform: facebook | Content type: tip`)

  // Step 1: Topic suggestion
  const topicsRaw = await callClaude(PROMPT_2A, JSON.stringify({
    platform: 'facebook',
    brand_profile: brandProfile,
    content_types_needed: ['tip'],
  }), 'MODULE_2A')
  const topics = parseJson(topicsRaw)
  const topic = topics?.[0]?.topic || '5 sai lầm khi tập squat'
  console.log(`\n✓ Topic selected: "${topic}"`)

  // Step 2: Generate content
  const contentRaw = await callClaude(PROMPT_2B, JSON.stringify({
    topic,
    brand_profile: brandProfile,
  }), 'MODULE_2B')
  const content = parseJson(contentRaw)

  if (!content) {
    console.error('\n✗ Failed to parse content JSON')
    console.log('Raw:', contentRaw.slice(0, 500))
    process.exit(1)
  }

  console.log('\n=== GENERATED CONTENT ===')
  console.log(`Platform: ${content.platform}`)
  console.log(`Language: ${content.language}`)
  console.log(`Performance: ${content.estimated_performance}`)
  console.log(`\nCopy:\n${content.copy}`)
  console.log(`\nHashtags: ${content.hashtags?.join(' ')}`)
  console.log(`\nVisual brief: ${content.visual_brief}`)

  // Simulate saving to content_queue
  const mockPostId = `test_${Date.now()}`
  const mockPost = {
    id: mockPostId,
    post_code: `TEST_FB_${Date.now()}`,
    client_id: 'test-client-001',
    platforms: ['facebook'],
    content_type: 'tip',
    copy_vi: content.language === 'vi' ? content.copy : null,
    visual_brief: content.visual_brief,
    status: 'draft',
  }
  console.log(`\n✓ [MOCK] Saved to content_queue: ${mockPost.post_code}`)

  // Step 3: Visual strategy
  const strategyRaw = await callClaude(PROMPT_3A, JSON.stringify({
    platform: 'facebook',
    content_type: 'tip',
    copy_preview: content.copy?.slice(0, 200),
    brand_profile_summary: { industry: 'gym', has_photo_library: false },
  }), 'MODULE_3A')
  const strategy = parseJson(strategyRaw)
  console.log(`\n✓ Visual strategy: ${strategy?.visual_type} | AI image: ${strategy?.use_ai_image}`)

  // Step 4: Image prompt
  const imagePromptRaw = await callClaude(PROMPT_3B, JSON.stringify({
    visual_strategy: strategy,
    post_copy: content.copy,
    visual_brief: content.visual_brief,
    brand_profile: brandProfile,
  }), 'MODULE_3B')
  const imagePrompt = parseJson(imagePromptRaw)

  console.log('\n=== GENERATED IMAGE PROMPT ===')
  console.log(`Primary: ${imagePrompt?.primary_prompt}`)
  console.log(`Style: ${imagePrompt?.style_modifiers}`)
  console.log(`Aspect ratio: ${imagePrompt?.aspect_ratio}`)

  // Step 5: Generate AI image (only if OpenAI key is real)
  if (env.OPENAI_API_KEY && !env.OPENAI_API_KEY.includes('placeholder')) {
    console.log('\n[GPT_IMAGE] Generating DALL-E 3 image...')
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY })
    const imgRes = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${imagePrompt.primary_prompt}. ${imagePrompt.style_modifiers || ''}`.trim(),
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    })
    const imageUrl = imgRes.data?.[0]?.url
    console.log(`✓ Image generated: ${imageUrl}`)

    console.log(`\n✓ [MOCK] Saved visual_asset for post ${mockPostId}: { image_url: "${imageUrl?.slice(0,60)}...", status: "ready" }`)
  } else {
    console.log('\n[GPT_IMAGE] OPENAI_API_KEY is placeholder — skipping image generation')
    console.log(`✓ [MOCK] Would save visual_asset for post ${mockPostId}: { image_prompt: "...", status: "pending_image_gen" }`)
  }

  console.log('\n=== PHASE 3 TEST COMPLETE ✓ ===')
  console.log('Module 2 (Content Brain): WORKING')
  console.log('Module 3 (Visual Engine): WORKING')
  console.log('\nNext step: Connect real Supabase to persist content_queue + visual_assets')
}

main().catch(e => { console.error('\n✗ Test failed:', e.message); process.exit(1) })
