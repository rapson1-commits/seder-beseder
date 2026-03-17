'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HistoryPage() {
  const router = useRouter()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('הכל')

  const filters = ['הכל','פסח','ראש השנה','חנוכה','פורים']
  const emojis: Record<string,string> = { 'פסח':'🌸','ראש השנה':'🍎','חנוכה':'🕯️','פורים':'🎭','שבועות':'🌾','סוכות':'🕍' }

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: profile } = await supabase.from('user_profiles').select('family_id').eq('id', user.id).single()
      if (!profile?.family_id) { router.push('/setup'); return }
      const { data } = await supabase.from('events').select('*').eq('family_id', profile.family_id).order('created_at', { ascending: false })
      setEvents(data || [])
      setLoading(false)
    })
  }, [router])

  const filtered = filter === 'הכל' ? events : events.filter(e => e.event_type === filter)
  const byYear = filtered.reduce((acc: any, ev) => {
    const y = ev.year || '2025'
    if (!acc[y]) acc[y] = []
    acc[y].push(ev)
    return acc
  }, {})

  if (loading) return <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ color:'white' }}>טוען...</div></div>

  return (
    <div style={{ minHeight:'100vh', background:'#192542', fontFamily:'Heebo, sans-serif', direction:'rtl', paddingBottom:'80px' }}>
      <div style={{ background:'linear-gradient(135deg,#192542,#1e3a6e)', padding:'52px 16px 16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:'430px', margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
            <h1 style={{ color:'white', fontSize:'22px', fontWeight:900, margin:0 }}>היסטוריית חגים</h1>
            <button onClick={() => router.push('/events/new')} style={{ width:'36px', height:'36px', borderRadius:'12px', background:'#F07A55', color:'white', border:'none', fontSize:'20px', cursor:'pointer' }}>+</button>
          </div>
          <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'4px' }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding:'6px 14px', borderRadius:'100px', border:'1.5px solid', borderColor: filter===f ? '#F07A55' : 'rgba(255,255,255,.15)', background: filter===f ? 'rgba(240,122,85,.2)' : 'transparent', color: filter===f ? '#F07A55' : 'rgba(255,255,255,.5)', fontSize:'12px', fontWeight:700, whiteSpace:'nowrap', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'12px 16px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 20px', color:'rgba(255,255,255,.4)' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>📅</div>
            <p style={{ fontSize:'16px', fontWeight:600 }}>אין אירועים עדיין</p>
            <button onClick={() => router.push('/events/new')} style={{ marginTop:'16px', padding:'12px 24px', background:'#F07A55', border:'none', borderRadius:'14px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>+ הוסף אירוע ראשון</button>
          </div>
        ) : Object.entries(byYear).sort(([a],[b]) => Number(b)-Number(a)).map(([year, evs]: any) => (
          <div key={year}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'16px 0 10px' }}>
              <div style={{ background:'linear-gradient(135deg,#F07A55,#d4603c)', color:'white', fontSize:'11px', fontWeight:800, padding:'5px 12px', borderRadius:'100px' }}>{year}</div>
              <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,.08)' }} />
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,.3)' }}>{evs.length} אירועים</span>
            </div>
            {evs.map((ev: any) => (
              <div key={ev.id} onClick={() => router.push(`/events/${ev.id}`)}
                style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'16px', padding:'14px 16px', marginBottom:'8px', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', borderRight:'3px solid #F07A55' }}>
                <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:'rgba(240,122,85,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>
                  {emojis[ev.event_type] || '⭐'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ color:'white', fontSize:'14px', fontWeight:800 }}>{ev.event_type} {ev.year || ''}</div>
                  <div style={{ color:'rgba(255,255,255,.4)', fontSize:'12px', marginTop:'2px' }}>{ev.location || ''}</div>
                </div>
                <span style={{ background: ev.actual_happened ? 'rgba(78,155,106,.2)' : 'rgba(201,154,46,.2)', color: ev.actual_happened ? '#7fdeaa' : '#fbbf24', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'100px', whiteSpace:'nowrap' }}>
                  {ev.actual_happened ? '✓ התקיים' : 'מתוכנן'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <nav style={{ position:'fixed', bottom:0, left:0, right:0, height:'72px', background:'white', borderTop:'1px solid #eee', display:'flex', zIndex:99, paddingBottom:'8px' }}>
        {[['🏠','בית','/home',false],['👥','משפחה','/members',false],['📅','היסטוריה','/history',true],['💡','תובנות','/insights',false],['⚙️','הגדרות','/settings',false]].map(([i,l,p,a]) => (
          <button key={String(p)} onClick={() => router.push(String(p))} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px', border:'none', background:'none', cursor:'pointer' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'19px', background: a ? 'linear-gradient(135deg,#192542,#1e3a6e)' : 'transparent' }}>{i}</div>
            <span style={{ fontSize:'10px', fontWeight:700, color: a ? '#192542' : '#bbb', fontFamily:'Heebo, sans-serif' }}>{String(l)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
