import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase/client'
import { log } from '@/lib/utils/logger'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

interface ClaudeCallOptions {
  systemPrompt: string
  userMessage: string
  maxTokens?: number
  temperature?: number
  clientId?: string
  module?: string
}

export async function callClaude(options: ClaudeCallOptions): Promise<string> {
  const { systemPrompt, userMessage, maxTokens = 1000, temperature = 0.5, clientId, module = 'unknown' } = options
  const startTime = Date.now()
  let success = false
  let errorMessage = ''
  let inputTokens = 0
  let outputTokens = 0

  try {
    log(module, 'info', 'Calling Claude API...')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens
    success = true
    log(module, 'success', `OK — ${inputTokens}in/${outputTokens}out tokens`)

    return content.text
  } catch (error: any) {
    errorMessage = error.message
    log(module, 'error', `Claude error: ${errorMessage}`)
    throw error
  } finally {
    const costUsd = (inputTokens * 0.000003) + (outputTokens * 0.000015)
    try {
      await supabaseAdmin.from('ai_logs').insert({
        client_id: clientId || null, module, model: 'claude-sonnet-4-6',
        input_tokens: inputTokens, output_tokens: outputTokens,
        cost_usd: costUsd, latency_ms: Date.now() - startTime,
        success, error_message: errorMessage || null
      })
    } catch { /* log errors không được crash app */ }
  }
}

export function parseClaudeJson<T>(rawText: string): T {
  // Extract JSON block even if Claude adds extra text around it
  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)```/) ||
                    rawText.match(/```\s*([\s\S]*?)```/)
  if (jsonMatch) return JSON.parse(jsonMatch[1].trim()) as T

  // Try to find a raw JSON object
  const objMatch = rawText.match(/(\{[\s\S]*\})/)
  if (objMatch) return JSON.parse(objMatch[1]) as T

  return JSON.parse(rawText.trim()) as T
}
