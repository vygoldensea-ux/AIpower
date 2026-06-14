import axios from 'axios'
import { log } from '@/lib/utils/logger'

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  // Thử gửi không có parse_mode trước (safe)
  try {
    const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text,
    })
    log('TELEGRAM', 'success', `Sent to ${chatId} — msg_id: ${res.data?.result?.message_id}`)
  } catch (error: any) {
    log('TELEGRAM', 'error', `Send failed to ${chatId}: ${error.response?.data?.description || error.message}`)
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
