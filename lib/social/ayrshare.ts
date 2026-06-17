import axios from 'axios'
import { log } from '@/lib/utils/logger'

const AYRSHARE_BASE_URL = 'https://app.ayrshare.com/api'

export async function publishPost(params: {
  post: string
  platforms: string[]
  mediaUrls?: string[]
  scheduleDate?: string
}): Promise<{ id: string; status: string }> {
  try {
    const res = await axios.post(
      `${AYRSHARE_BASE_URL}/post`,
      {
        post: params.post,
        platforms: params.platforms,
        mediaUrls: params.mediaUrls || [],
        ...(params.scheduleDate ? { scheduleDate: params.scheduleDate } : {}),
      },
      { headers: { Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}` } }
    )
    log('AYRSHARE', 'success', `Post published — id: ${res.data?.id}`)
    return { id: res.data?.id, status: res.data?.status || 'success' }
  } catch (error: any) {
    log('AYRSHARE', 'error', error.response?.data?.message || error.message)
    throw error
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
    log('AYRSHARE', 'error', error.response?.data?.message || error.message)
    throw error
  }
}
