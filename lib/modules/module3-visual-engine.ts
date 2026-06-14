import { callClaude, parseClaudeJson } from '@/lib/ai/claude'
import { buildRagContext } from '@/lib/rag/retriever'
import { loadIndustrySkills } from '@/lib/skills/loader'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'
import {
  PROMPT_3A_VISUAL_STRATEGIST,
  PROMPT_3B_IMAGE_PROMPT,
  PROMPT_3C_REMOTION_BRIEF,
  PROMPT_3E_MODERATION,
} from '@/lib/prompts/p3-visual'
import { generateImage } from '@/lib/ai/gpt-image'
import { searchUnsplash, searchPexels } from '@/lib/images/free-sources'

export async function generateVisual(postId: string): Promise<void> {
  const { data: post } = await supabaseAdmin
    .from('content_queue')
    .select('*, clients(*, brand_profiles(profile_data))')
    .eq('id', postId)
    .single()

  if (!post) throw new Error(`Post ${postId} not found`)

  const profile = post.clients?.brand_profiles?.[0]?.profile_data || {}
  const industry = profile.industry || 'general'
  const platform = post.platforms?.[0] || 'facebook'
  const copy = post.copy_vi || post.copy_en || ''

  const skills = loadIndustrySkills(industry)
  const ragContext = await buildRagContext(post.client_id, `visual style for ${industry} ${platform}`)

  // 3A: Decide visual strategy
  const strategyRaw = await callClaude({
    systemPrompt: PROMPT_3A_VISUAL_STRATEGIST,
    userMessage: JSON.stringify({
      platform,
      content_type: post.content_type,
      copy_preview: copy.slice(0, 200),
      brand_profile_summary: {
        industry,
        brand_tone: profile.brand_tone,
        has_photo_library: false,
      },
    }),
    maxTokens: 300,
    temperature: 0.3,
    clientId: post.client_id,
    module: 'MODULE_3A',
  })

  const strategy = parseClaudeJson<any>(strategyRaw)
  log('MODULE_3A', 'success', `Visual type: ${strategy.visual_type}`)

  if (strategy.visual_type === 'no_visual') {
    log('MODULE_3', 'info', `Post ${postId} — no visual needed`)
    return
  }

  if (strategy.use_remotion_template) {
    // 3C: Generate Remotion brief
    const remotionRaw = await callClaude({
      systemPrompt: PROMPT_3C_REMOTION_BRIEF.replace('{industry_video_skill}', skills.video),
      userMessage: JSON.stringify({
        content_type: post.content_type,
        industry,
        post_copy: copy,
        platform,
        brand_profile: profile,
      }),
      maxTokens: 500,
      temperature: 0.3,
      clientId: post.client_id,
      module: 'MODULE_3C',
    })

    const remotionBrief = parseClaudeJson<any>(remotionRaw)

    await supabaseAdmin.from('visual_assets').insert({
      post_id: postId,
      client_id: post.client_id,
      asset_type: 'video',
      visual_type: 'remotion',
      remotion_brief: remotionBrief,
      status: 'pending_render',
    })

    log('MODULE_3', 'success', `Remotion brief created for post ${postId}`)
    return
  }

  // 3B: Generate image prompt
  const imagePromptRaw = await callClaude({
    systemPrompt: PROMPT_3B_IMAGE_PROMPT
      .replace('{rag_context_block}', ragContext)
      .replace('{industry_image_skill}', skills.image),
    userMessage: JSON.stringify({
      visual_strategy: strategy,
      post_copy: copy,
      brand_profile: profile,
      visual_brief: post.visual_brief || '',
    }),
    maxTokens: 500,
    temperature: 0.5,
    clientId: post.client_id,
    module: 'MODULE_3B',
  })

  const imagePromptData = parseClaudeJson<any>(imagePromptRaw)
  log('MODULE_3B', 'success', 'Image prompt generated')

  // 3E: Moderation check
  const moderationRaw = await callClaude({
    systemPrompt: PROMPT_3E_MODERATION,
    userMessage: imagePromptData.primary_prompt,
    maxTokens: 200,
    temperature: 0,
    clientId: post.client_id,
    module: 'MODULE_3E',
  })

  const moderation = parseClaudeJson<any>(moderationRaw)

  if (moderation.flag_level === 'must_review') {
    await supabaseAdmin.from('visual_assets').insert({
      post_id: postId,
      client_id: post.client_id,
      asset_type: 'image',
      visual_type: strategy.visual_type,
      image_prompt: imagePromptData,
      status: 'pending_moderation',
      moderation_flag: true,
      moderation_reason: moderation.flag_reasons?.join(', '),
    })
    log('MODULE_3E', 'warn', `Flagged for moderation: ${moderation.flag_reasons?.join(', ')}`)
    return
  }

  // Try free stock photos first if photo library is preferred
  let imageUrl = ''
  if (strategy.use_photo_library) {
    const searchQuery = `${industry} ${imagePromptData.primary_prompt.slice(0, 60)}`
    const unsplashUrls = await searchUnsplash(searchQuery, 1)
    if (unsplashUrls.length > 0) {
      imageUrl = unsplashUrls[0]
      log('MODULE_3', 'info', 'Using Unsplash image')
    } else {
      const pexelsUrls = await searchPexels(searchQuery, 1)
      if (pexelsUrls.length > 0) {
        imageUrl = pexelsUrls[0]
        log('MODULE_3', 'info', 'Using Pexels image')
      }
    }
  }

  // Fall back to AI image generation
  if (!imageUrl && strategy.use_ai_image) {
    const sizeMap: Record<string, '1024x1024' | '1024x1792' | '1792x1024'> = {
      '1:1': '1024x1024',
      '9:16': '1024x1792',
      '16:9': '1792x1024',
    }
    const size = sizeMap[imagePromptData.aspect_ratio] || '1024x1024'
    const fullPrompt = `${imagePromptData.primary_prompt}. ${imagePromptData.style_modifiers || ''}`.trim()
    imageUrl = await generateImage(fullPrompt, size)
    log('MODULE_3', 'success', 'AI image generated')
  }

  const { data: asset } = await supabaseAdmin
    .from('visual_assets')
    .insert({
      post_id: postId,
      client_id: post.client_id,
      asset_type: 'image',
      visual_type: strategy.visual_type,
      image_url: imageUrl,
      image_prompt: imagePromptData,
      dimensions: strategy.dimensions,
      status: 'ready',
      moderation_flag: false,
    })
    .select()
    .single()

  log('MODULE_3', 'success', `Visual asset created: ${asset?.id} for post ${postId}`)
}
