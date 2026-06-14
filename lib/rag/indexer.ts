import { supabaseAdmin } from '@/lib/supabase/client'
import { createEmbedding } from '@/lib/ai/embeddings'
import { log } from '@/lib/utils/logger'

type ChunkType = 'brand_profile' | 'content_history' | 'performance_data' | 'client_instruction' | 'industry_knowledge'

export async function indexChunk(
  clientId: string,
  chunkType: ChunkType,
  content: string,
  metadata: Record<string, any> = {}
) {
  const embedding = await createEmbedding(content)
  const { error } = await supabaseAdmin.from('rag_chunks').insert({
    client_id: clientId, chunk_type: chunkType, content, embedding, metadata
  })
  if (error) throw error
  log('RAG_INDEXER', 'success', `Indexed: ${chunkType}`)
}

export async function indexBrandProfile(clientId: string, profileData: any) {
  const text = `
[BRAND PROFILE | ${profileData.brand_name} | ${new Date().toISOString().split('T')[0]}]
Thương hiệu: ${profileData.brand_name} | Ngành: ${profileData.industry} | Loại: ${profileData.business_type}
Sản phẩm: ${profileData.products_services?.map((p: any) => `${p.name} ${p.price || ''}`).join(', ')}
Đối tượng: ${profileData.target_audience?.age_range}, ${profileData.target_audience?.gender}, ${profileData.target_audience?.location?.join('/')}
Pain points: ${profileData.target_audience?.pain_points?.join(', ')}
Tone: ${profileData.brand_tone} — ${profileData.brand_tone_description}
Mục tiêu: ${profileData.goals?.join(', ')}
Hạn chế: ${profileData.content_restrictions?.join(', ') || 'Không có'}
  `.trim()

  await indexChunk(clientId, 'brand_profile', text, { source: 'onboarding', date: new Date().toISOString() })
}
