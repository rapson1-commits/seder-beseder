'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { Avatar, Badge, EmptyState, CardSkeleton } from '@/components/ui'
import { getEvents, getMembers, getInsights } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { Event, FamilyMember } from '@/types'
import { EVENT_EMOJIS } from '@/types'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

const UPCOMING_HOLIDAYS = [
  { name: 'פסח', date: new Date('2025-04-13'), emoji: '🌸' },
  { name: 'שבועות', date: new Date('2025-06-02'), emoji: '🌾' },
  { name: 'ראש השנה', date: new Date('2025-09-23'), emoji: '🍎' },
  { name: 'סוכות', date: new Date('2025-10-14'), emoji: '🕍' },
  { name: 'חנוכה', date: new Date('2025-12-15'), emoji: '🕯️' },
]

function getNextHoliday() {
  const now = new Date()
  return UPCOMING_HOLIDAYS.find(h => h.date > now) ?? UPCOMING_HOLIDAYS[0]
}

function getDaysUntil(date: Date) {
  const diff = date.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function HomePage() {
  const router = useRouter()
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [familyName, setFamilyName] = useState('המשפחה שלי')
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const nextHoliday = getNextHoliday()
  const daysLeft = getDaysUntil(nextHoliday.date)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase
        .from('user_profiles').select('*, family:family_id(family_name)').eq('id', user.id).single()
      if (!profile?.family_id) { router.push('/setup'); return }
      setFamilyId(profile.family_id)
      setFamilyName((profile as any).family?.family_name ?? 'המשפחה שלי')
      const [m, e, ins] = await Promise.all([
        getMembers(profile.family_id),
        getEvents(profile.family_id),
        getInsights(profile.family_id),
      ])
      setMembers(m); setEvents(e); setInsights(ins)
      setLoading(false)
    })
  }, [router])

  const recentEvents = events.slice(0, 3)
  const nextEvent = events.find(e => !e.actual_happened)
  const bringItems = nextEvent?.participants?.filter(p => p.what_they_bring) ?? []

  return (
    <div className="main-content page-enter">
      {/* ── HEADER ── */}
      <div className="bg-gradient-to-br from-navy-DEFAULT to-navy-soft
                      px-5 pt-14 pb-6 rounded-b-[30px] relative overflow-hidden">
        <div className="absolute top-[-60px] right-[-60px] w-48 h-48 rounded-full bg-orange-DEFAULT/12 pointer-events-none" />
        <div className="absolute bottom-[-40px] left-[-30px] w-36 h-36 rounded-full bg-green-DEFAULT/8 pointer-events-none" />
        <p className="text-white/50 text-sm relative z-10">שלום,</p>
        <h1 className="text-2xl font-black text-white mt-0.5 relative z-10">{familyName} 👋</h1>
        <div className="inline-flex items-center gap-2 bg-white/12 backdrop-blur-sm
                        rounded-full px-3 py-1.5 mt-3 text-xs text-white/75 font-medium relative z-10">
          <span>👨‍👩‍👧‍👦</span>
          <span>{members.length} בני משפחה · {events.length} אירועים</span>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-1">
        {/* ── NEXT HOLIDAY HERO ── */}
        <div className="bg-gradient-to-br from-orange-DEFAULT to-orange-dark
                        rounded-3xl p-5 relative overflow-hidden shadow-lg mb-3">
          <div className="absolute top-[-50px] right-[-40px] w-40 h-40 rounded-full bg-white/8 pointer-events-none" />
          <p className="text-white/60 text-xs font-bold uppercase tracking-wide">⏰ החג הבא</p>
          <h2 className="text-2xl font-black text-white mt-1">
            {nextHoliday.emoji} {nextHoliday.name}
          </h2>
          <div className="flex gap-2.5 mt-3">
            {[['ימים', daysLeft], ['שעות', new Date().getHours()], ['דקות', new Date().getMinutes()]].map(([lbl, val]) => (
              <div key={lbl as string} className="bg-white/18 backdrop-blur-sm rounded-xl px-3.5 py-2 text-center">
                <div className="text-2xl font-black text-white leading-none">{val}</div>
                <div className="text-[10px] text-white/60 mt-0.5">{lbl}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => router.push('/plan')}
              className="bg-white text-orange-DEFAULT font-bold text-sm px-4 py-2.5 rounded-xl
                         flex items-center gap-1.5 active:scale-95 transition-all">
              📋 תכנן
            </button>
            <button onClick={() => router.push(nextEvent ? `/events/${nextEvent.id}/brings` : '/events/new')}
              className="bg-white/15 border border-white/25 text-white font-bold text-sm px-4 py-2.5 rounded-xl
                         flex items-center gap-1.5 active:scale-95 transition-all backdrop-blur-sm">
              🧺 מי מביא מה
            </button>
          </div>
        </div>

        {/* ── TOP INSIGHT ── */}
        {insights[0] && (
          <div className={`insight-strip mb-1
            ${insights[0].level === 'warn' ? 'bg-gold-light' :
              insights[0].level === 'alert' ? 'bg-red-light' :
              insights[0].level === 'ok'    ? 'bg-green-light' : 'bg-blue-light'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0
              ${insights[0].level === 'warn' ? 'bg-gold-DEFAULT/15' :
                insights[0].level === 'alert' ? 'bg-red-DEFAULT/15' :
                insights[0].level === 'ok'    ? 'bg-green-DEFAULT/15' : 'bg-blue-DEFAULT/15'}`}>💡</div>
            <div>
              <p className="text-sm font-bold">{insights[0].title}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insights[0].body}</p>
            </div>
          </div>
        )}

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 gap-2.5 my-3">
          {[
            { icon: '📅', n: events.length, label: 'אירועים שתועדו', bg: 'bg-orange-light' },
            { icon: '👥', n: members.length, label: 'בני משפחה',     bg: 'bg-green-light'  },
          ].map(s => (
            <div key={s.label} className="card-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg mb-2 ${s.bg}`}>
                {s.icon}
              </div>
              <div className="text-2xl font-black">{s.n}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── FAMILY ── */}
        <div className="sec-hdr">
          <span className="sec-title">בני המשפחה</span>
          <button className="sec-link" onClick={() => router.push('/members')}>הכל ←</button>
        </div>
        {loading ? (
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {[...Array(4)].map((_, i) => <div key={i} className="w-16 h-16 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0" />)}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2.5 mb-3">
            {members.slice(0, 4).map(m => (
              <button key={m.id} onClick={() => router.push(`/members/${m.id}`)}
                className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
                <Avatar member={m} size="lg" />
                <span className="text-xs font-semibold text-center truncate w-full">{m.first_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* ── WHO BRINGS WHAT ── */}
        {bringItems.length > 0 && (
          <>
            <div className="sec-hdr">
              <span className="sec-title">🧺 מי מביא מה</span>
              <button className="sec-link" onClick={() => router.push(`/events/${nextEvent!.id}/brings`)}>ניהול ←</button>
            </div>
            <div className="bg-blue-light rounded-2xl p-4 mb-3 cursor-pointer active:scale-98 transition-all"
                 onClick={() => router.push(`/events/${nextEvent!.id}/brings`)}>
              <div className="flex justify-between mb-2.5">
                <span className="text-sm font-bold text-blue-DEFAULT">
                  {bringItems.filter(p => p.bring_confirmed).length} מתוך {bringItems.length} אישרו ✓
                </span>
                <span className="text-xs text-gray-500">
                  {bringItems.filter(p => !p.bring_confirmed).length} ממתינים
                </span>
              </div>
              <div className="h-1.5 bg-blue-DEFAULT/20 rounded-full mb-3">
                <div className="h-full bg-blue-DEFAULT rounded-full transition-all"
                     style={{ width: `${bringItems.length ? (bringItems.filter(p => p.bring_confirmed).length / bringItems.length) * 100 : 0}%` }} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {bringItems.slice(0, 4).map(p => (
                  <Badge key={p.id} variant={p.bring_confirmed ? 'green' : 'gold'}>
                    {p.bring_confirmed ? '✓' : '⏳'} {p.member?.first_name} — {p.what_they_bring}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── RECENT EVENTS ── */}
        <div className="sec-hdr">
          <span className="sec-title">אירועים אחרונים</span>
          <button className="sec-link" onClick={() => router.push('/history')}>הכל ←</button>
        </div>
        {loading ? (
          [...Array(3)].map((_, i) => <CardSkeleton key={i} />)
        ) : recentEvents.length === 0 ? (
          <EmptyState emoji="📅" title="אין אירועים עדיין"
            sub="הוסיפו את האירוע הראשון של המשפחה"
            action={<button className="btn-primary" onClick={() => router.push('/events/new')}>+ הוסף אירוע</button>} />
        ) : recentEvents.map(ev => (
          <button key={ev.id} onClick={() => router.push(`/events/${ev.id}`)}
            className="card w-full text-right flex items-center gap-3 mb-2.5 active:scale-98 transition-all">
            <div className="w-12 h-12 rounded-xl bg-orange-light flex items-center justify-center text-2xl flex-shrink-0">
              {EVENT_EMOJIS[ev.event_type] ?? '⭐'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{ev.holiday_name ?? ev.event_type}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {ev.host ? `🏠 אצל ${ev.host.first_name} · ` : ''}{ev.year ?? ''}
              </p>
              <Badge variant={ev.actual_happened ? 'green' : 'navy'}>
                {ev.actual_happened
                  ? `✓ ${ev.participants?.filter(p => p.attendance_status === 'attended').length ?? 0} הגיעו`
                  : 'מתוכנן'}
              </Badge>
            </div>
            <span className="text-gray-300 text-lg">‹</span>
          </button>
        ))}
      </div>

      {/* FAB */}
      <button onClick={() => router.push('/events/new')}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30
                   w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-DEFAULT to-orange-dark
                   text-white text-3xl font-light shadow-lg
                   flex items-center justify-center active:scale-90 transition-all">
        +
      </button>

      <BottomNav />
    </div>
  )
}
