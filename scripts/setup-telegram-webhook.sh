#!/bin/bash
BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
WEBHOOK_SECRET="${TELEGRAM_WEBHOOK_SECRET:-secret123}"

WEBHOOK_URL="${APP_URL}/api/webhook/telegram"
echo "Setting webhook: $WEBHOOK_URL"

curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${WEBHOOK_URL}\", \"secret_token\": \"${WEBHOOK_SECRET}\", \"allowed_updates\": [\"message\"]}" | python3 -m json.tool
