'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { CardSkeleton } from '@/components/ui'
import { getInsights } from '@/lib/db'
import { supabase } from '@/lib/supabase'

const LEVEL_STYLE = {
  warn:  { border: 'border-gold-DEFAULT',  bg: 'bg-gold-light',  ico: '⚖️',  icoBg: 'bg-gold-DEFAULT/15'  },
  alert: { border: 'border-red-DEFAULT',   bg: 'bg-red-light',   ico: '⚠️',  icoBg: 'bg-red-DEFAULT/15'   },
  ok:    { border: 'border-green-DEFAULT', bg: 'bg-green-light', ico: '✨',  icoBg: 'bg-green-DEFAULT/15' },
  info:  { border: 'border-blue-DEFAULT',  bg: 'bg-blue-light',  ico: '📊',  icoBg: 'bg-blue-DEFAULT/15'  },
}

export default function InsightsPage() {
  const router = useRouter()
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('user_profiles').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) return
      const ins = await getInsights(profile.family_id)
      setInsights(ins); setLoading(false)
    })
  }, [router])

  return (
    <div className="main-content page-enter">
      <div className="sticky top-0 z-20 bg-cream px-4 pt-12 pb-3">
        <h1 className="text-xl font-extrabold">תובנות 💡</h1>
        <p className="text-xs text-gray-500 mt-1">ניתוח חכם של ההיסטוריה המשפחתית</p>
      </div>

      <div className="px-4 pt-2">
        {loading ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />) :
         insights.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-5xl mb-4">💡</div>
            <p className="text-lg font-extrabold text-navy-DEFAULT mb-2">עדיין אין מספיק נתונים</p>
            <p className="text-sm text-gray-500">הוסיפו עוד אירועים ותובנות יתחילו להופיע</p>
          </div>
        ) : insights.map((ins, i) => {
          const s = LEVEL_STYLE[ins.level as keyof typeof LEVEL_STYLE]
          return (
            <div key={i} className={`card mb-3 border-r-4 ${s.border}`}>
              <div className="flex items-start gap-3 mb-2.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${s.icoBg}`}>
                  {s.ico}
                </div>
                <div>
                  <p className="font-bold text-sm">{ins.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ins.type}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{ins.body}</p>
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
