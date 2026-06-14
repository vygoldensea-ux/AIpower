import fs from 'fs'
import path from 'path'

export interface IndustrySkills {
  content: string
  image: string
  video: string
}

const INDUSTRY_MAP: Record<string, string> = {
  gym: 'gym',
  fitness: 'gym',
  'phòng gym': 'gym',
  yoga: 'gym',
  spa: 'spa',
  'làm đẹp': 'spa',
  beauty: 'spa',
  fnb: 'fnb',
  'f&b': 'fnb',
  'nhà hàng': 'fnb',
  cafe: 'fnb',
  'quán ăn': 'fnb',
  fashion: 'fashion',
  'thời trang': 'fashion',
}

export function loadIndustrySkills(industry: string): IndustrySkills {
  const normalized = industry.toLowerCase().trim()
  const skillFolder = INDUSTRY_MAP[normalized] || 'general'
  const skillsPath = path.join(process.cwd(), 'skills', skillFolder)

  const load = (file: string): string => {
    try {
      return fs.readFileSync(path.join(skillsPath, file), 'utf-8')
    } catch {
      try {
        return fs.readFileSync(path.join(process.cwd(), 'skills', 'general', file), 'utf-8')
      } catch {
        return ''
      }
    }
  }

  return {
    content: load('content-skill.md'),
    image: load('image-skill.md'),
    video: load('video-skill.md'),
  }
}
