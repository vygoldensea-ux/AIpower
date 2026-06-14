import axios from 'axios'
import { log } from '@/lib/utils/logger'

export async function sendTelegramMessage(chatId: string, text: string) {
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  } catch (error: any) {
    log('TELEGRAM', 'error', error.message)
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
