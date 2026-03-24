'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import { Avatar, Badge, AttBadge, Toast, ConfirmModal } from '@/components/ui'
import { upsertMember, deleteMember, getMembers } from '@/lib/db'
import { supabase } from '@/lib/supabase'
import type { FamilyMember, FamilySide, EventType } from '@/types'
import { EVENT_EMOJIS } from '@/types'

const SIDES: FamilySide[] = ['אמא', 'אבא', 'בן/בת זוג', 'אחר']

export default function MemberProfilePage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const isNew = id === 'new'

  const [member, setMember] = useState<Partial<FamilyMember>>({
    first_name: '', last_name: '', nickname: '', phone: '',
    side_of_family: null, notes: '', is_active: true,
  })
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [editing, setEditing] = useState(isNew)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('user_profiles').select('family_id').eq('id', user.id).single()
      setFamilyId(profile?.family_id)
      if (!isNew && profile?.family_id) {
        const { data: m } = await supabase.from('family_members').select('*').eq('id', id).single()
        if (m) setMember(m)
        // Load their events
        const { data: evs } = await supabase
          .from('event_participants')
          .select('*, event:event_id(*)')
          .eq('member_id', id)
          .order('created_at', { ascending: false })
          .limit(10)
        setEvents(evs?.map(e => ({ ...e.event, myStatus: e.attendance_status })) ?? [])
      }
    })
  }, [id, isNew, router])

  async function save() {
    if (!member.first_name?.trim()) return setToast('חובה להכניס שם')
    setSaving(true)
    try {
      const saved = await upsertMember({ ...member, family_id: familyId! })
      setMember(saved)
      setEditing(false)
      setToast('✅ נשמר בהצלחה!')
      if (isNew) router.replace(`/members/${saved.id}`)
    } catch { setToast('שגיאה בשמירה') }
    setSaving(false)
  }

  async function handleDelete() {
    await deleteMember(id)
    router.push('/members')
  }

  return (
    <div className="main-content page-enter">
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
      {confirmDelete && (
        <ConfirmModal title="מחיקת בן משפחה"
          body={`האם למחוק את ${member.first_name}? הם לא יופיעו יותר ברשימה.`}
          onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
      )}

      {/* PROFILE HEADER */}
      {!editing ? (
        <div className="bg-gradient-to-br from-navy-DEFAULT to-navy-soft
                        px-5 pt-14 pb-6 rounded-b-[30px] text-center relative">
          <button onClick={() => router.back()}
            className="absolute top-12 right-4 w-9 h-9 bg-white/15 rounded-xl
                       flex items-center justify-center text-white text-lg active:scale-90">
            →
          </button>
          <button onClick={() => setEditing(true)}
            className="absolute top-12 left-4 bg-white/15 text-white text-xs font-bold
                       px-3 py-1.5 rounded-xl active:scale-90">
            ✏️ עריכה
          </button>
          <Avatar member={member as FamilyMember} size="xl" className="mx-auto mb-3" />
          <h1 className="text-2xl font-black text-white">
            {member.first_name} {member.last_name ?? ''}
          </h1>
          {member.nickname && <p className="text-white/60 text-sm mt-1">({member.nickname})</p>}
          <p className="text-white/50 text-sm mt-1">
            {member.side_of_family ?? ''}{member.phone ? ` · ${member.phone}` : ''}
          </p>
          {/* Stats row */}
          <div className="flex bg-white/10 rounded-2xl mt-4 overflow-hidden backdrop-blur-sm">
            {[
              ['אירועים', events.length],
              ['הגיע', events.filter((e: any) => e.myStatus === 'attended').length],
              ['אירח', events.filter((e: any) => e.host_member_id === id).length],
            ].map(([l, v]) => (
              <div key={l as string} className="flex-1 py-3 text-center border-l border-white/10 last:border-l-0">
                <div className="text-xl font-black text-white">{v}</div>
                <div className="text-[9px] text-white/50 mt-0.5">{l}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="sticky top-0 z-20 bg-cream px-4 pt-12 pb-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button onClick={() => isNew ? router.back() : setEditing(false)}
              className="text-navy-DEFAULT font-bold text-sm">
              {isNew ? '← חזרה' : '✕ ביטול'}
            </button>
            <h1 className="text-lg font-extrabold">{isNew ? 'בן משפחה חדש' : 'עריכת פרטים'}</h1>
            <button onClick={save} disabled={saving}
              className="text-orange-DEFAULT font-bold text-sm disabled:opacity-50">
              {saving ? 'שומר...' : 'שמור ✓'}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 pt-4">
        {editing ? (
          /* ── EDIT FORM ── */
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="fi-label">שם פרטי *</label>
                <input className="fi" placeholder="שם פרטי"
                       value={member.first_name ?? ''}
                       onChange={e => setMember(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div>
                <label className="fi-label">שם משפחה</label>
                <input className="fi" placeholder="שם משפחה"
                       value={member.last_name ?? ''}
                       onChange={e => setMember(p => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="fi-label">כינוי (אופציונלי)</label>
              <input className="fi" placeholder="לדוגמה: סבתא לאה"
                     value={member.nickname ?? ''}
                     onChange={e => setMember(p => ({ ...p, nickname: e.target.value }))} />
            </div>
            <div>
              <label className="fi-label">טלפון</label>
              <input className="fi" placeholder="054-..." type="tel"
                     value={member.phone ?? ''}
                     onChange={e => setMember(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="fi-label">צד משפחתי</label>
              <div className="grid grid-cols-2 gap-2">
                {SIDES.map(s => (
                  <button key={s} onClick={() => setMember(p => ({ ...p, side_of_family: s }))}
                    className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all
                                ${member.side_of_family === s
                                  ? 'border-orange-DEFAULT bg-orange-light text-orange-DEFAULT'
                                  : 'border-gray-200 bg-white text-gray-600'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="fi-label">הערות</label>
              <textarea className="fi min-h-[80px] resize-none" placeholder="הערות חופשיות..."
                        value={member.notes ?? ''}
                        onChange={e => setMember(p => ({ ...p, notes: e.target.value }))} />
            </div>
            {!isNew && (
              <button onClick={() => setConfirmDelete(true)}
                className="w-full py-3 rounded-xl border-2 border-red-DEFAULT/30 text-red-DEFAULT
                           font-bold text-sm active:scale-95 transition-all bg-red-light/30">
                🗑️ מחק בן משפחה
              </button>
            )}
          </div>
        ) : (
          /* ── PROFILE VIEW ── */
          <>
            <div className="card mb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">פרטים</p>
              {[
                ['👨‍👩‍👧‍👦', 'קשר', member.side_of_family ?? '—'],
                ['📱', 'טלפון', member.phone ?? '—'],
                ['📝', 'הערות', member.notes ?? '—'],
              ].map(([icon, label, val]) => (
                <div key={label as string} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-b-0">
                  <span className="text-base w-5">{icon}</span>
                  <span className="text-xs text-gray-400 w-16">{label}</span>
                  <span className="text-sm font-semibold flex-1">{val}</span>
                </div>
              ))}
            </div>

            <div className="sec-hdr"><span className="sec-title">היסטוריית חגים</span></div>
            {events.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">אין אירועים עדיין</p>
            ) : events.map((ev: any) => (
              <button key={ev.id} onClick={() => router.push(`/events/${ev.id}`)}
                className="card w-full text-right flex items-center gap-3 mb-2 active:scale-98 transition-all">
                <div className="w-11 h-11 rounded-xl bg-orange-light flex items-center justify-center text-xl flex-shrink-0">
                  {EVENT_EMOJIS[ev.event_type as EventType] ?? '⭐'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{ev.holiday_name ?? ev.event_type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ev.year ?? ''}</p>
                  <AttBadge status={ev.myStatus} />
                </div>
              </button>
            ))}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
