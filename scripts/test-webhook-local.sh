#!/bin/bash
CHAT_ID="${1:-123456789}"
TEXT="${2:-xin chao}"
echo "Testing: '$TEXT' from chat $CHAT_ID"
curl -s -X POST http://localhost:3000/api/webhook/telegram \
  -H "Content-Type: application/json" \
  -d "{\"update_id\":1,\"message\":{\"message_id\":1,\"from\":{\"id\":$CHAT_ID,\"first_name\":\"Test\"},\"chat\":{\"id\":$CHAT_ID,\"type\":\"private\"},\"date\":$(date +%s),\"text\":\"$TEXT\"}}"
