'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUserName(user.user_metadata?.full_name || user.email || 'אורח')
      setLoading(false)
    }
    check()
  }, [router])

  if (loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F8F8F4'}}>
      <div style={{fontSize:'2rem'}}>⏳</div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F8F8F4',fontFamily:'Heebo, sans-serif',direction:'rtl'}}>
      <div style={{background:'linear-gradient(135deg,#192542,#2e4a82)',padding:'48px 20px 24px',borderRadius:'0 0 28px 28px'}}>
        <p style={{color:'rgba(255,255,255,.5)',fontSize:'13px',margin:'0 0 4px'}}>שלום,</p>
        <h1 style={{color:'white',fontSize:'24px',fontWeight:900,margin:0}}>{userName} 👋</h1>
        <div style={{display:'inline-flex',alignItems:'center',gap:'6px',background:'rgba(255,255,255,.12)',borderRadius:'100px',padding:'4px 12px',marginTop:'10px',fontSize:'12px',color:'rgba(255,255,255,.7)'}}>
          👨‍👩‍👧‍👦 משפחת לוי · 8 בני משפחה
        </div>
      </div>

      <div style={{padding:'20px 16px 80px'}}>
        <div style={{background:'linear-gradient(135deg,#F07A55,#d45f38)',borderRadius:'24px',padding:'20px',marginBottom:'16px'}}>
          <p style={{color:'rgba(255,255,255,.6)',fontSize:'11px',fontWeight:700,margin:'0 0 4px'}}>⏰ החג הבא</p>
          <h2 style={{color:'white',fontSize:'22px',fontWeight:900,margin:'0 0 12px'}}>🌸 פסח</h2>
          <div style={{display:'flex',gap:'10px'}}>
            {[['34','ימים'],['8','שעות'],['22','דקות']].map(([n,l])=>(
              <div key={l} style={{background:'rgba(255,255,255,.18)',borderRadius:'12px',padding:'8px 14px',textAlign:'center'}}>
                <div style={{color:'white',fontSize:'22px',fontWeight:900}}>{n}</div>
                <div style={{color:'rgba(255,255,255,.6)',fontSize:'10px',marginTop:'2px'}}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'white',borderRadius:'18px',padding:'16px',boxShadow:'0 2px 12px rgba(25,37,66,.08)',marginBottom:'12px'}}>
          <h3 style={{fontSize:'17px',fontWeight:800,color:'#192542',margin:'0 0 12px'}}>בני המשפחה</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
            {[['א','#60a5fa','אבי'],['י','#22c55e','יעל'],['נ','#fb923c','נועה'],['ל','#c084fc','לאה']].map(([l,c,n])=>(
              <div key={n} style={{textAlign:'center'}}>
                <div style={{width:'52px',height:'52px',borderRadius:'16px',background:`linear-gradient(135deg,${c},${c}88)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',fontWeight:900,color:'white',margin:'0 auto 4px'}}>{l}</div>
                <span style={{fontSize:'11px',fontWeight:600,color:'#333'}}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{background:'white',borderRadius:'18px',padding:'16px',boxShadow:'0 2px 12px rgba(25,37,66,.08)'}}>
          <h3 style={{fontSize:'17px',fontWeight:800,color:'#192542',margin:'0 0 12px'}}>אירועים אחרונים</h3>
          {[['🕯️','חנוכה תשפ"ה','אצל אבי · 2024','7 הגיעו'],['🌸','פסח תשפ"ד','אצל לאה · 2024','8 הגיעו']].map(([e,t,s,p])=>(
            <div key={t} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
              <div style={{width:'46px',height:'46px',borderRadius:'14px',background:'#FEF0EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px'}}>{e}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:'14px',fontWeight:700,color:'#192542'}}>{t}</div>
                <div style={{fontSize:'12px',color:'#999',marginTop:'2px'}}>🏠 {s}</div>
              </div>
              <span style={{fontSize:'11px',fontWeight:700,background:'#E8F5EE',color:'#4E9B6A',padding:'3px 8px',borderRadius:'100px'}}>✓ {p}</span>
            </div>
          ))}
        </div>
      </div>

      <nav style={{position:'fixed',bottom:0,left:0,right:0,height:'72px',background:'white',borderTop:'1px solid #eee',display:'flex',paddingBottom:'6px',zIndex:99}}>
        {[['🏠','בית',true],['👥','משפחה',false],['📅','היסטוריה',false],['💡','תובנות',false],['⚙️','הגדרות',false]].map(([i,l,a])=>(
          <button key={String(l)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'2px',border:'none',background:'none',cursor:'pointer'}}>
            <div style={{width:'38px',height:'38px',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',background:a?'#FEF0EB':'transparent'}}>{i}</div>
            <span style={{fontSize:'10px',fontWeight:700,color:a?'#F07A55':'#aaa',fontFamily:'Heebo, sans-serif'}}>{String(l)}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
