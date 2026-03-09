'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getFamilyByInviteCode, createFamily } from '@/lib/db'

export default function SetupPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'choose'|'join'|'create'>('choose')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    if (!code) return setError('הכנס קוד הזמנה')
    setLoading(true); setError('')
    const family = await getFamilyByInviteCode(code)
    if (!family) { setError('קוד לא נמצא. בדוק שוב.'); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_profiles')
      .update({ family_id: family.id })
      .eq('id', user.id)
    router.push('/home')
  }

  async function handleCreate() {
    if (!name.trim()) return setError('הכנס שם משפחה')
    setLoading(true); setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const family = await createFamily(name.trim(), user.id)
    if (!family) { setError('שגיאה ביצירה. נסה שוב.'); setLoading(false); return }
    await supabase.from('user_profiles')
      .update({ family_id: family.id, is_admin: true })
      .eq('id', user.id)
    router.push('/home')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-DEFAULT to-navy-soft
                    flex flex-col items-center justify-center px-6 py-10">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
        <h1 className="text-3xl font-black text-white">הצטרפות למשפחה</h1>
        <p className="text-white/50 mt-2 text-sm">עוד צעד אחד</p>
      </div>

      <div className="w-full max-w-sm bg-white/7 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        {mode === 'choose' && (
          <div className="space-y-3">
            <button onClick={() => setMode('join')}
              className="btn-primary">
              📨 יש לי קוד הזמנה
            </button>
            <button onClick={() => setMode('create')}
              className="btn-ghost">
              ✨ צור משפחה חדשה
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="space-y-3">
            <h2 className="text-white font-bold text-lg mb-3">הכנס קוד הזמנה</h2>
            <input className="fi bg-white/10 border-white/20 text-white text-center
                               text-xl font-bold tracking-widest placeholder:text-white/30 uppercase"
                   placeholder="ABCD1234" maxLength={8}
                   value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            <button onClick={handleJoin} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'מצטרף...' : '🔍 הצטרף'}
            </button>
            <button onClick={() => setMode('choose')} className="btn-ghost text-sm">← חזרה</button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-3">
            <h2 className="text-white font-bold text-lg mb-3">שם המשפחה</h2>
            <input className="fi bg-white/10 border-white/20 text-white placeholder:text-white/40"
                   placeholder="לדוגמה: משפחת לוי"
                   value={name} onChange={e => setName(e.target.value)} />
            <button onClick={handleCreate} disabled={loading} className="btn-primary disabled:opacity-60">
              {loading ? 'יוצר...' : '👨‍👩‍👧‍👦 צור משפחה'}
            </button>
            <button onClick={() => setMode('choose')} className="btn-ghost text-sm">← חזרה</button>
          </div>
        )}

        {error && (
          <div className="mt-3 bg-red-DEFAULT/20 border border-red-DEFAULT/30 text-red-light
                          rounded-xl px-4 py-3 text-sm text-center">{error}</div>
        )}
      </div>
    </div>
  )
}
