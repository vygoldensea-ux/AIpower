'use client'
import { useState, useEffect } from 'react'

type Post = {
  id: string
  post_code: string
  content_type: string
  platforms: string[]
  copy_vi: string | null
  copy_en: string | null
  clients?: { brand_name: string; industry: string }
  visual_assets?: { storage_url: string }[]
}

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => { loadQueue() }, [])

  async function loadQueue() {
    setLoading(true)
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await sb
        .from('content_queue')
        .select('*, clients(brand_name, industry), visual_assets(*)')
        .eq('status', 'review_pending')
        .order('created_at', { ascending: false })
      setPosts(data || [])
    } catch { setPosts([]) }
    setLoading(false)
  }

  async function approve(postId: string) {
    setActionLoading(postId)
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    await fetch('/api/content/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, scheduledAt }),
    })
    await loadQueue()
    setActionLoading(null)
  }

  async function reject(postId: string) {
    const reason = window.prompt('Lý do từ chối?') || 'No reason'
    setActionLoading(postId)
    await fetch('/api/content/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, reason }),
    })
    await loadQueue()
    setActionLoading(null)
  }

  const typeColors: Record<string, { bg: string; color: string }> = {
    tip: { bg: '#E7F3FF', color: '#1877F2' },
    promo: { bg: '#FEF3C7', color: '#D97706' },
    viral: { bg: '#FCE7F3', color: '#DB2777' },
    regular: { bg: '#F0F2F5', color: '#65676B' },
    motivation: { bg: '#ECFDF5', color: '#059669' },
    story: { bg: '#F5F3FF', color: '#7C3AED' },
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: '16px 20px',
        marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        border: '1px solid #E4E6EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#050505' }}>
            📋 Review Queue
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#65676B' }}>
            {loading ? 'Đang tải...' : `${posts.length} bài chờ duyệt`}
          </p>
        </div>
        <button
          onClick={loadQueue}
          style={{
            backgroundColor: '#1877F2', color: '#fff', border: 'none',
            borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          🔄 Làm mới
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#65676B' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          Đang tải...
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: '#fff',
          borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#050505' }}>Không có bài nào cần duyệt!</div>
          <div style={{ fontSize: 14, color: '#65676B', marginTop: 8 }}>Tất cả bài đã được xử lý rồi.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {posts.map(post => {
          const typeStyle = typeColors[post.content_type] || typeColors.regular
          const copy = post.copy_vi || post.copy_en || ''
          return (
            <div key={post.id} style={{
              backgroundColor: '#fff', borderRadius: 12, padding: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
            }}>
              {/* Post header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', backgroundColor: '#1877F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0,
                  }}>
                    {(post.clients?.brand_name || 'B')[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#050505' }}>
                      {post.clients?.brand_name || 'Unknown Brand'}
                    </div>
                    <div style={{ fontSize: 12, color: '#65676B' }}>
                      {post.clients?.industry} • {post.post_code}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                    backgroundColor: typeStyle.bg, color: typeStyle.color,
                  }}>
                    {post.content_type.toUpperCase()}
                  </span>
                  {post.platforms?.map(p => (
                    <span key={p} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      backgroundColor: '#F0F2F5', color: '#65676B', fontWeight: 500,
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content preview */}
              <div style={{
                backgroundColor: '#F0F2F5', borderRadius: 8, padding: 14,
                fontSize: 14, lineHeight: 1.6, color: '#050505', marginBottom: 12,
                whiteSpace: 'pre-wrap', maxHeight: 150, overflow: 'hidden',
                position: 'relative',
              }}>
                {copy.slice(0, 300)}{copy.length > 300 ? '...' : ''}
              </div>

              {/* Visual preview */}
              {post.visual_assets?.[0]?.storage_url && (
                <img
                  src={post.visual_assets[0].storage_url}
                  alt="Visual"
                  style={{ width: 160, height: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }}
                />
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid #E4E6EB' }}>
                <button
                  onClick={() => approve(post.id)}
                  disabled={actionLoading === post.id}
                  style={{
                    backgroundColor: '#42B72A', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
                    opacity: actionLoading === post.id ? 0.7 : 1,
                  }}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => reject(post.id)}
                  disabled={actionLoading === post.id}
                  style={{
                    backgroundColor: '#F0F2F5', color: '#FA3E3E', border: '1px solid #FA3E3E',
                    borderRadius: 8, padding: '8px 20px', cursor: 'pointer',
                    fontSize: 14, fontWeight: 600,
                    opacity: actionLoading === post.id ? 0.7 : 1,
                  }}
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
