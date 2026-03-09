import { supabase } from './supabase'
import type { FamilyMember, Event, EventParticipant, Family } from '@/types'

// ── FAMILY ──────────────────────────────────────────────────────────────────
export async function getFamilyByInviteCode(code: string) {
  const { data } = await supabase
    .from('families').select('*').eq('invite_code', code.toUpperCase()).single()
  return data as Family | null
}

export async function createFamily(name: string, userId: string) {
  const { data } = await supabase
    .from('families').insert({ family_name: name, created_by: userId }).select().single()
  return data as Family | null
}

// ── MEMBERS ─────────────────────────────────────────────────────────────────
export async function getMembers(familyId: string) {
  const { data } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', familyId)
    .eq('is_active', true)
    .order('first_name')
  return (data ?? []) as FamilyMember[]
}

export async function upsertMember(member: Partial<FamilyMember>) {
  const { data, error } = await supabase
    .from('family_members').upsert(member).select().single()
  if (error) throw error
  return data as FamilyMember
}

export async function deleteMember(id: string) {
  await supabase.from('family_members').update({ is_active: false }).eq('id', id)
}

// ── EVENTS ───────────────────────────────────────────────────────────────────
export async function getEvents(familyId: string) {
  const { data } = await supabase
    .from('events')
    .select(`*, host:host_member_id(id,first_name,last_name,side_of_family),
      participants:event_participants(*, member:member_id(*))`)
    .eq('family_id', familyId)
    .order('gregorian_date', { ascending: false })
  return (data ?? []) as Event[]
}

export async function getEvent(id: string) {
  const { data } = await supabase
    .from('events')
    .select(`*, host:host_member_id(*),
      participants:event_participants(*, member:member_id(*))`)
    .eq('id', id).single()
  return data as Event | null
}

export async function upsertEvent(event: Partial<Event>) {
  const { data, error } = await supabase
    .from('events').upsert(event).select().single()
  if (error) throw error
  return data as Event
}

export async function deleteEvent(id: string) {
  await supabase.from('events').delete().eq('id', id)
}

// ── PARTICIPANTS ─────────────────────────────────────────────────────────────
export async function upsertParticipant(p: Partial<EventParticipant>) {
  const { data, error } = await supabase
    .from('event_participants').upsert(p).select().single()
  if (error) throw error
  return data as EventParticipant
}

export async function updateBringItem(
  eventId: string, memberId: string,
  what: string, confirmed: boolean
) {
  const { data } = await supabase
    .from('event_participants')
    .update({ what_they_bring: what, bring_confirmed: confirmed })
    .eq('event_id', eventId).eq('member_id', memberId)
    .select().single()
  return data
}

// ── INSIGHTS ─────────────────────────────────────────────────────────────────
export async function getInsights(familyId: string) {
  const events = await getEvents(familyId)
  const insights: { type: string; title: string; body: string; level: 'warn' | 'info' | 'ok' | 'alert' }[] = []

  // group by event type → find streaks
  const byType: Record<string, Event[]> = {}
  for (const ev of events) {
    const t = ev.event_type
    if (!byType[t]) byType[t] = []
    byType[t].push(ev)
  }

  // Check host streak per holiday
  for (const [type, evs] of Object.entries(byType)) {
    const last3 = evs.slice(0, 3)
    if (last3.length >= 3) {
      const sides = last3.map(e => e.host?.side_of_family).filter(Boolean)
      const allSame = sides.every(s => s === sides[0])
      if (allSame && sides[0]) {
        insights.push({
          type: 'streak',
          title: `3 שנים ברצף אצל ${sides[0]}`,
          body: `${type} חוגג אצל צד ${sides[0]} שלוש שנים ברצף. שנה טובה לשקול את הצד השני 😊`,
          level: 'warn',
        })
      }
    }
  }

  // Members not attended recently
  const allMembers = await getMembers(familyId)
  const recentEvents = events.slice(0, 6)
  for (const member of allMembers) {
    const appearedIn = recentEvents.filter(ev =>
      ev.participants?.some(p => p.member_id === member.id && p.attendance_status === 'attended')
    )
    if (appearedIn.length === 0 && recentEvents.length >= 3) {
      insights.push({
        type: 'absent',
        title: `${member.first_name} לא היה/תה זמן רב`,
        body: `${member.first_name} לא השתתף/ה באף אחד מ-${recentEvents.length} האירועים האחרונים. שווה לוודא שהוא/היא מוזמן/ת! 💙`,
        level: 'alert',
      })
    }
  }

  // Most active host
  const hostCount: Record<string, number> = {}
  for (const ev of events) {
    if (ev.host_member_id) {
      hostCount[ev.host_member_id] = (hostCount[ev.host_member_id] ?? 0) + 1
    }
  }
  const topHostId = Object.entries(hostCount).sort((a, b) => b[1] - a[1])[0]
  if (topHostId) {
    const host = allMembers.find(m => m.id === topHostId[0])
    if (host && topHostId[1] >= 3) {
      insights.push({
        type: 'host_star',
        title: `${host.first_name} — אלוף/ת האירוח 👑`,
        body: `${host.first_name} אירח/ה ${topHostId[1]} פעמים! המשפחה מודה לך 🙏`,
        level: 'ok',
      })
    }
  }

  // Side balance
  const sideTally: Record<string, number> = {}
  for (const ev of events) {
    const side = ev.host?.side_of_family
    if (side) sideTally[side] = (sideTally[side] ?? 0) + 1
  }
  const total = Object.values(sideTally).reduce((a, b) => a + b, 0)
  if (total >= 4) {
    const entries = Object.entries(sideTally).sort((a, b) => b[1] - a[1])
    const topSide = entries[0]
    const pct = Math.round((topSide[1] / total) * 100)
    if (pct >= 70) {
      insights.push({
        type: 'balance',
        title: `חוסר איזון — ${pct}% אצל צד ${topSide[0]}`,
        body: `מתוך ${total} אירועים, ${topSide[1]} היו אצל צד ${topSide[0]}. כדאי לאזן 😊`,
        level: 'warn',
      })
    }
  }

  return insights
}
