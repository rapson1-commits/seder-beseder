export type FamilySide = 'אמא' | 'אבא' | 'בן/בת זוג' | 'אחר'

export type AttendanceStatus = 'invited' | 'confirmed' | 'declined' | 'attended' | 'absent'

export type EventType =
  | 'ראש השנה' | 'יום כיפור' | 'סוכות' | 'שמחת תורה'
  | 'חנוכה' | 'פורים' | 'פסח' | 'שבועות'
  | 'שבת משפחתית' | 'ארוחת שישי' | 'יום הולדת' | 'מפגש משפחתי' | 'אחר'

export interface Family {
  id: string
  family_name: string
  invite_code: string
  created_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  first_name: string
  last_name: string | null
  nickname: string | null
  phone: string | null
  email: string | null
  side_of_family: FamilySide | null
  notes: string | null
  is_active: boolean
  created_at: string
}

export interface Event {
  id: string
  family_id: string
  event_type: EventType
  holiday_name: string | null
  custom_name: string | null
  gregorian_date: string | null
  year: number | null
  host_member_id: string | null
  host_name_manual: string | null
  location_name: string | null
  notes: string | null
  actual_happened: boolean
  created_at: string
  // joined
  host?: FamilyMember | null
  participants?: EventParticipant[]
}

export interface EventParticipant {
  id: string
  event_id: string
  member_id: string
  attendance_status: AttendanceStatus
  what_they_bring: string | null
  bring_confirmed: boolean
  notes: string | null
  created_at: string
  // joined
  member?: FamilyMember
}

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  family_id: string | null
  is_admin: boolean
}

// UI helpers
export const EVENT_EMOJIS: Record<string, string> = {
  'ראש השנה': '🍎',
  'יום כיפור': '🕍',
  'סוכות': '🌿',
  'שמחת תורה': '📜',
  'חנוכה': '🕯️',
  'פורים': '🎭',
  'פסח': '🌸',
  'שבועות': '🌾',
  'שבת משפחתית': '🍽️',
  'ארוחת שישי': '🕯️',
  'יום הולדת': '🎂',
  'מפגש משפחתי': '👨‍👩‍👧‍👦',
  'אחר': '⭐',
}

export const SIDE_COLORS: Record<string, string> = {
  'אמא':         'bg-blue-500',
  'אבא':         'bg-green-600',
  'בן/בת זוג':  'bg-orange-DEFAULT',
  'אחר':         'bg-gold-DEFAULT',
}

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  invited:   'הוזמן',
  confirmed: 'אישר',
  declined:  'לא מגיע',
  attended:  'הגיע ✓',
  absent:    'לא הגיע',
}
