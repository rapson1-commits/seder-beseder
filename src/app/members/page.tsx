'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { Avatar, Badge, EmptyState, CardSkeleton } from '@/components/ui'
import { getMembers } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { FamilyMember, FamilySide } from '@/types'

const SIDES: (FamilySide | 'הכל')[] = ['הכל', 'אמא', 'אבא', 'בן/בת זוג', 'אחר']

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('הכל')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('user_profiles').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) return
      const m = await getMembers(profile.family_id)
      setMembers(m); setLoading(false)
    })
  }, [router])

  const filtered = members.filter(m => {
    const matchSide = filter === 'הכל' || m.side_of_family === filter
    const matchSearch = !search || `${m.first_name} ${m.last_name ?? ''}`.includes(search)
    return matchSide && matchSearch
  })

  return (
    <div className="main-content page-enter">
      {/* TOP BAR */}
      <div className="sticky top-0 z-20 bg-cream px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold">בני המשפחה</h1>
          <button onClick={() => router.push('/members/new')}
            className="w-9 h-9 rounded-xl bg-orange-light text-orange-DEFAULT
                       flex items-center justify-center text-xl active:scale-90 transition-all">
            +
          </button>
        </div>
        {/* Search */}
        <input className="fi text-sm mb-3" placeholder="🔍  חיפוש בן משפחה..."
               value={search} onChange={e => setSearch(e.target.value)} />
        {/* Side filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {SIDES.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`chip whitespace-nowrap ${filter === s ? 'on' : ''}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-2">
        {loading ? (
          [...Array(5)].map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState emoji="👥" title="אין בני משפחה"
            sub="הוסיפו את הבן משפחה הראשון"
            action={<button className="btn-primary" onClick={() => router.push('/members/new')}>+ הוסף</button>} />
        ) : filtered.map(m => (
          <button key={m.id} onClick={() => router.push(`/members/${m.id}`)}
            className="card w-full text-right flex items-center gap-3 mb-2.5 active:scale-98 transition-all">
            <Avatar member={m} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base">{m.first_name} {m.last_name ?? ''}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {m.side_of_family ? `${m.side_of_family} · ` : ''}{m.phone ?? ''}
              </p>
              {m.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{m.notes}</p>}
            </div>
            <span className="text-gray-300 text-lg">‹</span>
          </button>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
