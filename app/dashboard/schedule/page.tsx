'use client'
import { useState, useEffect } from 'react'

type ScheduledPost = {
  id: string
  post_code: string
  client_id: string
  platforms: string[]
  content_type: string
  scheduled_at: string | null
  status: string
  copy_vi: string | null
  copy_en: string | null
}

const PLATFORM_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  facebook: { bg: '#E7F3FF', color: '#1877F2', icon: '📘' },
  instagram: { bg: '#FCE7F3', color: '#E1306C', icon: '📷' },
  tiktok: { bg: '#F0FFF4', color: '#010101', icon: '🎵' },
  linkedin: { bg: '#E8F4FD', color: '#0A66C2', icon: '💼' },
  x: { bg: '#F7F7F7', color: '#000000', icon: '✖' },
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  tip: { bg: '#E7F3FF', color: '#1877F2' },
  promo: { bg: '#FEF3C7', color: '#D97706' },
  viral: { bg: '#FCE7F3', color: '#DB2777' },
  regular: { bg: '#F0F2F5', color: '#65676B' },
  motivation: { bg: '#ECFDF5', color: '#059669' },
  story: { bg: '#F5F3FF', color: '#7C3AED' },
  seasonal: { bg: '#FFF7ED', color: '#EA580C' },
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function groupByDay(posts: ScheduledPost[]) {
  const groups: Record<string, ScheduledPost[]> = {}
  for (const p of posts) {
    const key = p.scheduled_at
      ? new Date(p.scheduled_at).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'Chưa lên lịch'
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }
  return groups
}

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { loadSchedule() }, [])

  async function loadSchedule() {
    setLoading(true)
    try {
      const res = await fetch('/api/schedule')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch { setPosts([]) }
    setLoading(false)
  }

  async function publishNow(postId: string) {
    setPublishingId(postId)
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      })
      const data = await res.json()
      if (data.ok) {
        showToast('Đã publish thành công!')
        await loadSchedule()
      } else {
        showToast(`Lỗi: ${data.error}`)
      }
    } catch {
      showToast('Không thể kết nối API')
    }
    setPublishingId(null)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const grouped = groupByDay(posts.sort((a, b) =>
    (a.scheduled_at || '').localeCompare(b.scheduled_at || '')
  ))

  const totalScheduled = posts.filter(p => p.status === 'scheduled').length
  const totalApproved = posts.filter(p => p.status === 'approved').length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 72, right: 16, zIndex: 999,
          backgroundColor: '#050505', color: '#fff', padding: '10px 18px',
          borderRadius: 8, fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}>{toast}</div>
      )}

      {/* Header */}
      <div style={{
        backgroundColor: '#fff', borderRadius: 12, padding: '16px 20px',
        marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        border: '1px solid #E4E6EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#050505' }}>📅 Lịch đăng bài</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#65676B' }}>
            {loading ? 'Đang tải...' : `${totalScheduled} bài đã lên lịch • ${totalApproved} bài đã duyệt chờ lịch`}
          </p>
        </div>
        <button onClick={loadSchedule} style={{
          backgroundColor: '#1877F2', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
        }}>🔄 Làm mới</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Tổng bài', value: posts.length, color: '#1877F2', bg: '#E7F3FF' },
          { label: 'Đã lên lịch', value: totalScheduled, color: '#059669', bg: '#ECFDF5' },
          { label: 'Chờ lịch', value: totalApproved, color: '#D97706', bg: '#FEF3C7' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: '#fff', borderRadius: 12, padding: '16px 20px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, backgroundColor: s.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: s.color,
            }}>{s.value}</div>
            <span style={{ fontSize: 14, color: '#65676B', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#65676B' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>Đang tải...
        </div>
      )}

      {/* Empty */}
      {!loading && posts.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: '#fff',
          borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#050505' }}>Chưa có bài nào được lên lịch</div>
          <div style={{ fontSize: 14, color: '#65676B', marginTop: 8 }}>
            Duyệt bài trong Review Queue để tự động lên lịch.
          </div>
        </div>
      )}

      {/* Calendar grouped by day */}
      {!loading && posts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(grouped).map(([day, dayPosts]) => (
            <div key={day}>
              {/* Day header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
              }}>
                <div style={{
                  backgroundColor: '#1877F2', borderRadius: 8,
                  padding: '4px 14px', color: '#fff', fontSize: 13, fontWeight: 700,
                }}>{day}</div>
                <div style={{ fontSize: 12, color: '#65676B' }}>{dayPosts.length} bài</div>
                <div style={{ flex: 1, height: 1, backgroundColor: '#E4E6EB' }} />
              </div>

              {/* Posts for this day */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dayPosts.map(post => {
                  const platform = post.platforms?.[0] || 'facebook'
                  const pStyle = PLATFORM_COLORS[platform] || PLATFORM_COLORS.facebook
                  const tStyle = TYPE_COLORS[post.content_type] || TYPE_COLORS.regular
                  const copy = post.copy_vi || post.copy_en || ''
                  const isPublishing = publishingId === post.id

                  return (
                    <div key={post.id} style={{
                      backgroundColor: '#fff', borderRadius: 12, padding: '16px 20px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
                      display: 'flex', gap: 16, alignItems: 'flex-start',
                    }}>
                      {/* Time column */}
                      <div style={{
                        flexShrink: 0, width: 72, textAlign: 'center',
                        paddingTop: 4,
                      }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: 12,
                          backgroundColor: pStyle.bg, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                        }}>
                          <span style={{ fontSize: 20 }}>{pStyle.icon}</span>
                        </div>
                        {post.scheduled_at && (
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#050505', marginTop: 6 }}>
                            {formatTime(post.scheduled_at)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: pStyle.color }}>{platform}</span>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                            backgroundColor: tStyle.bg, color: tStyle.color,
                          }}>{post.content_type.toUpperCase()}</span>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            backgroundColor: post.status === 'scheduled' ? '#ECFDF5' : '#FEF3C7',
                            color: post.status === 'scheduled' ? '#059669' : '#D97706',
                            fontWeight: 600,
                          }}>{post.status === 'scheduled' ? '✓ Scheduled' : '⏳ Pending'}</span>
                        </div>
                        <div style={{
                          fontSize: 13, color: '#050505', lineHeight: 1.5,
                          whiteSpace: 'pre-wrap', overflow: 'hidden',
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                        }}>
                          {copy.slice(0, 200) || '—'}
                        </div>
                        <div style={{ fontSize: 11, color: '#65676B', marginTop: 4 }}>{post.post_code}</div>
                      </div>

                      {/* Publish button */}
                      <button
                        onClick={() => publishNow(post.id)}
                        disabled={isPublishing}
                        style={{
                          flexShrink: 0, backgroundColor: '#1877F2', color: '#fff',
                          border: 'none', borderRadius: 8, padding: '8px 14px',
                          cursor: isPublishing ? 'not-allowed' : 'pointer',
                          fontSize: 13, fontWeight: 600, opacity: isPublishing ? 0.6 : 1,
                        }}
                      >
                        {isPublishing ? '⏳' : '🚀 Publish'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
