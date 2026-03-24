'use client'
import { usePathname, useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'בית',       emoji: '🏠', path: '/home'     },
  { label: 'משפחה',     emoji: '👥', path: '/members'  },
  { label: 'היסטוריה', emoji: '📅', path: '/history'  },
  { label: 'תובנות',   emoji: '💡', path: '/insights' },
  { label: 'הגדרות',   emoji: '⚙️', path: '/settings' },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <nav className="bottom-nav bg-white border-t border-gray-200 flex pb-5 pt-1.5 shadow-[0_-4px_24px_rgba(0,0,0,.05)]">
      {NAV_ITEMS.map(item => {
        const active = pathname.startsWith(item.path)
        return (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="flex-1 flex flex-col items-center gap-1 py-1 transition-transform active:scale-90"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-colors
                            ${active ? 'bg-orange-light' : ''}`}>
              {item.emoji}
            </div>
            <span className={`text-[10px] font-semibold transition-colors
                             ${active ? 'text-orange-DEFAULT' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
