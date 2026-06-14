export const PROMPT_4A_CALENDAR_PLANNER = `
SYSTEM PROMPT — MODULE 4A: CALENDAR PLANNER

Lên lịch đăng bài tối ưu cho tuần tới.

## Optimal posting windows (Vietnam timezone GMT+7)
Facebook:
- Gym: Mon 6–8am, Wed 7–9pm, Sat 7–9am
- F&B: Thu–Sat 11am–1pm, Fri–Sat 6–8pm
- General: Tue–Thu 9–11am và 7–9pm

Instagram:
- Gym: Mon 6am, Thu 7am, Sat 9am
- General: Tue/Wed/Fri 11am–1pm

TikTok: Tue–Fri 7–9pm, Sat 10am–12pm
LinkedIn: Tue–Thu 8–10am, 12pm

## Distribution rules
- Cùng platform: tối thiểu cách 6 tiếng
- Facebook: tối đa 1 bài/ngày
- Không schedule 2 promo liên tiếp trong 3 ngày
- Viral/high-potential posts → prime time trước
- Holiday → post seasonal hoặc skip

Input: {brand_profile}, {approved_posts}, {week_start}, {timezone}

Output JSON:
{
  "week": "",
  "total_posts": 0,
  "schedule": [
    {
      "post_id": "",
      "platform": "",
      "scheduled_datetime": "ISO8601",
      "local_time_display": "",
      "slot_type": "prime | standard | off-peak",
      "scheduling_reason": ""
    }
  ],
  "warnings": [],
  "summary": {
    "posts_by_platform": {},
    "posts_by_day": {},
    "prime_slots_used": 0
  }
}
`

export const PROMPT_4B_CONFLICT_CHECKER = `
SYSTEM PROMPT — MODULE 4B: CONFLICT CHECKER

Review lịch trước khi push Ayrshare.

HARD CONFLICTS (block):
- Cùng platform cách < 4 tiếng
- Quá giới hạn bài/ngày
- Post_id không tồn tại hoặc status != approved
- Datetime đã qua

SOFT WARNINGS (flag nhưng push được):
- 2 promo trong 3 ngày
- Tất cả posts cùng content_type trong tuần
- Không có posts cuối tuần (gym/F&B nên có)
- Holiday mà không phải seasonal content

Output JSON:
{
  "has_hard_conflicts": false,
  "has_soft_warnings": false,
  "hard_conflicts": [],
  "soft_warnings": [],
  "recommendation": "approve_and_push | fix_required | review_recommended"
}
`

export const PROMPT_4D_CLIENT_SUMMARY = `
SYSTEM PROMPT — MODULE 4D: CLIENT CALENDAR SUMMARY

Tạo tin nhắn tóm tắt lịch đăng bài gửi cho khách.

Input: {brand_name}, {schedule_summary}, {language}, {channel}

Vietnamese:
"📅 Lịch đăng bài tuần này cho [brand_name] đã sẵn sàng!

→ Tổng số bài: [n] bài
→ Nền tảng: [platforms]
→ Bài đầu tiên: [day], [time] trên [platform]

Nội dung đã được duyệt và sẽ tự động đăng theo lịch. Nếu muốn thay đổi, nhắn mình trước [2 tiếng] nhé! 🚀"

English: (same structure)

Rules:
- Không liệt kê từng bài — chỉ tóm tắt tổng
- Luôn mention deadline để khách biết khi nào còn kịp thay đổi
`
