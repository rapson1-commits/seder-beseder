'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const HOLIDAYS = [
  { name: 'פסח',       date: new Date('2025-04-13'), emoji: '🌸' },
  { name: 'שבועות',    date: new Date('2025-06-02'), emoji: '🌾' },
  { name: 'ראש השנה',  date: new Date('2025-09-23'), emoji: '🍎' },
  { name: 'סוכות',     date: new Date('2025-10-14'), emoji: '🕍' },
  { name: 'חנוכה',     date: new Date('2025-12-15'), emoji: '🕯️' },
  { name: 'פסח',       date: new Date('2026-04-02'), emoji: '🌸' },
]

function getNextHoliday() {
  const now = new Date()
  return HOLIDAYS.find(h => h.date > now) ?? HOLIDAYS[0]
}

function getDaysUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000))
}

const AVATAR_COLORS = ['#4A82D4','#4E9B6A','#F07A55','#C99A2E','#E0655F','#9B59B6']

export default function HomePage() {
  const router = useRouter()
  const [familyName, setFamilyName] = useState('המשפחה שלי')
  const [members, setMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState<string | null>(null)

  const nextHoliday = getNextHoliday()
  const daysLeft = getDaysUntil(nextHoliday.date)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('family_id')
        .eq('id', user.id)
        .single()

      if (!profile?.family_id) { router.push('/setup'); return }

      const { data: family } = await supabase
        .from('families')
        .select('family_name')
        .eq('id', profile.family_id)
        .single()

      if (family) setFamilyName(family.family_name || 'המשפחה שלי')

      const { data: m } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', profile.family_id)
        .order('full_name')

      const { data: e } = await supabase
        .from('events')
        .select('*')
        .eq('family_id', profile.family_id)
        .order('created_at', { ascending: false })
        .limit(5)

      setMembers(m || [])
      setEvents(e || [])

      // Simple insight
      if (m && m.length > 0) {
        const dadSide = m.filter((x: any) => x.family_side === 'צד אבא').length
        const momSide = m.filter((x: any) => x.family_side === 'צד אמא').length
        if (dadSide > momSide * 2) setInsight('⚖️ שים לב — יש הרבה יותר בני משפחה מצד אבא')
        else if (momSide > dadSide * 2) setInsight('⚖️ שים לב — יש הרבה יותר בני משפחה מצד אמא')
      }

      setLoading(false)
    })
  }, [router])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'16px' }}>טוען...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#192542', fontFamily:'Heebo, sans-serif', direction:'rtl', paddingBottom:'80px' }}>

      {/* HEADER */}
      <div style={{ background:'linear-gradient(135deg,#192542,#1e3a6e)', padding:'52px 20px 24px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(240,122,85,.1)', pointerEvents:'none' }} />
        <div style={{ maxWidth:'430px', margin:'0 auto', position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <p style={{ color:'rgba(255,255,255,.5)', fontSize:'13px', margin:0 }}>שלום,</p>
              <h1 style={{ color:'white', fontSize:'24px', fontWeight:900, margin:'4px 0 0' }}>{familyName} 👋</h1>
            </div>
            <button onClick={() => router.push('/settings')} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:'14px', width:'42px', height:'42px', color:'white', fontSize:'20px', cursor:'pointer' }}>⚙️</button>
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(255,255,255,.1)', borderRadius:'100px', padding:'6px 12px', marginTop:'12px' }}>
            <span style={{ fontSize:'14px' }}>👨‍👩‍👧‍👦</span>
            <span style={{ color:'rgba(255,255,255,.7)', fontSize:'12px', fontWeight:600 }}>{members.length} בני משפחה · {events.length} אירועים</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'16px' }}>

        {/* NEXT HOLIDAY */}
        <div style={{ background:'linear-gradient(135deg,#F07A55,#d4603c)', borderRadius:'24px', padding:'20px', marginBottom:'12px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-50px', right:'-40px', width:'160px', height:'160px', borderRadius:'50%', background:'rgba(255,255,255,.08)', pointerEvents:'none' }} />
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:'11px', fontWeight:700, letterSpacing:'.5px', margin:'0 0 6px' }}>⏰ החג הבא</p>
          <h2 style={{ color:'white', fontSize:'22px', fontWeight:900, margin:'0 0 14px' }}>{nextHoliday.emoji} {nextHoliday.name}</h2>
          <div style={{ display:'flex', gap:'8px', marginBottom:'16px' }}>
            {[['ימים', daysLeft], ['שעות', new Date().getHours()], ['דקות', new Date().getMinutes()]].map(([lbl, val]) => (
              <div key={String(lbl)} style={{ background:'rgba(255,255,255,.18)', borderRadius:'12px', padding:'8px 14px', textAlign:'center' }}>
                <div style={{ color:'white', fontSize:'20px', fontWeight:900, lineHeight:1 }}>{val}</div>
                <div style={{ color:'rgba(255,255,255,.65)', fontSize:'10px', marginTop:'3px' }}>{lbl}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'8px' }}>
            <button onClick={() => router.push('/events/new')}
              style={{ padding:'9px 16px', borderRadius:'12px', border:'none', cursor:'pointer', fontFamily:'Heebo, sans-serif', fontSize:'13px', fontWeight:700, background:'white', color:'#F07A55' }}>
              📋 תכנן
            </button>
            <button onClick={() => router.push('/history')}
              style={{ padding:'9px 16px', borderRadius:'12px', border:'1.5px solid rgba(255,255,255,.35)', cursor:'pointer', fontFamily:'Heebo, sans-serif', fontSize:'13px', fontWeight:700, background:'rgba(255,255,255,.15)', color:'white' }}>
              🧺 מי מביא מה
            </button>
          </div>
        </div>

        {/* INSIGHT */}
        {insight && (
          <div style={{ background:'#FEF3D0', borderRadius:'16px', padding:'14px', marginBottom:'12px', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'11px', background:'rgba(201,154,46,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>💡</div>
            <p style={{ fontSize:'13px', fontWeight:700, color:'#92400e', margin:0 }}>{insight}</p>
          </div>
        )}

        {/* STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
          <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'16px', padding:'14px' }}>
            <div style={{ fontSize:'22px', marginBottom:'4px' }}>📅</div>
            <div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{events.length}</div>
            <div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginTop:'2px' }}>אירועים שתועדו</div>
          </div>
          <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'16px', padding:'14px' }}>
            <div style={{ fontSize:'22px', marginBottom:'4px' }}>👥</div>
            <div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{members.length}</div>
            <div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginTop:'2px' }}>בני משפחה</div>
          </div>
        </div>

        {/* MEMBERS */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
          <span style={{ color:'white', fontSize:'17px', fontWeight:800 }}>בני המשפחה</span>
          <button onClick={() => router.push('/members')} style={{ background:'none', border:'none', color:'#F07A55', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>הכל ←</button>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'16px' }}>
          {members.slice(0, 4).map((m, i) => (
            <button key={m.id} onClick={() => router.push(`/members/${m.id}`)}
              style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
              <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:AVATAR_COLORS[i % AVATAR_COLORS.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', fontWeight:800, color:'white' }}>
                {m.full_name ? m.full_name[0] : '?'}
              </div>
              <span style={{ fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,.7)' }}>{m.full_name?.split(' ')[0]}</span>
            </button>
          ))}
          {members.length === 0 && (
            <button onClick={() => router.push('/members/new')}
              style={{ background:'rgba(255,255,255,.06)', border:'1.5px dashed rgba(255,255,255,.15)', borderRadius:'16px', width:'56px', height:'56px', color:'rgba(255,255,255,.3)', fontSize:'22px', cursor:'pointer' }}>+</button>
          )}
        </div>

        {/* RECENT EVENTS */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
          <span style={{ color:'white', fontSize:'17px', fontWeight:800 }}>אירועים אחרונים</span>
          <button onClick={() => router.push('/history')} style={{ background:'none', border:'none', color:'#F07A55', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>הכל ←</button>
        </div>

        {events.length === 0 ? (
          <div style={{ background:'rgba(255,255,255,.05)', borderRadius:'20px', padding:'32px', textAlign:'center' }}>
            <div style={{ fontSize:'40px', marginBottom:'10px' }}>📅</div>
            <p style={{ color:'rgba(255,255,255,.5)', fontSize:'14px', fontWeight:600, margin:'0 0 12px' }}>אין אירועים עדיין</p>
            <button onClick={() => router.push('/events/new')}
              style={{ padding:'10px 20px', background:'#F07A55', border:'none', borderRadius:'12px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
              + הוסף אירוע ראשון
            </button>
          </div>
        ) : (
          <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'20px', overflow:'hidden' }}>
            {events.slice(0,3).map((ev, i) => (
              <button key={ev.id} onClick={() => router.push(`/events/${ev.id}`)}
                style={{ width:'100%', padding:'14px 16px', background:'transparent', border:'none', borderBottom: i < 2 ? '1px solid rgba(255,255,255,.06)' : 'none', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:'rgba(240,122,85,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                  {ev.event_type === 'פסח' ? '🌸' : ev.event_type === 'ראש השנה' ? '🍎' : ev.event_type === 'חנוכה' ? '🕯️' : ev.event_type === 'פורים' ? '🎭' : '⭐'}
                </div>
                <div style={{ flex:1, textAlign:'right' }}>
                  <div style={{ color:'white', fontSize:'14px', fontWeight:700 }}>{ev.event_type} {ev.year || ''}</div>
                  <div style={{ color:'rgba(255,255,255,.4)', fontSize:'12px', marginTop:'2px' }}>{ev.location || ''}</div>
                </div>
                <span style={{ background:ev.actual_happened ? 'rgba(78,155,106,.2)' : 'rgba(201,154,46,.2)', color: ev.actual_happened ? '#7fdeaa' : '#fbbf24', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'100px', whiteSpace:'nowrap' }}>
                  {ev.actual_happened ? '✓ התקיים' : 'מתוכנן'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => router.push('/events/new')}
        style={{ position:'fixed', bottom:'84px', left:'50%', transform:'translateX(-50%)', width:'52px', height:'52px', background:'linear-gradient(135deg,#F07A55,#d4603c)', border:'none', borderRadius:'16px', color:'white', fontSize:'26px', cursor:'pointer', boxShadow:'0 8px 20px rgba(240,122,85,.45)', zIndex:50 }}>
        +
      </button>

      {/* BOTTOM NAV */}
      <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:'72px', background:'white', borderTop:'1px solid #eee', display:'flex', zIndex:99, paddingBottom:'8px' }}>
        {[
          { icon:'🏠', label:'בית',      path:'/home',     active:true },
          { icon:'👥', label:'משפחה',    path:'/members',  active:false },
          { icon:'📅', label:'היסטוריה', path:'/history',  active:false },
          { icon:'💡', label:'תובנות',   path:'/insights', active:false },
          { icon:'⚙️', label:'הגדרות',   path:'/settings', active:false },
        ].map(item => (
          <button key={item.path} onClick={() => router.push(item.path)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px', border:'none', background:'none', cursor:'pointer' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'19px', background: item.active ? 'linear-gradient(135deg,#192542,#1e3a6e)' : 'transparent' }}>
              {item.icon}
            </div>
            <span style={{ fontSize:'10px', fontWeight:700, color: item.active ? '#192542' : '#bbb', fontFamily:'Heebo, sans-serif' }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
