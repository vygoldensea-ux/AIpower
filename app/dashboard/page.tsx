'use client'
import { useState } from 'react'
import Link from 'next/link'

const statCards = [
  { key: 'clients', label: 'Active Clients', icon: '👥', href: '/dashboard/clients', color: '#1877F2', bg: '#E7F3FF' },
  { key: 'pending', label: 'Cần duyệt', icon: '⏳', href: '/dashboard/queue', color: '#F59E0B', bg: '#FFFBEB' },
  { key: 'scheduled', label: 'Đã lên lịch', icon: '📅', href: '/dashboard/schedule', color: '#10B981', bg: '#ECFDF5' },
  { key: 'published', label: 'Đã đăng', icon: '✅', href: '/dashboard/analytics', color: '#8B5CF6', bg: '#F5F3FF' },
]

export default function DashboardPage() {
  const [stats] = useState({ clients: 0, pending: 0, scheduled: 0, published: 0 })

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {/* Welcome banner */}
      <div style={{
        backgroundColor: '#1877F2', borderRadius: 12, padding: '24px 32px',
        marginBottom: 24, color: 'white',
        backgroundImage: 'linear-gradient(135deg, #1877F2 0%, #0C5AC8 100%)',
      }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>👋 Xin chào, GoldenSea Studios!</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.85, fontSize: 15 }}>
          Hệ thống AI Social Media Manager đang hoạt động. Hôm nay tạo content cho khách nào?
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {statCards.map(card => (
          <Link key={card.key} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: '#fff', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
              cursor: 'pointer', transition: 'box-shadow 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: card.color }}>
                    {stats[card.key as keyof typeof stats]}
                  </div>
                  <div style={{ fontSize: 13, color: '#65676B', marginTop: 4 }}>{card.label}</div>
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  backgroundColor: card.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {card.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Quick actions */}
        <div style={{
          backgroundColor: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: '#050505' }}>⚡ Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: '📋 Duyệt bài đang chờ', href: '/dashboard/queue', color: '#1877F2' },
              { label: '📅 Xem lịch đăng tuần này', href: '/dashboard/schedule', color: '#10B981' },
              { label: '👥 Thêm khách hàng mới', href: '/dashboard/clients', color: '#F59E0B' },
              { label: '📊 Xem báo cáo tuần', href: '/dashboard/analytics', color: '#8B5CF6' },
            ].map(action => (
              <Link key={action.href} href={action.href} style={{
                display: 'flex', alignItems: 'center', padding: '10px 14px',
                borderRadius: 8, backgroundColor: '#F0F2F5',
                textDecoration: 'none', color: '#050505',
                fontSize: 14, fontWeight: 500,
                transition: 'background-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E4E6EB')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#F0F2F5')}
              >
                {action.label}
                <span style={{ marginLeft: 'auto', color: action.color }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        {/* System status */}
        <div style={{
          backgroundColor: '#fff', borderRadius: 12, padding: 20,
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)', border: '1px solid #E4E6EB',
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: '#050505' }}>🔧 Trạng thái hệ thống</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Claude AI (Content)', status: 'Sẵn sàng', ok: true },
              { label: 'DALL-E 3 (Images)', status: 'Sẵn sàng', ok: true },
              { label: 'Supabase (Database)', status: 'Cần cấu hình', ok: false },
              { label: 'Ayrshare (Posting)', status: 'Cần cấu hình', ok: false },
              { label: 'Telegram Bot', status: 'Cần cấu hình', ok: false },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#050505' }}>{item.label}</span>
                <span style={{
                  fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                  backgroundColor: item.ok ? '#ECFDF5' : '#FEF3C7',
                  color: item.ok ? '#059669' : '#D97706',
                }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: '10px 14px', backgroundColor: '#E7F3FF', borderRadius: 8, fontSize: 13, color: '#1877F2' }}>
            💡 Điền API keys vào <code>.env.local</code> để kích hoạt đầy đủ
          </div>
        </div>
      </div>
    </div>
  )
}
