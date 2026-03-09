'use client'
import { type FamilyMember, EVENT_EMOJIS, type EventType } from '@/types'

// ── AVATAR ───────────────────────────────────────────────────────────────────
function getSideClass(side?: string | null) {
  if (side === 'אמא') return 'av-side-mom'
  if (side === 'אבא') return 'av-side-dad'
  if (side === 'בן/בת זוג') return 'av-side-sp'
  return 'av-side-oth'
}

export function Avatar({
  member, size = 'md', className = ''
}: { member: Pick<FamilyMember, 'first_name' | 'side_of_family'>; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  const sizeClass = `av-${size}`
  return (
    <div className={`${sizeClass} ${getSideClass(member.side_of_family)} ${className}`}>
      {member.first_name[0]}
    </div>
  )
}

// ── HOLIDAY EMOJI ─────────────────────────────────────────────────────────────
export function HolidayIcon({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' | 'lg' }) {
  const emoji = EVENT_EMOJIS[type] ?? '⭐'
  const s = size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl'
  return <span className={s}>{emoji}</span>
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'navy' }: {
  children: React.ReactNode
  variant?: 'green' | 'orange' | 'gold' | 'red' | 'blue' | 'navy'
}) {
  return <span className={`bdg bdg-${variant}`}>{children}</span>
}

// ── LOADING SKELETON ──────────────────────────────────────────────────────────
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="card mb-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ emoji, title, sub, action }: {
  emoji: string; title: string; sub: string; action?: React.ReactNode
}) {
  return (
    <div className="text-center py-14 px-8">
      <div className="text-6xl mb-4">{emoji}</div>
      <div className="text-xl font-extrabold text-navy-DEFAULT mb-2">{title}</div>
      <div className="text-sm text-gray-500 leading-relaxed mb-6">{sub}</div>
      {action}
    </div>
  )
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react'

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2800)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50
                    bg-navy-DEFAULT text-white px-5 py-3.5 rounded-2xl
                    shadow-lg text-sm font-semibold whitespace-nowrap
                    animate-[slideUp_0.35s_cubic-bezier(.34,1.56,.64,1)_both]">
      {message}
    </div>
  )
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
export function ConfirmModal({ title, body, onConfirm, onCancel }: {
  title: string; body: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
         onClick={onCancel}>
      <div className="bg-white rounded-t-3xl p-6 w-full max-w-[430px]
                      animate-[modalIn_0.3s_cubic-bezier(.34,1.56,.64,1)]"
           onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded mx-auto mb-5" />
        <h3 className="text-xl font-extrabold text-navy-DEFAULT mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">{body}</p>
        <div className="flex flex-col gap-2">
          <button className="btn-primary bg-red-DEFAULT from-red-DEFAULT to-red-600"
                  onClick={onConfirm}>אישור</button>
          <button className="btn-secondary" onClick={onCancel}>ביטול</button>
        </div>
      </div>
    </div>
  )
}

// ── ATTENDANCE STATUS CHIP ────────────────────────────────────────────────────
import type { AttendanceStatus } from '@/types'
const ATT_STYLE: Record<AttendanceStatus, string> = {
  invited:   'bdg-navy',
  confirmed: 'bdg-blue',
  declined:  'bdg-red',
  attended:  'bdg-green',
  absent:    'bdg-red',
}
const ATT_LABEL: Record<AttendanceStatus, string> = {
  invited:   'הוזמן',
  confirmed: 'אישר ✓',
  declined:  'לא מגיע',
  attended:  'הגיע ✓',
  absent:    'לא הגיע',
}
export function AttBadge({ status }: { status: AttendanceStatus }) {
  return <span className={`bdg ${ATT_STYLE[status]}`}>{ATT_LABEL[status]}</span>
}
