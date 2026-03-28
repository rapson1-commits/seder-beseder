'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { user, loading, signInWithEmail } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    console.log('[Login] user:', user?.email ?? 'none', '| loading:', loading)
    if (!loading && user) {
      console.log('[Login] Already logged in → redirecting to /home')
      router.push('/home')
    }
  }, [user, loading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    setError('')
    console.log('[Login] Sending magic link to:', email)
    const { error } = await signInWithEmail(email)
    if (error) {
      console.error('[Login] Error:', error)
      setError(error)
    } else {
      setSent(true)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#192542', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'white', fontSize: '16px' }}>טוען...</div>
    </div>
  )

  if (sent) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #192542 0%, #1e3a6e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✉️</div>
        <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900, margin: '0 0 12px' }}>בדוק את המייל שלך</h2>
        <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '15px', lineHeight: 1.6 }}>
          שלחנו קישור כניסה לכתובת<br />
          <strong style={{ color: 'white' }}>{email}</strong>
        </p>
        <button
          onClick={() => setSent(false)}
          style={{ marginTop: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', fontSize: '13px', cursor: 'pointer', fontFamily: 'Heebo, sans-serif' }}
        >
          שלח שוב
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #192542 0%, #1e3a6e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Heebo, sans-serif', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '72px', marginBottom: '16px' }}>🏡</div>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-1px' }}>סדר בסדר</h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '14px', marginTop: '10px', lineHeight: 1.7 }}>
          כל החגים, כל האנשים,<br />כל הזיכרונות – במקום אחד
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="כתובת מייל"
          required
          style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.07)', color: 'white', fontSize: '15px', fontFamily: 'Heebo, sans-serif', direction: 'ltr', outline: 'none', boxSizing: 'border-box' }}
        />
        <button
          type="submit"
          disabled={submitting}
          style={{ width: '100%', padding: '14px', background: submitting ? 'rgba(255,255,255,.3)' : 'white', border: 'none', borderRadius: '14px', color: '#192542', fontSize: '15px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Heebo, sans-serif' }}
        >
          {submitting ? 'שולח...' : 'שלח קישור כניסה'}
        </button>
        {error && <p style={{ color: '#f87171', fontSize: '13px', textAlign: 'center', margin: 0 }}>{error}</p>}
      </form>
    </div>
  )
}
