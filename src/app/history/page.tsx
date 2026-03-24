'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { Badge, EmptyState, CardSkeleton } from '@/components/ui'
import { getEvents } from '@/lib/db'
import { useFamily } from '@/hooks/useFamily'
import type { Event } from '@/types'
import { EVENT_EMOJIS } from '@/types'

const HOLIDAY_TYPES = ['הכל', 'פסח', 'ראש השנה', 'חנוכה', 'סוכות', 'פורים', 'שבועות']
const BORDER_COLORS = ['border-orange-DEFAULT','border-blue-DEFAULT','border-green-DEFAULT','border-gold-DEFAULT']

export default function HistoryPage() {
  const router = useRouter()
  const { familyId, loading: authLoading } = useFamily()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('הכל')

  useEffect(() => {
    if (authLoading || !familyId) return
    getEvents(familyId).then(evs => { setEvents(evs); setLoading(false) })
  }, [familyId, authLoading])

  const filtered = filter === 'הכל' ? events : events.filter(e => e.event_type === filter)

  // Group by year
  const byYear: Record<number, Event[]> = {}
  for (const ev of filtered) {
    const yr = ev.year ?? new Date(ev.created_at).getFullYear()
    if (!byYear[yr]) byYear[yr] = []
    byYear[yr].push(ev)
  }
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  return (
    <div className="main-content page-enter">
      <div className="sticky top-0 z-20 bg-cream px-4 pt-12 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-extrabold">היסטוריית חגים</h1>
          <button onClick={() => router.push('/events/new')}
            className="w-9 h-9 rounded-xl bg-orange-light text-orange-DEFAULT
                       flex items-center justify-center text-xl active:scale-90">+</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {HOLIDAY_TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`chip whitespace-nowrap ${filter === t ? 'on' : ''}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-2">
        {loading ? [...Array(4)].map((_, i) => <CardSkeleton key={i} />) :
         filtered.length === 0 ? (
          <EmptyState emoji="📅" title="אין אירועים" sub="תוסיפו את האירוע הראשון!"
            action={<button className="btn-primary" onClick={() => router.push('/events/new')}>+ הוסף</button>} />
        ) : years.map(yr => (
          <div key={yr}>
            <div className="yr-line">
              <div className="yr-badge">{yr}</div>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{byYear[yr].length} אירועים</span>
            </div>
            {byYear[yr].map((ev, i) => (
              <button key={ev.id} onClick={() => router.push(`/events/${ev.id}`)}
                className={`card w-full text-right mb-2.5 border-r-4 active:scale-98 transition-all
                            ${BORDER_COLORS[i % BORDER_COLORS.length]}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{EVENT_EMOJIS[ev.event_type] ?? '⭐'}</span>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{ev.holiday_name ?? ev.event_type}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ev.gregorian_date ? new Date(ev.gregorian_date).toLocaleDateString('he-IL', { month: 'long', day: 'numeric' }) : ''}
                    </p>
                  </div>
                  <Badge variant={ev.actual_happened ? 'green' : 'navy'}>
                    {ev.actual_happened ? '✓ התקיים' : 'מתוכנן'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ev.host && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg">🏠 אצל {ev.host.first_name}</span>}
                  {ev.participants && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg">👥 {ev.participants.length} משתתפים</span>}
                  {ev.location_name && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg">📍 {ev.location_name}</span>}
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
