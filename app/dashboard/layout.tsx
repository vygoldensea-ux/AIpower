'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: '🏠' },
  { href: '/dashboard/queue', label: 'Duyệt bài', icon: '📋' },
  { href: '/dashboard/schedule', label: 'Lịch đăng', icon: '📅' },
  { href: '/dashboard/clients', label: 'Khách hàng', icon: '👥' },
  { href: '/dashboard/analytics', label: 'Báo cáo', icon: '📊' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      {/* Top Navbar — Facebook style */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: '#fff', borderBottom: '1px solid #CED0D4',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 56,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8, backgroundColor: '#1877F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'white', fontWeight: 900,
          }}>✨</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1877F2' }}>AI Social</span>
          <span style={{ fontSize: 12, color: '#65676B', marginLeft: 4 }}>by GoldenSea</span>
        </div>

        {/* Center nav */}
        <div style={{ display: 'flex', gap: 4 }}>
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 20px', borderRadius: 8, textDecoration: 'none',
                backgroundColor: active ? '#E7F3FF' : 'transparent',
                borderBottom: active ? '3px solid #1877F2' : '3px solid transparent',
                color: active ? '#1877F2' : '#65676B',
                transition: 'all 0.15s',
                fontSize: 20,
              }}>
                <span>{item.icon}</span>
                <span style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Right: Agency name */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          backgroundColor: '#F0F2F5', borderRadius: 20,
          padding: '6px 12px',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', backgroundColor: '#1877F2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: 14,
          }}>G</div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#050505' }}>GoldenSea</span>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ paddingTop: 56 }}>
        {children}
      </main>
    </div>
  )
}
