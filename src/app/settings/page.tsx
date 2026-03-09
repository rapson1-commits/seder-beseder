'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { Toast } from '@/components/ui'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [toast, setToast] = useState('')
  const [reminders, setReminders] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*, family:family_id(family_name, invite_code)')
        .eq('id', user.id).single()
      if (profile) {
        setUserName(profile.full_name ?? user.email ?? '')
        setFamilyName((profile as any).family?.family_name ?? '')
        setInviteCode((profile as any).family?.invite_code ?? '')
      }
    })
  }, [router])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function copyInvite() {
    navigator.clipboard?.writeText(inviteCode)
    setToast(`📋 קוד הועתק: ${inviteCode}`)
  }

  return (
    <div className="main-content page-enter">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      <div className="sticky top-0 z-20 bg-cream px-4 pt-12 pb-3">
        <h1 className="text-xl font-extrabold">הגדרות</h1>
      </div>

      <div className="px-4 pt-2">
        {/* Profile card */}
        <div className="card flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-DEFAULT to-orange-dark
                          text-white text-xl font-black flex items-center justify-center flex-shrink-0">
            {userName[0] ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-base truncate">{userName || 'משתמש'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{familyName || 'אין משפחה'}</p>
            <button className="text-xs text-orange-DEFAULT font-bold mt-1"
                    onClick={() => setToast('✏️ עריכת פרופיל בקרוב')}>
              עריכת פרופיל
            </button>
          </div>
        </div>

        {/* Family */}
        <div className="bg-white rounded-2xl shadow-card mb-3 overflow-hidden">
          <SettingRow icon="👨‍👩‍👧‍👦" bg="bg-orange-light" label="ניהול משפחה"
            value={familyName} onClick={() => setToast('👨‍👩‍👧‍👦 ניהול משפחה בקרוב')} />
          <SettingRow icon="📨" bg="bg-green-light" label="קוד הזמנה"
            value={inviteCode} onClick={copyInvite} badge="העתק" />
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-card mb-3 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50">
            <div className="w-9 h-9 rounded-xl bg-gold-light flex items-center justify-center text-lg">🔔</div>
            <div className="flex-1">
              <p className="text-sm font-semibold">תזכורות</p>
              <p className="text-xs text-gray-400">לפני כל חג</p>
            </div>
            <div className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${reminders ? 'bg-green-DEFAULT' : 'bg-gray-200'}`}
                 onClick={() => setReminders(p => !p)}>
              <div className={`w-5 h-5 bg-white rounded-full m-0.5 shadow transition-transform ${reminders ? 'translate-x-6' : ''}`} />
            </div>
          </div>
          <SettingRow icon="🌍" bg="bg-gray-100" label="שפה" value="עברית"
            onClick={() => setToast('🌍 עברית')} />
        </div>

        {/* Data */}
        <div className="bg-white rounded-2xl shadow-card mb-3 overflow-hidden">
          <SettingRow icon="💾" bg="bg-green-light" label="גיבוי נתונים"
            onClick={() => setToast('💾 גיבוי בוצע!')} />
          <SettingRow icon="📤" bg="bg-orange-light" label="יצוא נתונים"
            onClick={() => setToast('📤 מייצא...')} />
        </div>

        {/* Sign out */}
        <button onClick={signOut}
          className="w-full py-3.5 rounded-2xl border-2 border-red-DEFAULT/30 text-red-DEFAULT
                     font-bold text-sm active:scale-95 transition-all bg-red-light/30 mb-6">
          🚪 התנתקות
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">סדר בסדר v1.0 · עם ❤️ למשפחות ישראל</p>
      </div>
      <BottomNav />
    </div>
  )
}

function SettingRow({ icon, bg, label, value, onClick, badge }: {
  icon: string; bg: string; label: string; value?: string;
  onClick?: () => void; badge?: string
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-b-0
                 active:bg-gray-50 transition-colors text-right">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${bg}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {value && <p className="text-xs text-gray-400 mt-0.5 truncate">{value}</p>}
      </div>
      {badge && <span className="text-xs font-bold text-orange-DEFAULT bg-orange-light px-2 py-1 rounded-lg">{badge}</span>}
      <span className="text-gray-300 text-base">‹</span>
    </button>
  )
}
