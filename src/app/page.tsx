'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'login' | 'join' | 'create'>('login')
  const [inviteCode, setInviteCode] = useState('')
  const [familyName, setFamilyName] = useState('')

  async function handleGoogle() {
    setLoading(true)
    setError('')
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://seder-beseder.com/home',
      },
    })
    if (e) { setError('שגיאה בכניסה עם Google'); setLoading(false) }
  }

  async function handlePhone() {
    if (!phone) return setError('הכנס מספר טלפון')
    setLoading(true); setError('')
    const formatted = phone.startsWith('0') ? '+972' + phone.slice(1) : phone
    const { error: e } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (e) { setError('שגיאה בשליחת קוד. נסה שוב'); setLoading(false); return }
    setOtpSent(true); setLoading(false)
  }

  async function handleOtp() {
    if (!otp) return
    setLoading(true); setError('')
    const formatted = phone.startsWith('0') ? '+972' + phone.slice(1) : phone
    const { error: e } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    if (e) { setError('קוד שגוי, נסה שוב'); setLoading(false); return }
    router.push('/home')
  }

  const inp: React.CSSProperties = {
    width:'100%', padding:'0.85rem 1rem',
    background:'#f9fafb', border:'2px solid #e5e7eb',
    borderRadius:'12px', fontSize:'1rem', fontWeight:500, color:'#1f2937',
    outline:'none', direction:'rtl', fontFamily:'inherit', boxSizing:'border-box',
  }

  const btnOrange: React.CSSProperties = {
    width:'100%', padding:'0.95rem',
    background:'linear-gradient(135deg,#F07A55,#d45f38)',
    border:'none', borderRadius:'14px', color:'white',
    fontSize:'1rem', fontWeight:700, cursor:'pointer',
    fontFamily:'inherit', boxShadow:'0 4px 16px rgba(240,122,85,.4)',
  }

  return (
    <div style={{
      minHeight:'100vh',
      background:'linear-gradient(160deg,#192542 0%,#2e4a82 55%,#192542 100%)',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'2rem 1.25rem', position:'relative', overflow:'hidden',
    }}>
      <div style={{position:'absolute',top:'-100px',right:'-100px',width:'320px',height:'320px',borderRadius:'50%',background:'rgba(240,122,85,0.14)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:'-80px',left:'-80px',width:'260px',height:'260px',borderRadius:'50%',background:'rgba(78,155,106,0.1)',pointerEvents:'none'}}/>

      <div style={{textAlign:'center',marginBottom:'2rem',zIndex:10,position:'relative'}}>
        <div style={{
          width:'88px',height:'88px',
          background:'linear-gradient(135deg,#F07A55,#d45f38)',
          borderRadius:'26px',display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:'42px',margin:'0 auto 1rem',
          boxShadow:'0 14px 36px rgba(240,122,85,.45)',
        }}>🏠</div>
        <h1 style={{fontSize:'2.6rem',fontWeight:900,color:'white',margin:0}}>
          סדר <span style={{color:'#F07A55'}}>בסדר</span>
        </h1>
        <p style={{color:'rgba(255,255,255,.5)',marginTop:'0.4rem',fontSize:'0.9rem'}}>
          עושים סדר בחגים המשפחתיים
        </p>
      </div>

      <div style={{
        width:'100%',maxWidth:'380px',
        background:'white',borderRadius:'28px',
        padding:'1.75rem',
        boxShadow:'0 24px 60px rgba(0,0,0,.3)',
        zIndex:10,position:'relative',
      }}>
        {!otpSent && (
          <div style={{display:'flex',gap:'3px',background:'#f3f4f6',borderRadius:'13px',padding:'4px',marginBottom:'1.5rem'}}>
            {([['login','כניסה'],['join','הצטרפות'],['create','חדש']] as const).map(([t,l])=>(
              <button key={t} onClick={()=>{setTab(t);setError('')}} style={{
                flex:1,padding:'0.55rem 0.2rem',borderRadius:'9px',border:'none',
                fontSize:'0.78rem',fontWeight:700,cursor:'pointer',
                background:tab===t?'white':'transparent',
                color:tab===t?'#192542':'#9ca3af',
                boxShadow:tab===t?'0 2px 8px rgba(0,0,0,.1)':'none',
                fontFamily:'inherit',
              }}>{l}</button>
            ))}
          </div>
        )}

        {tab==='login' && !otpSent && (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <button onClick={handleGoogle} disabled={loading} style={{
              width:'100%',padding:'0.9rem',
              background:'white',border:'2px solid #e5e7eb',
              borderRadius:'14px',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:'0.75rem',
              fontSize:'0.95rem',fontWeight:700,color:'#192542',
              boxShadow:'0 2px 8px rgba(0,0,0,.06)',fontFamily:'inherit',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'מתחבר...' : 'כניסה עם Google'}
            </button>

            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',margin:'0.2rem 0'}}>
              <div style={{flex:1,height:'1px',background:'#e5e7eb'}}/>
              <span style={{fontSize:'0.8rem',color:'#9ca3af',fontWeight:600}}>או</span>
              <div style={{flex:1,height:'1px',background:'#e5e7eb'}}/>
            </div>

            <input style={inp} placeholder="📱 מספר טלפון (054-...)"
              value={phone} onChange={e=>setPhone(e.target.value)} type="tel"/>
            <button onClick={handlePhone} disabled={loading} style={btnOrange}>
              {loading?'שולח...':'שלח קוד SMS'}
            </button>
          </div>
        )}

        {otpSent && (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div style={{textAlign:'center',marginBottom:'0.5rem'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.5rem'}}>📱</div>
              <p style={{fontSize:'0.9rem',color:'#4b5563',fontWeight:600}}>שלחנו קוד ל-{phone}</p>
            </div>
            <input style={{...inp,fontSize:'1.8rem',fontWeight:700,color:'#192542',textAlign:'center',letterSpacing:'0.4em'}}
              placeholder="000000" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)}/>
            <button onClick={handleOtp} disabled={loading} style={btnOrange}>
              {loading?'מאמת...':'כניסה ✓'}
            </button>
            <button onClick={()=>setOtpSent(false)} style={{background:'none',border:'none',color:'#6b7280',fontSize:'0.85rem',cursor:'pointer',fontFamily:'inherit'}}>
              ← חזרה
            </button>
          </div>
        )}

        {tab==='join' && (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div style={{background:'#EBF2FF',borderRadius:'12px',padding:'0.8rem',fontSize:'0.85rem',color:'#4A82D4',fontWeight:500,textAlign:'right'}}>
              📨 קיבלת קוד הזמנה ממשפחתך? הכנס אותו כאן
            </div>
            <input style={{...inp,fontSize:'1.4rem',fontWeight:700,color:'#192542',textAlign:'center',letterSpacing:'0.25em'}}
              placeholder="ABCD1234" maxLength={8}
              value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())}/>
            <button style={{...btnOrange,background:'linear-gradient(135deg,#4A82D4,#2563eb)'}}>
              🔍 הצטרף למשפחה
            </button>
          </div>
        )}

        {tab==='create' && (
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            <div style={{background:'#E8F5EE',borderRadius:'12px',padding:'0.8rem',fontSize:'0.85rem',color:'#4E9B6A',fontWeight:500,textAlign:'right'}}>
              ✨ צור קבוצה משפחתית חדשה והזמן את כולם
            </div>
            <input style={inp} placeholder="שם המשפחה (לדוגמה: משפחת לוי)"
              value={familyName} onChange={e=>setFamilyName(e.target.value)}/>
            <button style={{...btnOrange,background:'linear-gradient(135deg,#4E9B6A,#15803d)'}}>
              👨‍👩‍👧‍👦 צור משפחה חדשה
            </button>
          </div>
        )}

        {error && (
          <div style={{marginTop:'0.75rem',background:'#FDECEA',borderRadius:'12px',padding:'0.75rem 1rem',fontSize:'0.875rem',fontWeight:600,color:'#E0655F',textAlign:'center'}}>
            {error}
          </div>
        )}
      </div>

      <p style={{color:'rgba(255,255,255,.2)',fontSize:'0.72rem',marginTop:'1.5rem',textAlign:'center',zIndex:10,position:'relative'}}>
        סדר בסדר v1.0 · עם ❤️ למשפחות ישראל
      </p>
    </div>
  )
}
