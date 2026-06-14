import OpenAI from 'openai'
import { log } from '@/lib/utils/logger'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function generateImage(
  prompt: string,
  size: '1024x1024' | '1024x1792' | '1792x1024' = '1024x1024'
): Promise<string> {
  try {
    log('GPT_IMAGE', 'info', `Generating: ${prompt.slice(0, 80)}...`)

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'standard',
      response_format: 'url'
    })

    const url = response.data?.[0]?.url ?? ''
    log('GPT_IMAGE', 'success', 'Image generated')
    return url
  } catch (error: any) {
    log('GPT_IMAGE', 'error', error.message)
    throw error
  }
}
