'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getFamilyByInviteCode, createFamily } from '@/lib/db'
import { inviteCode as validateInviteCode, familyName as validateFamilyName } from '@/lib/validation'

export default function SetupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'choose'|'join'|'create'>('choose')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    const codeErr = validateInviteCode(code)
    if (codeErr) return setError(codeErr)
    setLoading(true); setError('')
    const family = await getFamilyByInviteCode(code)
    if (!family) { setError('קוד לא נמצא. בדוק שוב.'); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_profiles').update({ family_id: family.id }).eq('id', user.id)
    router.push('/home')
  }

  async function handleCreate() {
    const nameErr = validateFamilyName(name)
    if (nameErr) return setError(nameErr)
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const family = await createFamily(name.trim(), user.id)
    if (!family) { setError('שגיאה ביצירה. נסה שוב.'); setLoading(false); return }
    await supabase.from('user_profiles').update({ family_id: family.id, is_admin: true }).eq('id', user.id)
    router.push('/home')
  }

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,.1)',
    border: '1.5px solid rgba(255,255,255,.2)',
    borderRadius: '14px',
    fontSize: '15px',
    fontFamily: 'Heebo, sans-serif',
    direction: 'rtl' as const,
    color: 'white',
    outline: 'none',
    textAlign: 'center' as const,
  }

  const btnPrimary = {
    width: '100%',
    padding: '14px',
    background: '#F07A55',
    border: 'none',
    borderRadius: '14px',
    color: 'white',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'Heebo, sans-serif',
    boxShadow: '0 6px 20px rgba(240,122,85,.35)',
  }

  const btnGhost = {
    width: '100%',
    padding: '12px',
    background: 'rgba(255,255,255,.08)',
    border: '1.5px solid rgba(255,255,255,.15)',
    borderRadius: '14px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'Heebo, sans-serif',
  }

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
      {/* Logo / Icon */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '64px', marginBottom: '12px' }}>👨‍👩‍👧‍👦</div>
        <h1 style={{ color: 'white', fontSize: '28px', fontWeight: 900, margin: 0 }}>הצטרפות למשפחה</h1>
        <p style={{ color: 'rgba(255,255,255,.5)', fontSize: '14px', marginTop: '8px' }}>עוד צעד אחד</p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'rgba(255,255,255,.07)',
        border: '1px solid rgba(255,255,255,.1)',
        borderRadius: '24px',
        padding: '24px',
      }}>
        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '13px', textAlign: 'center', marginBottom: '4px' }}>
              איך תרצה להמשיך?
            </p>
            <button onClick={() => setMode('join')} style={btnPrimary}>
              📨 יש לי קוד הזמנה
            </button>
            <button onClick={() => setMode('create')} style={btnGhost}>
              ✨ צור משפחה חדשה
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '17px', margin: '0 0 4px' }}>הכנס קוד הזמנה</h2>
            <input
              style={{ ...inputStyle, fontSize: '20px', fontWeight: 700, letterSpacing: '4px' }}
              placeholder="LEVI2025"
              maxLength={8}
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
            />
            <button onClick={handleJoin} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'מצטרף...' : '🔍 הצטרף'}
            </button>
            <button onClick={() => setMode('choose')} style={btnGhost}>← חזרה</button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '17px', margin: '0 0 4px' }}>שם המשפחה</h2>
            <input
              style={inputStyle}
              placeholder="לדוגמה: משפחת לוי"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button onClick={handleCreate} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'יוצר...' : '👨‍👩‍👧‍👦 צור משפחה'}
            </button>
            <button onClick={() => setMode('choose')} style={btnGhost}>← חזרה</button>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: '12px',
            background: 'rgba(224,101,95,.2)',
            border: '1px solid rgba(224,101,95,.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#ffb3b0',
            fontSize: '13px',
            textAlign: 'center',
            fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  )
}
