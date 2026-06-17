import fs from 'fs'
import path from 'path'

const SKILLS_DIR = path.join(process.cwd(), 'lib/prompts/skills')

function readSkill(filename: string): string {
  try {
    return fs.readFileSync(path.join(SKILLS_DIR, filename), 'utf-8')
  } catch {
    return ''
  }
}

// Full skill bundle for Vy Hoàng — GoldenSea BDM
export function getVyHoangSkills(): string {
  const brand = readSkill('goldensea-brand.md')
  const voice = readSkill('vy-hoang-voice.md')
  const salary = readSkill('salary-data.md')

  return `
# === GOLDENSEA BRAND CONTEXT ===
${brand}

# === VY HOÀNG VOICE & CONTENT SYSTEM ===
${voice}

# === SALARY BENCHMARK DATA 2025 ===
${salary}
`.trim()
}

// Just brand context (for onboarding / brief bot)
export function getGoldenSeaBrand(): string {
  return readSkill('goldensea-brand.md')
}

// Just voice rules (for content generation)
export function getVyHoangVoice(): string {
  return readSkill('vy-hoang-voice.md')
}

// Just salary data (for cost comparison posts)
export function getSalaryData(): string {
  return readSkill('salary-data.md')
}
