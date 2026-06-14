import axios from 'axios'

export async function searchUnsplash(query: string, count = 3): Promise<string[]> {
  try {
    const res = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, per_page: count, orientation: 'squarish' },
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` }
    })
    return res.data.results.map((p: any) => p.urls.regular)
  } catch { return [] }
}

export async function searchPexels(query: string, count = 3): Promise<string[]> {
  try {
    const res = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, per_page: count },
      headers: { Authorization: process.env.PEXELS_API_KEY! }
    })
    return res.data.photos.map((p: any) => p.src.large)
  } catch { return [] }
}
