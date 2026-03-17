'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const joinCode = searchParams?.get('code') || ''

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/home')
      else setLoading(false)
    })
  }, [router])

  async function sendMagicLink() {
    if (!email.trim() || !email.includes('@')) { setError('הכנס כתובת מייל תקינה'); return }
    setSending(true); setError('')
    const redirectTo = joinCode
      ? `https://seder-beseder.com/home?code=${joinCode}`
      : `https://seder-beseder.com/home`
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo }
    })
    if (err) { setError('שגיאה: ' + err.message); setSending(false); return }
    setSent(true); setSending(false)
  }

  async function signInWithGoogle() {
    const redirectTo = joinCode
      ? `https://seder-beseder.com/home?code=${joinCode}`
      : `https://seder-beseder.com/home`
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:'2rem' }}>⏳</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#192542 0%,#1e3a6e 60%,#192542 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', fontFamily:'Heebo, sans-serif', direction:'rtl', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'300px', height:'300px', borderRadius:'50%', background:'rgba(240,122,85,.08)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-80px', left:'-80px', width:'250px', height:'250px', borderRadius:'50%', background:'rgba(74,130,212,.08)', pointerEvents:'none' }} />

      {/* Logo */}
      <div style={{ textAlign:'center', marginBottom:'32px', position:'relative', zIndex:1 }}>
        <div style={{ fontSize:'60px', marginBottom:'14px' }}>🏠</div>
        <h1 style={{ color:'white', fontSize:'30px', fontWeight:900, margin:'0 0 8px' }}>סדר בסדר</h1>
        <p style={{ color:'rgba(255,255,255,.5)', fontSize:'14px', margin:0 }}>עושים סדר בחגים המשפחתיים</p>
        {joinCode && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(240,122,85,.2)', border:'1px solid rgba(240,122,85,.3)', borderRadius:'100px', padding:'6px 14px', marginTop:'12px' }}>
            <span style={{ fontSize:'13px', color:'#F07A55', fontWeight:700 }}>🎉 הוזמנת להצטרף למשפחה!</span>
          </div>
        )}
      </div>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:'380px', background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'24px', padding:'28px 24px', position:'relative', zIndex:1 }}>
        {sent ? (
          <div style={{ textAlign:'center', padding:'10px 0' }}>
            <div style={{ fontSize:'52px', marginBottom:'16px' }}>📧</div>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:800, margin:'0 0 10px' }}>בדוק את המייל שלך!</h2>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:'14px', lineHeight:1.6, margin:'0 0 20px' }}>
              שלחנו קישור כניסה ל-<br/>
              <strong style={{ color:'white' }}>{email}</strong>
            </p>
            <p style={{ color:'rgba(255,255,255,.35)', fontSize:'12px', margin:0 }}>לחץ על הקישור במייל כדי להיכנס</p>
            <button onClick={() => setSent(false)} style={{ marginTop:'20px', background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:'13px', cursor:'pointer', fontFamily:'Heebo, sans-serif', textDecoration:'underline' }}>שלח שוב</button>
          </div>
        ) : (
          <>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:800, margin:'0 0 6px', textAlign:'center' }}>
              {joinCode ? 'כניסה להצטרפות' : 'ברוכים הבאים'}
            </h2>
            <p style={{ color:'rgba(255,255,255,.45)', fontSize:'13px', margin:'0 0 22px', textAlign:'center' }}>הכנס מייל וקבל קישור כניסה</p>

            <div style={{ marginBottom:'12px' }}>
              <input type="email" placeholder="הכנס כתובת מייל" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && sendMagicLink()}
                style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.15)', borderRadius:'14px', fontSize:'15px', fontFamily:'Heebo, sans-serif', direction:'rtl', color:'white', outline:'none' }} />
            </div>

            {error && <div style={{ background:'rgba(224,101,95,.15)', border:'1px solid rgba(224,101,95,.3)', borderRadius:'12px', padding:'10px 14px', marginBottom:'12px', color:'#ffb3b0', fontSize:'13px', textAlign:'center' }}>⚠️ {error}</div>}

            <button onClick={sendMagicLink} disabled={sending}
              style={{ width:'100%', padding:'14px', background:'#F07A55', border:'none', borderRadius:'14px', color:'white', fontSize:'15px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif', boxShadow:'0 4px 16px rgba(240,122,85,.35)', opacity:sending?0.7:1, marginBottom:'12px' }}>
              {sending ? '📤 שולח...' : '📧 שלח קישור כניסה'}
            </button>

            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'16px 0' }}>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,.1)' }} />
              <span style={{ color:'rgba(255,255,255,.3)', fontSize:'12px' }}>או</span>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,.1)' }} />
            </div>

            <button onClick={signInWithGoogle}
              style={{ width:'100%', padding:'13px 20px', background:'white', border:'none', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', cursor:'pointer', fontSize:'14px', fontWeight:700, color:'#333', fontFamily:'Heebo, sans-serif', boxShadow:'0 4px 16px rgba(0,0,0,.15)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              כניסה עם Google
            </button>

            <p style={{ color:'rgba(255,255,255,.2)', fontSize:'11px', textAlign:'center', marginTop:'16px' }}>בלחיצה אתם מסכימים לתנאי השימוש</p>
          </>
        )}
      </div>

      <div style={{ display:'flex', gap:'24px', marginTop:'28px', position:'relative', zIndex:1 }}>
        {[['📅','היסטוריה'],['🧺','מי מביא מה'],['💡','תובנות']].map(([icon, label]) => (
          <div key={String(label)} style={{ textAlign:'center' }}>
            <div style={{ fontSize:'20px', marginBottom:'4px' }}>{icon}</div>
            <span style={{ color:'rgba(255,255,255,.3)', fontSize:'11px', fontWeight:600 }}>{String(label)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RootPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ fontSize:'2rem' }}>⏳</div></div>}>
      <LoginContent />
    </Suspense>
  )
}
