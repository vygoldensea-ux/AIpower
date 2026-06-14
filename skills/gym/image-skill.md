# GYM IMAGE SKILL
# Inject vào Prompt 3B khi industry = gym/fitness/yoga

## Visual style cho Gym

### Mood board
- Dark & dramatic: nền đen/charcoal + text vàng/trắng bold
- Energy & power: contrast cao, ánh sáng dramatic
- Real & raw: ảnh thật của phòng gym, không quá chỉnh sửa
- Không dùng: stock photo model nước ngoài, background trắng nhàm chán

### Color palette Gym
Primary: #0A0A0A (deep black) hoặc #1A1A2E (dark navy)
Accent: #F5E642 (electric yellow) hoặc #E63946 (power red) hoặc #00D4FF (electric blue)
Text: #FFFFFF (white) hoặc accent color
Avoid: pastel, muted tones, beige (không phù hợp energy gym)

### Composition rules
- Subject chính: người đang tập / thiết bị gym / food meal prep
- Angle: low angle (nhìn lên) = powerful. Eye level = relatable
- Lighting: dramatic single-source light hoặc gym fluorescent
- Rule of thirds: subject ở 1/3 frame, text space còn lại

## Image prompt templates theo content type

### TIP post
Base prompt:
"[Subject đang thực hiện động tác] in a modern gym, dramatic lighting, dark background,
cinematic color grading, high contrast, professional sports photography style,
action shot, muscle definition visible, motivated expression"

Ví dụ squat tip:
"Athletic person performing perfect squat form in modern gym, dramatic side lighting,
dark charcoal background, cinematic grade, Nike campaign aesthetic,
high contrast, sharp details, motivated determined expression"

### MOTIVATION post
Base prompt:
"Dramatic gym motivation scene, [specific scene], dark background with single
dramatic light source, bold shadows, cinematic composition, high contrast black
and yellow color grade, powerful athletic aesthetic"

### PROMO post
Base prompt:
"Modern gym interior, bright and inviting, [equipment/class scene],
professional photography, clean and energetic atmosphere,
[brand color] accent lighting, wide angle showing facilities"

### MEAL/NUTRITION post
Base prompt:
"Fitness meal prep flat lay, [food items], dark wooden surface,
gym aesthetic, high protein foods, clean eating style,
overhead shot, natural lighting, food photography style"

## Style modifiers luôn dùng
"sports photography style, high quality, professional, sharp focus,
cinematic color grade, 4K quality"

## Negative prompt luôn dùng
"text, watermark, logo, blurry, low quality, grainy, distorted,
fake looking, stock photo style, overly edited, cartoon,
obese body, injury, pain expression, dark depressing mood"

## Moderation flags cho Gym
- Ảnh có người → flag moderation = true (dùng stock gym hoặc equipment thay thế khi cần)
- Không prompt "before/after weight loss" (sensitive)
- Không prompt body parts cụ thể quá chi tiết
- Ảnh thiết bị, không gian gym → safe, auto-approve
