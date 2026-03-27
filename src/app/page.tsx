'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.push('/home')
  }, [user, loading, router])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'16px' }}>טוען...</div>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #192542 0%, #1e3a6e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Heebo, sans-serif',
      direction: 'rtl',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>🏡</div>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>סדר בסדר</h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '14px', marginTop: '10px', lineHeight: 1.7 }}>
          כל החגים, כל האנשים,<br/>כל הזיכרונות – במקום אחד
        </p>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '360px',
        background: 'rgba(255,255,255,.07)',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: '24px',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '13px', textAlign: 'center', margin: '0 0 4px' }}>
          התחבר/י כדי להמשיך
        </p>
        <button
          onClick={signInWithGoogle}
          style={{
            width: '100%',
            padding: '14px',
            background: 'white',
            border: 'none',
            borderRadius: '14px',
            color: '#192542',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Heebo, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 16px rgba(0,0,0,.15)',
          }}
        >
          🔍 המשך עם גוגל
        </button>
      </div>
    </div>
  )
}
