import axios from 'axios'
import FormData from 'form-data'
import { log } from '@/lib/utils/logger'

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  // Split messages longer than 4000 chars
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 4000) {
    chunks.push(remaining.slice(0, 4000))
    remaining = remaining.slice(4000)
  }
  if (remaining) chunks.push(remaining)

  for (const chunk of chunks) {
    try {
      const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: chunk,
      })
      log('TELEGRAM', 'success', `Sent to ${chatId} — msg_id: ${res.data?.result?.message_id}`)
    } catch (error: any) {
      log('TELEGRAM', 'error', `Send failed to ${chatId}: ${error.response?.data?.description || error.message}`)
      throw error
    }
  }
}

export async function sendTelegramDocument(chatId: string, content: string, filename: string, caption?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  try {
    const form = new FormData()
    form.append('chat_id', chatId)
    form.append('document', Buffer.from(content, 'utf-8'), { filename, contentType: 'text/html' })
    if (caption) form.append('caption', caption)

    const res = await axios.post(`https://api.telegram.org/bot${token}/sendDocument`, form, {
      headers: form.getHeaders(),
    })
    log('TELEGRAM', 'success', `Document sent to ${chatId} — ${filename}`)
    return res.data?.result
  } catch (error: any) {
    log('TELEGRAM', 'error', `Document send failed: ${error.response?.data?.description || error.message}`)
    throw error
  }
}

export async function sendTelegramPhoto(chatId: string, imageBuffer: Buffer, caption?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  try {
    const form = new FormData()
    form.append('chat_id', chatId)
    form.append('photo', imageBuffer, { filename: 'image.png', contentType: 'image/png' })
    if (caption) form.append('caption', caption.slice(0, 1024))

    const res = await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, form, {
      headers: form.getHeaders(),
    })
    log('TELEGRAM', 'success', `Photo sent to ${chatId}`)
    return res.data?.result
  } catch (error: any) {
    log('TELEGRAM', 'error', `Photo send failed: ${error.response?.data?.description || error.message}`)
    throw error
  }
}

export async function sendZaloMessage(userId: string, text: string) {
  try {
    await axios.post('https://openapi.zalo.me/v2.0/oa/message', {
      recipient: { user_id: userId },
      message: { text }
    }, { headers: { 'access_token': process.env.ZALO_OA_ACCESS_TOKEN } })
  } catch (error: any) {
    log('ZALO', 'error', error.message)
    throw error
  }
}
