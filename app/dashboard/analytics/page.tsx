'use client'
import { useState } from 'react'

type ReportData = {
  periodLabel: string
  normalized: {
    period: { start: string; end: string; days: number }
    facebook: {
      page_reach: number
      total_engagement: number
      engagement_rate: number
      page_likes_gained: number
      posts_count: number
      top_posts: Array<{ copy_preview: string; reach: number; engagement: number; type: string }>
    } | null
    instagram: {
      account_reach: number
      likes: number
      comments: number
      saves: number
      engagement_rate: number
      followers_gained: number
      posts_count: number
    } | null
    combined: {
      total_reach: number
      total_engagement: number
      total_new_followers: number
      average_engagement_rate: number
      total_posts: number
    }
  }
  analysis: {
    overall_rating: string
    rating_vs_benchmark: string
    platform_winner: string
    platform_winner_reason: string
    best_content_type: string
    key_insights: string[]
  }
  recommendations: Array<{
    priority: number
    type: string
    title_vi: string
    recommendation_vi: string
    expected_impact: string
  }>
  reportText: string
}

const RATING_CONFIG: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  excellent: { color: '#059669', bg: '#ECFDF5', label: 'Xuất sắc', emoji: '✨' },
  good: { color: '#1877F2', bg: '#E7F3FF', label: 'Tốt', emoji: '👍' },
  average: { color: '#D97706', bg: '#FEF3C7', label: 'Trung bình', emoji: '📈' },
  needs_improvement: { color: '#DC2626', bg: '#FEE2E2', label: 'Cần cải thiện', emoji: '💪' },
}

