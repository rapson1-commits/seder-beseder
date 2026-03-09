'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getFamilyByInviteCode } from '@/lib/db'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'join' | 'create'>('login')
  const [inviteCode, setInviteCode] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/home` },
    })
  }

  async function handlePhone() {
    if (!phone) return setError('הכנס מספר טלפון')
    setLoading(true); setError('')
    const formatted = phone.startsWith('0') ? '+972' + phone.slice(1) : phone
    const { error: e } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (e) { setError('שגיאה בשליחת קוד. נסה שוב'); setLoading(false); return }
    setOtpSent(true); setLoading(false)
  }

  async function handleOtp() {
    if (!otp) return
    setLoading(true); setError('')
    const formatted = phone.startsWith('0') ? '+972' + phone.slice(1) : phone
    const { error: e } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    if (e) { setError('קוד שגוי, נסה שוב'); setLoading(false); return }
    router.push('/home')
  }

  async function handleJoin() {
    if (!inviteCode) return setError('הכנס קוד הזמנה')
    setLoading(true); setError('')
    const family = await getFamilyByInviteCode(inviteCode)
    if (!family) { setError('קוד הזמנה לא נמצא'); setLoading(false); return }
    // Save invite code to complete after auth
    sessionStorage.setItem('pendingFamilyId', family.id)
    setLoading(false)
    setTab('login')
  }

  async function handleCreate() {
    if (!familyName.trim()) return setError('הכנס שם משפחה')
    sessionStorage.setItem('createFamilyName', familyName)
    setTab('login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-DEFAULT via-navy-soft to-navy-DEFAULT
                    flex flex-col items-center justify-center px-6 py-10 relative overflow-hidden">
      {/* bg circles */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 rounded-full bg-orange-DEFAULT/10 pointer-events-none" />
      <div className="absolute bottom-20 left-[-60px] w-48 h-48 rounded-full bg-green-DEFAULT/8 pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-8 relative z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-DEFAULT to-orange-dark
                        rounded-3xl flex items-center justify-center text-4xl mx-auto mb-4
                        shadow-[0_12px_32px_rgba(240,122,85,.4)]">🏠</div>
        <h1 className="text-4xl font-black text-white">סדר <span className="text-orange-DEFAULT">בסדר</span></h1>
        <p className="text-white/50 mt-2 text-sm">עושים סדר בחגים המשפחתיים</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/7 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative z-10">

        {/* Tabs */}
        {!otpSent && (
          <div className="flex gap-1 bg-white/10 rounded-xl p-1 mb-6">
            {(['login','join','create'] as const).map(t => (
              <button key={t}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                            ${tab === t ? 'bg-white text-navy-DEFAULT shadow-sm' : 'text-white/60'}`}
                onClick={() => { setTab(t); setError('') }}>
                {t === 'login' ? 'כניסה' : t === 'join' ? 'הצטרפות' : 'משפחה חדשה'}
              </button>
            ))}
          </div>
        )}

        {/* LOGIN TAB */}
        {tab === 'login' && !otpSent && (
          <div className="space-y-3">
            <button onClick={handleGoogle} disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-navy-DEFAULT bg-white
                         flex items-center justify-center gap-3 active:scale-95 transition-all
                         shadow-md disabled:opacity-60">
              <span className="text-lg font-black">G</span> כניסה עם Google
            </button>
            <div className="text-center text-white/30 text-xs my-2">או</div>
            {!otpSent ? (
              <>
                <input className="fi bg-white/10 border-white/20 text-white placeholder:text-white/40"
                       placeholder="מספר טלפון (054-...)"
                       value={phone} onChange={e => setPhone(e.target.value)} />
                <button onClick={handlePhone} disabled={loading}
                  className="btn-primary disabled:opacity-60">
                  {loading ? 'שולח...' : '📱 שלח קוד SMS'}
                </button>
              </>
            ) : null}
          </div>
        )}

        {/* OTP */}
        {otpSent && (
          <div className="space-y-3">
            <p className="text-white text-sm text-center mb-4">
              שלחנו קוד 6 ספרות ל-{phone}
            </p>
            <input className="fi bg-white/10 border-white/20 text-white text-center
                               text-2xl font-bold tracking-[.3em] placeholder:text-white/30"
                   placeholder="000000" maxLength={6}
                   value={otp} onChange={e => setOtp(e.target.value)} />
            <button onClick={handleOtp} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'מאמת...' : 'כניסה ✓'}
            </button>
            <button onClick={() => setOtpSent(false)} className="btn-ghost text-sm">
              ← חזרה
            </button>
          </div>
        )}

        {/* JOIN TAB */}
        {tab === 'join' && (
          <div className="space-y-3">
            <p className="text-white/70 text-sm mb-3">
              קיבלת קוד הזמנה ממשפחתך? הכנס אותו כאן:
            </p>
            <input className="fi bg-white/10 border-white/20 text-white text-center
                               text-xl font-bold tracking-widest placeholder:text-white/30 uppercase"
                   placeholder="LEVI2025" maxLength={8}
                   value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} />
            <button onClick={handleJoin} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'מחפש...' : '🔍 מצא משפחה'}
            </button>
          </div>
        )}

        {/* CREATE TAB */}
        {tab === 'create' && (
          <div className="space-y-3">
            <p className="text-white/70 text-sm mb-3">
              צור קבוצה משפחתית חדשה והזמן את כולם:
            </p>
            <input className="fi bg-white/10 border-white/20 text-white placeholder:text-white/40"
                   placeholder="שם המשפחה (לדוגמה: משפחת לוי)"
                   value={familyName} onChange={e => setFamilyName(e.target.value)} />
            <button onClick={handleCreate} disabled={loading} className="btn-primary disabled:opacity-60">
              👨‍👩‍👧‍👦 צור משפחה חדשה
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-DEFAULT/20 border border-red-DEFAULT/30 text-red-light
                          rounded-xl px-4 py-3 text-sm font-medium text-center">
            {error}
          </div>
        )}
      </div>

      <p className="text-white/25 text-xs mt-6 text-center relative z-10">
        בהתחברות אתה מסכים לתנאי השימוש
      </p>
    </div>
  )
}
