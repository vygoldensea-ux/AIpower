import axios from 'axios'
import { log } from '@/lib/utils/logger'

const AYRSHARE_BASE_URL = 'https://app.ayrshare.com/api'

function ayrshareError(error: any): Error {
  const data = error.response?.data
  const detail = JSON.stringify(data || error.message)
  log('AYRSHARE', 'error', `HTTP ${error.response?.status} — ${detail}`)
  const msg = data?.message || data?.errors?.join(', ') || error.message
  const err = new Error(`Ayrshare: ${msg} | detail: ${detail}`)
  return err
}

export async function publishPost(params: {
  post: string
  platforms: string[]
  mediaUrls?: string[]
  scheduleDate?: string
}): Promise<{ id: string; status: string }> {
  try {
    const body: any = {
      post: params.post,
      platforms: params.platforms,
    }
    if (params.mediaUrls?.length) body.mediaUrls = params.mediaUrls
    if (params.scheduleDate) body.scheduleDate = params.scheduleDate

    const res = await axios.post(`${AYRSHARE_BASE_URL}/post`, body, {
      headers: { Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}` },
    })
    log('AYRSHARE', 'success', `Post published — id: ${res.data?.id}`)
    return { id: res.data?.id, status: res.data?.status || 'success' }
  } catch (error: any) {
    throw ayrshareError(error)
  }
}

export async function deletePost(ayrshareId: string): Promise<void> {
  try {
    await axios.delete(`${AYRSHARE_BASE_URL}/post`, {
      headers: { Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}` },
      data: { id: ayrshareId },
    })
    log('AYRSHARE', 'success', `Post deleted — id: ${ayrshareId}`)
  } catch (error: any) {
    throw ayrshareError(error)
  }
}
