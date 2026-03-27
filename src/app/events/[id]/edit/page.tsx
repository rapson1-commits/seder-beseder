'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { upsertEvent, getMembers, upsertParticipant, getEvent } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import { Avatar, Toast } from '@/components/ui'
import type { FamilyMember, EventType } from '@/types'
import { EVENT_EMOJIS } from '@/types'

const HOLIDAY_OPTIONS: EventType[] = [
  'ראש השנה','יום כיפור','סוכות','שמחת תורה',
  'חנוכה','פורים','פסח','שבועות',
  'שבת משפחתית','ארוחת שישי','יום הולדת','מפגש משפחתי','אחר'
]

export default function EventFormPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'
  const [step, setStep] = useState(1)
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)

  // Form state
  const [eventType, setEventType] = useState<EventType>('פסח')
  const [holidayName, setHolidayName] = useState('')
  const [date, setDate] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [hostId, setHostId] = useState('')
  const [hostManual, setHostManual] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [happened, setHappened] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [brings, setBrings] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('user_profiles').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) return
      setFamilyId(profile.family_id)
      const m = await getMembers(profile.family_id)
      setMembers(m)
      // Pre-select all for new event
      if (isNew) setSelected(new Set(m.map(mm => mm.id)))

      if (!isNew) {
        const ev = await getEvent(id)
        if (ev) {
          setEventType(ev.event_type as EventType)
          setHolidayName(ev.holiday_name ?? '')
          setDate(ev.gregorian_date ?? '')
          setYear(ev.year ?? new Date().getFullYear())
          setHostId(ev.host_member_id ?? '')
          setHostManual(ev.host_name_manual ?? '')
          setLocation(ev.location_name ?? '')
          setNotes(ev.notes ?? '')
          setHappened(ev.actual_happened)
          if (ev.participants) {
            setSelected(new Set(ev.participants.map(p => p.member_id)))
            const b: Record<string, string> = {}
            ev.participants.forEach(p => { if (p.what_they_bring) b[p.member_id] = p.what_they_bring })
            setBrings(b)
          }
        }
      }
    })
  }, [id, isNew, router])

  async function save() {
    if (!familyId) return
    setSaving(true)
    try {
      const ev = await upsertEvent({
        id: isNew ? undefined : id,
        family_id: familyId,
        event_type: eventType,
        holiday_name: holidayName || eventType,
        gregorian_date: date || null,
        year,
        host_member_id: hostId || null,
        host_name_manual: hostManual || null,
        location_name: location || null,
        notes: notes || null,
        actual_happened: happened,
      })
      // Save participants
      for (const mid of Array.from(selected)) {
        await upsertParticipant({
          event_id: ev.id, member_id: mid,
          attendance_status: happened ? 'attended' : 'invited',
          what_they_bring: brings[mid] || null,
          bring_confirmed: !!brings[mid],
        })
      }
      setToast('🎉 נשמר בהצלחה!')
      setTimeout(() => router.push(`/events/${ev.id}`), 800)
    } catch { setToast('שגיאה בשמירה') }
    setSaving(false)
  }

  const progress = (step / 3) * 100

  return (
    <div className="main-content page-enter">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}

      {/* TOP BAR */}
      <div className="sticky top-0 z-20 bg-cream px-4 pt-12 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
            className="text-navy-DEFAULT font-bold text-sm">← חזרה</button>
          <h1 className="text-lg font-extrabold">{isNew ? 'אירוע חדש' : 'עריכת אירוע'}</h1>
          {step === 3
            ? <button onClick={save} disabled={saving}
                className="text-orange-DEFAULT font-bold disabled:opacity-50">
                {saving ? '...' : 'שמור ✓'}
              </button>
            : <button onClick={() => setStep(s => s + 1)}
                className="text-orange-DEFAULT font-bold">הבא ←</button>}
        </div>
        {/* Progress */}
        <div className="h-1 bg-gray-200 rounded-full">
          <div className="h-full bg-orange-DEFAULT rounded-full transition-all duration-400"
               style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          {['סוג החג','פרטים','משתתפים'].map((l, i) => (
            <span key={l} className={`text-[10px] font-bold ${step === i + 1 ? 'text-orange-DEFAULT' : 'text-gray-400'}`}>{l}</span>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* STEP 1 — holiday type */}
        {step === 1 && (
          <>
            <h2 className="text-lg font-extrabold mb-1">איזה חג?</h2>
            <p className="text-sm text-gray-500 mb-4">בחרו את סוג האירוע</p>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {HOLIDAY_OPTIONS.map(h => (
                <button key={h} onClick={() => setEventType(h)}
                  className={`py-3 px-2 rounded-xl border-2 text-center transition-all active:scale-95
                              ${eventType === h ? 'border-orange-DEFAULT bg-orange-light' : 'border-gray-200 bg-white'}`}>
                  <div className="text-2xl mb-1">{EVENT_EMOJIS[h]}</div>
                  <div className="text-xs font-semibold leading-tight">{h}</div>
                </button>
              ))}
            </div>
            <div>
              <label className="fi-label">שם מותאם אישית (אופציונלי)</label>
              <input className="fi" placeholder={`לדוגמה: ${eventType} תשפ"ה`}
                     value={holidayName} onChange={e => setHolidayName(e.target.value)} />
            </div>
          </>
        )}

        {/* STEP 2 — details */}
        {step === 2 && (
          <>
            <h2 className="text-lg font-extrabold mb-1">פרטי האירוע</h2>
            <p className="text-sm text-gray-500 mb-4">מתי ואצל מי?</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fi-label">שנה</label>
                  <input className="fi" type="number" value={year}
                         onChange={e => setYear(Number(e.target.value))} />
                </div>
                <div>
                  <label className="fi-label">תאריך</label>
                  <input className="fi" type="date" value={date}
                         onChange={e => setDate(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="fi-label">מארח (בן משפחה)</label>
                <select className="fi" value={hostId} onChange={e => setHostId(e.target.value)}>
                  <option value="">בחר מארח...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name ?? ''}</option>)}
                </select>
              </div>
              <div>
                <label className="fi-label">מיקום</label>
                <input className="fi" placeholder="עיר, כתובת..."
                       value={location} onChange={e => setLocation(e.target.value)} />
              </div>
              <div>
                <label className="fi-label">הערות</label>
                <textarea className="fi min-h-[70px] resize-none" placeholder="משהו מיוחד שרוצים לזכור..."
                          value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <div className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl px-4 py-3.5">
                <div>
                  <p className="text-sm font-bold">האירוע כבר התקיים</p>
                  <p className="text-xs text-gray-400">מסמנים אם תועד בדיעבד</p>
                </div>
                <div className={`w-12 h-6 rounded-full cursor-pointer transition-colors ${happened ? 'bg-green-DEFAULT' : 'bg-gray-200'}`}
                     onClick={() => setHappened(p => !p)}>
                  <div className={`w-5 h-5 bg-white rounded-full m-0.5 shadow transition-transform ${happened ? 'translate-x-6' : ''}`} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* STEP 3 — participants */}
        {step === 3 && (
          <>
            <h2 className="text-lg font-extrabold mb-1">מי השתתף?</h2>
            <p className="text-sm text-gray-500 mb-4">סמנו מי היה + מה הביא</p>
            <div className="mb-3 flex gap-2">
              <button onClick={() => setSelected(new Set(members.map(m => m.id)))}
                className="text-xs font-bold text-orange-DEFAULT">בחר הכל</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => setSelected(new Set())}
                className="text-xs font-bold text-gray-500">נקה הכל</button>
            </div>
            {members.map(m => (
              <div key={m.id}
                className={`card mb-2 border-2 transition-all ${selected.has(m.id) ? 'border-green-DEFAULT bg-green-light/30' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-2" onClick={() => setSelected(prev => {
                  const s = new Set(prev)
                  s.has(m.id) ? s.delete(m.id) : s.add(m.id)
                  return s
                })}>
                  <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all flex-shrink-0
                                  ${selected.has(m.id) ? 'bg-green-DEFAULT border-green-DEFAULT text-white' : 'border-gray-300'}`}>
                    {selected.has(m.id) ? '✓' : ''}
                  </div>
                  <Avatar member={m} size="sm" />
                  <span className="font-semibold text-sm flex-1">{m.first_name} {m.last_name ?? ''}</span>
                </div>
                {selected.has(m.id) && (
                  <input className="fi text-xs py-2"
                         placeholder={`מה ${m.first_name} הביא/ה?`}
                         value={brings[m.id] ?? ''}
                         onChange={e => setBrings(p => ({ ...p, [m.id]: e.target.value }))} />
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
