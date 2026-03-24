'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { Avatar, Badge, AttBadge, Toast, ConfirmModal } from '@/components/ui'
import { getEvent, updateBringItem, upsertParticipant, deleteEvent } from '@/lib/db'
import type { Event, EventParticipant, AttendanceStatus } from '@/types'
import { EVENT_EMOJIS, ATTENDANCE_LABEL } from '@/types'

const ATT_OPTIONS: AttendanceStatus[] = ['attended','absent','confirmed','declined','invited']

export default function EventDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<Event | null>(null)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'details'|'brings'>('details')
  const [editBring, setEditBring] = useState<string | null>(null)
  const [bringText, setBringText] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)

  async function load() {
    const ev = await getEvent(id)
    setEvent(ev)
  }
  useEffect(() => { load() }, [id])

  async function saveBring(p: EventParticipant) {
    await updateBringItem(p.event_id, p.member_id, bringText, true)
    setEditBring(null); setBringText('')
    setToast('✅ נשמר!'); load()
  }

  async function updateAttendance(p: EventParticipant, status: AttendanceStatus) {
    await upsertParticipant({ id: p.id, event_id: p.event_id, member_id: p.member_id, attendance_status: status })
    setToast('✅ עודכן!'); load()
  }

  async function handleDelete() {
    await deleteEvent(id)
    router.push('/history')
  }

  if (!event) return <div className="flex items-center justify-center min-h-screen"><div className="text-4xl animate-spin">⏳</div></div>

  const attended = event.participants?.filter(p => p.attendance_status === 'attended') ?? []
  const confirmed = event.participants?.filter(p => p.bring_confirmed) ?? []

  return (
    <div className="main-content page-enter">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {confirmDel && <ConfirmModal title="מחיקת אירוע" body="האם למחוק את האירוע? לא ניתן לשחזר."
        onConfirm={handleDelete} onCancel={() => setConfirmDel(false)} />}

      {/* HERO */}
      <div className="bg-gradient-to-br from-orange-DEFAULT to-orange-dark px-5 pt-14 pb-6 rounded-b-[30px] relative">
        <button onClick={() => router.back()}
          className="absolute top-12 right-4 w-9 h-9 bg-white/15 rounded-xl
                     flex items-center justify-center text-white text-lg active:scale-90">→</button>
        <button onClick={() => router.push(`/events/${id}/edit`)}
          className="absolute top-12 left-4 bg-white/15 text-white text-xs font-bold
                     px-3 py-1.5 rounded-xl active:scale-90">✏️ עריכה</button>
        <div className="text-4xl mb-2">{EVENT_EMOJIS[event.event_type] ?? '⭐'}</div>
        <h1 className="text-2xl font-black text-white">{event.holiday_name ?? event.event_type}</h1>
        <p className="text-white/60 text-sm mt-1">
          {event.gregorian_date ? new Date(event.gregorian_date).toLocaleDateString('he-IL', { year:'numeric', month:'long', day:'numeric' }) : event.year ?? ''}
          {event.host ? ` · אצל ${event.host.first_name}` : ''}
        </p>
        <div className="mt-3">
          <Badge variant={event.actual_happened ? 'green' : 'navy'}>
            {event.actual_happened ? `✓ ${attended.length} הגיעו` : 'מתוכנן'}
          </Badge>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mx-4 mt-4 bg-gray-100 rounded-xl p-1 mb-4">
        {(['details','brings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all
                        ${tab === t ? 'bg-white text-navy-DEFAULT shadow-sm' : 'text-gray-400'}`}>
            {t === 'details' ? '📋 פרטים' : '🧺 מי מביא מה'}
          </button>
        ))}
      </div>

      <div className="px-4">
        {tab === 'details' ? (
          <>
            {/* Info card */}
            <div className="card mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">פרטי האירוע</p>
              {[
                ['📅', 'תאריך', event.gregorian_date ? new Date(event.gregorian_date).toLocaleDateString('he-IL') : event.year?.toString() ?? '—'],
                ['🏠', 'מארח', event.host ? `${event.host.first_name} ${event.host.last_name ?? ''}` : event.host_name_manual ?? '—'],
                ['📍', 'מיקום', event.location_name ?? '—'],
                ['📝', 'הערות', event.notes ?? '—'],
              ].map(([ico, lbl, val]) => (
                <div key={lbl as string} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-b-0">
                  <span className="text-base w-5 mt-0.5">{ico}</span>
                  <span className="text-xs text-gray-400 w-16 mt-0.5">{lbl}</span>
                  <span className="text-sm font-semibold flex-1 leading-relaxed">{val}</span>
                </div>
              ))}
            </div>

            {/* Attendees */}
            <div className="card mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                משתתפים ({event.participants?.length ?? 0})
              </p>
              {event.participants?.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-b-0">
                  {p.member && <Avatar member={p.member} size="sm" />}
                  <span className="flex-1 text-sm font-semibold">{p.member?.first_name} {p.member?.last_name ?? ''}</span>
                  <select value={p.attendance_status}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                    onChange={e => updateAttendance(p, e.target.value as AttendanceStatus)}>
                    {ATT_OPTIONS.map(o => <option key={o} value={o}>{ATTENDANCE_LABEL[o]}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <button onClick={() => setConfirmDel(true)}
              className="w-full py-3 rounded-xl border-2 border-red-DEFAULT/30 text-red-DEFAULT
                         font-bold text-sm active:scale-95 transition-all bg-red-light/30 mb-4">
              🗑️ מחק אירוע
            </button>
          </>
        ) : (
          /* BRINGS TAB */
          <>
            <div className="bg-blue-light rounded-2xl p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-blue-DEFAULT">{confirmed.length} אישרו ✓</span>
                <span className="text-xs text-gray-500">{(event.participants?.length ?? 0) - confirmed.length} ממתינים</span>
              </div>
              <div className="h-1.5 bg-blue-DEFAULT/20 rounded-full">
                <div className="h-full bg-blue-DEFAULT rounded-full transition-all"
                     style={{ width: `${event.participants?.length ? (confirmed.length / event.participants.length) * 100 : 0}%` }} />
              </div>
            </div>

            {event.participants?.map(p => (
              <div key={p.id}
                className={`card mb-2.5 border-r-4 ${
                  p.bring_confirmed ? 'border-green-DEFAULT' :
                  p.attendance_status === 'declined' ? 'border-red-DEFAULT' : 'border-gold-DEFAULT'}`}>
                <div className="flex items-center gap-3">
                  {p.member && <Avatar member={p.member} size="md" />}
                  <div className="flex-1">
                    <p className="font-bold text-sm">{p.member?.first_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.what_they_bring ? `🧺 ${p.what_they_bring}` : 'לא הוגדר עדיין'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl">
                      {p.bring_confirmed ? '✅' : p.attendance_status === 'declined' ? '❌' : '⏳'}
                    </div>
                    <div className={`text-[9px] font-bold mt-0.5
                      ${p.bring_confirmed ? 'text-green-DEFAULT' :
                        p.attendance_status === 'declined' ? 'text-red-DEFAULT' : 'text-gold-DEFAULT'}`}>
                      {p.bring_confirmed ? 'אישר' : p.attendance_status === 'declined' ? 'לא מגיע' : 'ממתין'}
                    </div>
                  </div>
                </div>

                {editBring === p.id ? (
                  <div className="mt-3 flex gap-2">
                    <input className="fi text-sm flex-1" placeholder="מה מביא/ה?"
                           value={bringText} onChange={e => setBringText(e.target.value)} />
                    <button onClick={() => saveBring(p)}
                      className="bg-green-DEFAULT text-white text-sm font-bold px-3 py-2 rounded-xl active:scale-95">
                      ✓
                    </button>
                    <button onClick={() => setEditBring(null)}
                      className="bg-gray-100 text-gray-500 text-sm px-3 py-2 rounded-xl active:scale-95">
                      ✕
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setEditBring(p.id); setBringText(p.what_they_bring ?? '') }}
                    className="mt-2 text-xs text-orange-DEFAULT font-bold active:scale-95">
                    ✏️ עריכה
                  </button>
                )}
              </div>
            ))}

            <button onClick={() => { setToast('📤 שולח תזכורות...')} }
              className="btn-primary mb-4">📤 שלח תזכורת לממתינים</button>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