const REC_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  quick_win: { bg: '#ECFDF5', color: '#059669' },
  content_strategy: { bg: '#E7F3FF', color: '#1877F2' },
  growth_play: { bg: '#F5F3FF', color: '#7C3AED' },
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0)
  return (
    <div style={{ height: 8, backgroundColor: '#F0F2F5', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  )
}

export default function AnalyticsPage() {
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [clientId, setClientId] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [tab, setTab] = useState<'overview' | 'platforms' | 'recs' | 'message'>('overview')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function generateReport() {
    if (!clientId.trim()) { showToast('Nhập Client ID trước'); return }
    setGenerating(true)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientId.trim() }),
      })
      const data = await res.json()
      if (data.ok) { setReport(data.report); showToast('Báo cáo đã tạo xong!') }
      else showToast(`Lỗi: ${data.error}`)
    } catch { showToast('Không thể tạo báo cáo') }
    setGenerating(false)
  }

  const r = report
  const rating = r?.analysis?.overall_rating
  const rCfg = RATING_CONFIG[rating || ''] || RATING_CONFIG.average
  const maxReach = Math.max(
    r?.normalized?.facebook?.page_reach || 0,
    r?.normalized?.instagram?.account_reach || 0,
    1
  )

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
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
        border: '1px solid #E4E6EB',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: r ? 0 : 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#050505' }}>📊 Báo cáo & Analytics</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#65676B' }}>
              {r ? `Kỳ báo cáo: ${r.periodLabel}` : 'Tạo báo cáo AI cho bất kỳ client nào'}
            </p>
          </div>
          {r && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: rCfg.bg, borderRadius: 10, padding: '8px 14px',
            }}>
              <span style={{ fontSize: 20 }}>{rCfg.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: rCfg.color }}>{rCfg.label}</div>
                <div style={{ fontSize: 11, color: '#65676B' }}>{r.analysis?.rating_vs_benchmark} benchmark</div>
              </div>
            </div>
          )}
        </div>

        {/* Generate form */}
        {!r && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Nhập Client ID..."
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateReport()}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8,
                border: '1px solid #CED0D4', fontSize: 14, outline: 'none',
                backgroundColor: '#F0F2F5',
              }}
            />
            <button onClick={generateReport} disabled={generating} style={{
              backgroundColor: '#1877F2', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 20px', cursor: generating ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, opacity: generating ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}>
              {generating ? '⏳ Đang tạo...' : '✨ Tạo báo cáo AI'}
            </button>
          </div>
        )}

        {r && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => setReport(null)} style={{
              backgroundColor: '#F0F2F5', color: '#65676B', border: 'none',
              borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
            }}>← Tạo báo cáo mới</button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!r && !loading && !generating && (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: '#fff',
          borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#050505' }}>Chưa có báo cáo nào</div>
          <div style={{ fontSize: 14, color: '#65676B', marginTop: 8 }}>
            Nhập Client ID ở trên và nhấn &quot;Tạo báo cáo AI&quot; để bắt đầu.
          </div>
        </div>
      )}

      {generating && (
        <div style={{
          textAlign: 'center', padding: 60, backgroundColor: '#fff',
          borderRadius: 12, boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#050505' }}>Đang phân tích dữ liệu...</div>
          <div style={{ fontSize: 14, color: '#65676B', marginTop: 8 }}>
            AI đang chạy 4 module phân tích (5A → 5B → 5C → 5D)
          </div>
        </div>
      )}

      {/* Report content */}
      {r && (
        <>
          {/* KPI summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Tiếp cận', value: (r.normalized.combined.total_reach || 0).toLocaleString('vi'), icon: '👁', color: '#1877F2', bg: '#E7F3FF' },
              { label: 'Tương tác', value: (r.normalized.combined.total_engagement || 0).toLocaleString('vi'), icon: '❤️', color: '#E1306C', bg: '#FCE7F3' },
              { label: 'Follower mới', value: `+${r.normalized.combined.total_new_followers || 0}`, icon: '👥', color: '#059669', bg: '#ECFDF5' },
              { label: 'Tỷ lệ tương tác', value: `${(r.normalized.combined.average_engagement_rate || 0).toFixed(1)}%`, icon: '📈', color: '#7C3AED', bg: '#F5F3FF' },
            ].map(k => (
              <div key={k.label} style={{
                backgroundColor: '#fff', borderRadius: 12, padding: '16px 20px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 8, backgroundColor: k.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                  }}>{k.icon}</span>
                  <span style={{ fontSize: 13, color: '#65676B' }}>{k.label}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, marginBottom: 16,
            backgroundColor: '#fff', borderRadius: 12, padding: 6,
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
          }}>
            {(['overview', 'platforms', 'recs', 'message'] as const).map(t => {
              const labels = { overview: '🏠 Tổng quan', platforms: '📱 Platforms', recs: '💡 Đề xuất', message: '📨 Tin nhắn' }
              return (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400,
                  backgroundColor: tab === t ? '#E7F3FF' : 'transparent',
                  color: tab === t ? '#1877F2' : '#65676B',
                }}>{labels[t]}</button>
              )
            })}
          </div>

          {/* Overview tab */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Insights */}
              {r.analysis?.key_insights?.length > 0 && (
                <div style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
                }}>
                  <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#050505' }}>🔍 Key Insights</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.analysis.key_insights.map((insight, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: '50%', backgroundColor: '#E7F3FF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#1877F2', flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 14, color: '#050505', lineHeight: 1.5 }}>{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform winner */}
              {r.analysis?.platform_winner && (
                <div style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
                  borderLeft: '4px solid #42B72A',
                }}>
                  <div style={{ fontSize: 13, color: '#65676B', marginBottom: 4 }}>🏆 Platform hoạt động tốt nhất</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#050505', marginBottom: 4 }}>
                    {r.analysis.platform_winner.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 14, color: '#65676B', lineHeight: 1.5 }}>{r.analysis.platform_winner_reason}</div>
                </div>
              )}
            </div>
          )}

          {/* Platforms tab */}
          {tab === 'platforms' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {r.normalized.facebook && (
                <div style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
                }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1877F2' }}>📘 Facebook</h3>
                  {[
                    { label: 'Tiếp cận', value: r.normalized.facebook.page_reach, max: maxReach, color: '#1877F2' },
                    { label: 'Tương tác', value: r.normalized.facebook.total_engagement, max: r.normalized.combined.total_engagement, color: '#42B72A' },
                    { label: 'Like mới', value: r.normalized.facebook.page_likes_gained, max: 200, color: '#E1306C' },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#65676B' }}>{m.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#050505' }}>{m.value?.toLocaleString('vi')}</span>
                      </div>
                      <StatBar value={m.value || 0} max={m.max} color={m.color} />
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', gap: 12, marginTop: 8, paddingTop: 12, borderTop: '1px solid #F0F2F5',
                  }}>
                    <span style={{ fontSize: 13, color: '#65676B' }}>Engagement rate:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                      {r.normalized.facebook.engagement_rate?.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 13, color: '#65676B', marginLeft: 'auto' }}>
                      {r.normalized.facebook.posts_count} bài đăng
                    </span>
                  </div>
                </div>
              )}

              {r.normalized.instagram && (
                <div style={{
                  backgroundColor: '#fff', borderRadius: 12, padding: '20px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
                }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#E1306C' }}>📷 Instagram</h3>
                  {[
                    { label: 'Tiếp cận', value: r.normalized.instagram.account_reach, max: maxReach, color: '#E1306C' },
                    { label: 'Likes', value: r.normalized.instagram.likes, max: r.normalized.combined.total_engagement, color: '#F97316' },
                    { label: 'Saves', value: r.normalized.instagram.saves, max: 200, color: '#7C3AED' },
                    { label: 'Follower mới', value: r.normalized.instagram.followers_gained, max: 200, color: '#059669' },
                  ].map(m => (
                    <div key={m.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#65676B' }}>{m.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#050505' }}>{m.value?.toLocaleString('vi')}</span>
                      </div>
                      <StatBar value={m.value || 0} max={m.max} color={m.color} />
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', gap: 12, marginTop: 8, paddingTop: 12, borderTop: '1px solid #F0F2F5',
                  }}>
                    <span style={{ fontSize: 13, color: '#65676B' }}>Engagement rate:</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                      {r.normalized.instagram.engagement_rate?.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 13, color: '#65676B', marginLeft: 'auto' }}>
                      {r.normalized.instagram.posts_count} bài đăng
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations tab */}
          {tab === 'recs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(r.recommendations || []).map((rec, i) => {
                const recColor = REC_TYPE_COLORS[rec.type] || REC_TYPE_COLORS.content_strategy
                return (
                  <div key={i} style={{
                    backgroundColor: '#fff', borderRadius: 12, padding: '20px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
                    borderLeft: `4px solid ${recColor.color}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: '50%', backgroundColor: recColor.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: recColor.color, flexShrink: 0,
                      }}>{rec.priority}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        backgroundColor: recColor.bg, color: recColor.color,
                      }}>{rec.type?.replace('_', ' ').toUpperCase()}</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#050505' }}>{rec.title_vi}</span>
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 14, color: '#050505', lineHeight: 1.6 }}>
                      {rec.recommendation_vi}
                    </p>
                    {rec.expected_impact && (
                      <div style={{
                        fontSize: 13, color: '#059669', backgroundColor: '#ECFDF5',
                        borderRadius: 6, padding: '6px 12px', display: 'inline-block',
                      }}>
                        🎯 Expected: {rec.expected_impact}
                      </div>
                    )}
                  </div>
                )
              })}
              {(!r.recommendations || r.recommendations.length === 0) && (
                <div style={{ textAlign: 'center', padding: 40, color: '#65676B', fontSize: 14 }}>
                  Chưa có recommendations
                </div>
              )}
            </div>
          )}

          {/* Message tab */}
          {tab === 'message' && (
            <div style={{
              backgroundColor: '#fff', borderRadius: 12, padding: '20px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
            }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#050505' }}>
                📨 Tin nhắn gửi cho khách
              </h3>
              <div style={{
                backgroundColor: '#F0F2F5', borderRadius: 12, padding: 16,
                fontSize: 14, lineHeight: 1.8, color: '#050505', whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
              }}>
                {r.reportText}
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(r.reportText); showToast('Đã copy!') }}
                style={{
                  marginTop: 12, backgroundColor: '#1877F2', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >📋 Copy tin nhắn</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
