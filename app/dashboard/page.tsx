'use client'
import Link from 'next/link'

const stats = [
  { label: 'Active Clients', value: '0', sub: 'Total onboarded', color: '#0066FF', bg: '#EFF4FF', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )},
  { label: 'Pending Review', value: '0', sub: 'Awaiting approval', color: '#F79009', bg: '#FFFAEB', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F79009" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )},
  { label: 'Scheduled', value: '0', sub: 'Ready to publish', color: '#12B76A', bg: '#ECFDF3', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )},
  { label: 'Published', value: '0', sub: 'This month', color: '#7F56D9', bg: '#F4F3FF', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7F56D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )},
]

const quickActions = [
  { label: 'Review pending posts', href: '/dashboard/queue', color: '#0066FF', desc: '0 posts waiting' },
  { label: 'View this week schedule', href: '/dashboard/schedule', color: '#12B76A', desc: 'No posts scheduled' },
  { label: 'Add new client', href: '/dashboard/clients', color: '#F79009', desc: 'Onboard via Telegram' },
  { label: 'Weekly analytics report', href: '/dashboard/analytics', color: '#7F56D9', desc: 'Last 7 days' },
]

const systemStatus = [
  { label: 'Claude AI', desc: 'Content generation', ok: true },
  { label: 'Supabase', desc: 'Database & storage', ok: true },
  { label: 'Ayrshare', desc: 'Social publishing', ok: true },
  { label: 'Telegram Bot', desc: 'Chat interface', ok: true },
]

export default function DashboardPage() {
  return (
    <div style={{ padding: '32px 32px', maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#101828', letterSpacing: '-0.4px' }}>Overview</div>
        <div style={{ fontSize: 14, color: '#667085', marginTop: 4 }}>Welcome back, Vy. Here&apos;s what&apos;s happening today.</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            backgroundColor: '#fff', borderRadius: 12, padding: '20px',
            border: '1px solid #EAECF0', boxShadow: '0 1px 3px rgba(16,24,40,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#101828', letterSpacing: '-0.5px' }}>{s.value}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#344054', marginTop: 2 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Quick Actions */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #EAECF0', boxShadow: '0 1px 3px rgba(16,24,40,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #EAECF0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>Quick Actions</div>
            <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>Jump to what matters</div>
          </div>
          <div style={{ padding: '8px 12px' }}>
            {quickActions.map(a => (
              <Link key={a.href} href={a.href} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 8px', borderRadius: 8, textDecoration: 'none',
                transition: 'background 0.12s',
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: a.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#344054' }}>{a.label}</div>
                    <div style={{ fontSize: 11, color: '#667085' }}>{a.desc}</div>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#98A2B3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid #EAECF0', boxShadow: '0 1px 3px rgba(16,24,40,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #EAECF0' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#101828' }}>System Status</div>
            <div style={{ fontSize: 12, color: '#667085', marginTop: 2 }}>All services operational</div>
          </div>
          <div style={{ padding: '8px 12px' }}>
            {systemStatus.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 8px', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    backgroundColor: s.ok ? '#12B76A' : '#F04438',
                    boxShadow: s.ok ? '0 0 0 3px #ECFDF3' : '0 0 0 3px #FEF3F2',
                  }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#344054' }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: '#667085' }}>{s.desc}</div>
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20,
                  backgroundColor: s.ok ? '#ECFDF3' : '#FEF3F2',
                  color: s.ok ? '#027A48' : '#B42318',
                }}>
                  {s.ok ? 'Online' : 'Offline'}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div style={{ padding: '0 12px 12px' }}>
            <div style={{ padding: '12px 16px', backgroundColor: '#EFF4FF', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ fontSize: 12, color: '#0066FF', fontWeight: 500 }}>
                Bot is live — message Telegram to create content
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
