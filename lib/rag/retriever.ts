import { supabaseAdmin } from '@/lib/supabase/client'
import { createEmbedding } from '@/lib/ai/embeddings'
import { log } from '@/lib/utils/logger'

export async function buildRagContext(clientId: string, query: string): Promise<string> {
  try {
    const queryEmbedding = await createEmbedding(query)

    const { data: chunks, error } = await supabaseAdmin.rpc('match_rag_chunks', {
      client_id_param: clientId,
      query_embedding: queryEmbedding,
      match_count: 8
    })

    if (error) throw error
    if (!chunks?.length) return ''

    const grouped: Record<string, string[]> = {}
    for (const chunk of chunks) {
      if (!grouped[chunk.chunk_type]) grouped[chunk.chunk_type] = []
      grouped[chunk.chunk_type].push(chunk.content)
    }

    let context = '--- BRAND CONTEXT (RAG) ---\n\n'
    if (grouped.brand_profile) context += `[BRAND PROFILE]\n${grouped.brand_profile.join('\n')}\n\n`
    if (grouped.content_history) context += `[CONTENT HISTORY]\n${grouped.content_history.join('\n')}\n\n`
    if (grouped.client_instruction) context += `[INSTRUCTIONS]\n${grouped.client_instruction.join('\n')}\n\n`
    if (grouped.performance_data) context += `[PERFORMANCE]\n${grouped.performance_data.join('\n')}\n\n`
    context += '--- END BRAND CONTEXT ---'

    log('RAG', 'success', `${chunks.length} chunks, ${context.length} chars`)
    return context
  } catch (error: any) {
    log('RAG', 'error', error.message)
    return ''
  }
}
