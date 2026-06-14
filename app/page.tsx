import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 480, padding: '0 16px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 16, backgroundColor: '#1877F2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 24px', color: 'white',
          boxShadow: '0 4px 20px rgba(24,119,242,0.4)',
        }}>✨</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#050505', margin: '0 0 8px' }}>
          AI Social Manager
        </h1>
        <p style={{ fontSize: 16, color: '#65676B', margin: '0 0 32px', lineHeight: 1.6 }}>
          Tự động tạo content & đăng bài mạng xã hội bằng AI.<br />
          Powered by GoldenSea Studios.
        </p>
        <Link href="/dashboard" style={{
          display: 'inline-block', backgroundColor: '#1877F2', color: '#fff',
          textDecoration: 'none', padding: '12px 32px', borderRadius: 8,
          fontSize: 16, fontWeight: 700,
          boxShadow: '0 2px 8px rgba(24,119,242,0.4)',
        }}>
          Vào Dashboard →
        </Link>
      </div>
    </div>
  )
}
