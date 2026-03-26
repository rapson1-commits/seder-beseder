'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Family } from '@/types'

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [myFamilies, setMyFamilies] = useState<Family[]>([])
  const [showAddFamily, setShowAddFamily] = useState(false)
  const [addMode, setAddMode] = useState<'join'|'create'>('join')
  const [newFamilyName, setNewFamilyName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    setUserId(user.id)
    const { data: profile } = await supabase.from('user_profiles').select('full_name, phone, family_id, is_admin').eq('id', user.id).single()
    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setIsAdmin(profile.is_admin || false)
      if (profile.family_id) {
        setFamilyId(profile.family_id)
        const { data: family } = await supabase.from('families').select('family_name, invite_code').eq('id', profile.family_id).single()
        if (family) { setFamilyName(family.family_name || ''); setInviteCode(family.invite_code || '') }
      }
    }
    const { data: members } = await supabase.from('family_members').select('family_id').eq('user_id', user.id)
    if (members && members.length > 0) {
      const ids = members.map((m: any) => m.family_id)
      const { data: families } = await supabase.from('families').select('*').in('id', ids)
      setMyFamilies((families || []) as Family[])
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving('profile')
    await supabase.from('user_profiles').update({ full_name: fullName, phone }).eq('id', userId)
    setSaving(null); showSuccess('הפרופיל עודכן! ✓')
  }

  async function saveFamily() {
    if (!isAdmin) return
    setSaving('family')
    await supabase.from('families').update({ family_name: familyName, invite_code: inviteCode.toUpperCase() }).eq('id', familyId)
    setSaving(null); showSuccess('פרטי המשפחה עודכנו! ✓')
  }

  async function switchFamily(fid: string) {
    await supabase.from('user_profiles').update({ family_id: fid }).eq('id', userId)
    router.push('/home')
  }

  async function createFamily() {
    if (!newFamilyName.trim()) return
    setSaving('add')
    const code = newFamilyName.trim().replace(/\s+/g,'').toUpperCase().slice(0,8) + '26'
    const newId = crypto.randomUUID()
    await supabase.from('families').insert({ id: newId, family_name: newFamilyName.trim(), invite_code: code })
    await supabase.from('user_profiles').update({ family_id: newId, is_admin: true }).eq('id', userId)
    await supabase.from('family_members').insert({ family_id: newId, user_id: userId, full_name: fullName })
    setSaving(null); router.push('/home')
  }

  async function joinFamily() {
    if (!joinCode.trim()) return
    setSaving('add')
    const { data: family } = await supabase.from('families').select('id, family_name').eq('invite_code', joinCode.toUpperCase()).single()
    if (!family) { showSuccess('קוד לא נמצא ⚠️'); setSaving(null); return }
    await supabase.from('user_profiles').update({ family_id: family.id }).eq('id', userId)
    await supabase.from('family_members').insert({ family_id: family.id, user_id: userId, full_name: fullName })
    setSaving(null); router.push('/home')
  }

  async function signOut() {
    await supabase.auth.signOut(); router.push('/')
  }

  function showSuccess(msg: string) {
    setSuccess(msg); setTimeout(() => setSuccess(null), 3000)
  }

  const inp = { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,.07)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:'14px', fontSize:'15px', fontFamily:'Heebo, sans-serif', direction:'rtl' as const, color:'white', outline:'none' }
  const lbl = { display:'block', color:'rgba(255,255,255,.45)', fontSize:'12px', fontWeight:700, marginBottom:'6px' }
  const sec = { color:'rgba(255,255,255,.35)', fontSize:'11px', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase' as const, marginBottom:'10px', marginTop:'4px' }
  const box = { background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'20px', padding:'16px', marginBottom:'16px' }
  const avatarColors = ['#F07A55','#4A82D4','#4E9B6A','#C99A2E','#E0655F','#9B59B6']

  if (loading) return <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}><div style={{ color:'white' }}>טוען...</div></div>

  return (
    <div style={{ minHeight:'100vh', background:'#192542', fontFamily:'Heebo, sans-serif', direction:'rtl' }}>
      <div style={{ background:'linear-gradient(135deg,#192542,#1e3a6e)', padding:'52px 20px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:'430px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => router.push('/home')} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:'12px', width:'36px', height:'36px', color:'white', fontSize:'18px', cursor:'pointer' }}>→</button>
          <h1 style={{ color:'white', fontSize:'20px', fontWeight:800 }}>הגדרות</h1>
          <div style={{ width:'36px' }} />
        </div>
      </div>

      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'20px 16px 100px' }}>
        {success && <div style={{ background:'rgba(78,155,106,.2)', border:'1px solid rgba(78,155,106,.4)', borderRadius:'14px', padding:'12px 16px', marginBottom:'16px', color:'#7fdeaa', fontSize:'14px', fontWeight:700, textAlign:'center' }}>{success}</div>}

        {/* PROFILE */}
        <p style={sec}>פרופיל אישי</p>
        <div style={box}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'18px', background:'#F07A55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:900, color:'white', flexShrink:0 }}>{fullName?fullName[0]:'?'}</div>
            <div><div style={{ color:'white', fontSize:'16px', fontWeight:800 }}>{fullName||'המשתמש שלי'}</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:'12px', marginTop:'2px' }}>{isAdmin?'👑 מנהל משפחה':'חבר משפחה'}</div></div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div><label style={lbl}>שם מלא</label><input style={inp} value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="השם שלך" /></div>
            <div><label style={lbl}>טלפון</label><input style={inp} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="052-0000000" type="tel" /></div>
          </div>
          <button onClick={saveProfile} disabled={saving==='profile'} style={{ width:'100%', padding:'13px', background:'#F07A55', border:'none', borderRadius:'14px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', marginTop:'14px', fontFamily:'Heebo, sans-serif', opacity:saving==='profile'?0.7:1, boxShadow:'0 4px 16px rgba(240,122,85,.3)' }}>
            {saving==='profile'?'שומר...':'✓ שמור פרופיל'}
          </button>
        </div>

        {/* FAMILIES */}
        <p style={sec}>המשפחות שלי</p>
        <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'20px', overflow:'hidden', marginBottom:'12px' }}>
          {/* Current */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'#F07A55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:'white', flexShrink:0 }}>{familyName?familyName.replace('משפחת','').trim()[0]:'?'}</div>
            <div style={{ flex:1 }}><div style={{ color:'white', fontSize:'14px', fontWeight:700 }}>{familyName||'משפחה נוכחית'}</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginTop:'2px' }}>פעילה כעת ✓</div></div>
            <span style={{ background:'rgba(78,155,106,.2)', color:'#7fdeaa', fontSize:'11px', fontWeight:700, padding:'4px 10px', borderRadius:'100px' }}>פעיל</span>
          </div>
          {/* Other families */}
          {myFamilies.filter(f=>f.id!==familyId).map((f,i)=>(
            <div key={f.id} style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer' }} onClick={()=>switchFamily(f.id)}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:avatarColors[(i+1)%avatarColors.length], display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:'white', flexShrink:0 }}>{f.family_name?f.family_name.replace('משפחת','').trim()[0]:'?'}</div>
              <div style={{ flex:1 }}><div style={{ color:'white', fontSize:'14px', fontWeight:700 }}>{f.family_name}</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginTop:'2px' }}>לחץ לעבור</div></div>
              <span style={{ color:'rgba(255,255,255,.2)', fontSize:'18px' }}>‹</span>
            </div>
          ))}
          {/* Add family */}
          <button onClick={()=>setShowAddFamily(!showAddFamily)} style={{ width:'100%', padding:'14px 16px', background:'transparent', border:'none', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'rgba(240,122,85,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>+</div>
            <span style={{ color:'#F07A55', fontSize:'14px', fontWeight:700 }}>הוסף משפחה</span>
          </button>
        </div>

        {/* ADD FAMILY PANEL */}
        {showAddFamily && (
          <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:'20px', padding:'16px', marginBottom:'16px' }}>
            <div style={{ display:'flex', background:'rgba(255,255,255,.05)', borderRadius:'12px', padding:'4px', marginBottom:'16px' }}>
              <button onClick={()=>setAddMode('join')} style={{ flex:1, padding:'9px', borderRadius:'10px', border:'none', background:addMode==='join'?'#F07A55':'transparent', color:addMode==='join'?'white':'rgba(255,255,255,.4)', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>📨 יש לי קוד</button>
              <button onClick={()=>setAddMode('create')} style={{ flex:1, padding:'9px', borderRadius:'10px', border:'none', background:addMode==='create'?'#F07A55':'transparent', color:addMode==='create'?'white':'rgba(255,255,255,.4)', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>✨ משפחה חדשה</button>
            </div>
            {addMode==='join' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div><label style={lbl}>קוד הזמנה</label><input style={{ ...inp, letterSpacing:'3px', fontWeight:700, fontSize:'17px', textAlign:'center' }} placeholder="RAPSON26" maxLength={10} value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} /></div>
                <button onClick={joinFamily} disabled={saving==='add'} style={{ width:'100%', padding:'13px', background:'#F07A55', border:'none', borderRadius:'14px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif', opacity:saving==='add'?0.7:1 }}>{saving==='add'?'מצטרף...':'🔍 הצטרף למשפחה'}</button>
              </div>
            )}
            {addMode==='create' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                <div><label style={lbl}>שם המשפחה החדשה</label><input style={inp} placeholder="לדוגמה: משפחת סנסולו" value={newFamilyName} onChange={e=>setNewFamilyName(e.target.value)} /></div>
                {newFamilyName && (
                  <div style={{ background:'rgba(255,255,255,.05)', borderRadius:'12px', padding:'10px 14px' }}>
                    <p style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', margin:'0 0 4px' }}>קוד הזמנה שייווצר:</p>
                    <p style={{ color:'white', fontSize:'16px', fontWeight:800, letterSpacing:'2px', margin:0 }}>{newFamilyName.replace(/\s+/g,'').toUpperCase().slice(0,8)}26</p>
                  </div>
                )}
                <button onClick={createFamily} disabled={saving==='add'||!newFamilyName.trim()} style={{ width:'100%', padding:'13px', background:'#F07A55', border:'none', borderRadius:'14px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif', opacity:(saving==='add'||!newFamilyName.trim())?0.5:1 }}>{saving==='add'?'יוצר...':'👨‍👩‍👧‍👦 צור משפחה חדשה'}</button>
              </div>
            )}
          </div>
        )}

        {/* FAMILY SETTINGS */}
        <p style={sec}>הגדרות משפחה נוכחית</p>
        <div style={box}>
          {!isAdmin && <div style={{ background:'rgba(255,255,255,.05)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', color:'rgba(255,255,255,.4)', fontSize:'13px' }}>🔒 רק מנהל המשפחה יכול לשנות פרטים אלה</div>}
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div><label style={lbl}>שם המשפחה</label><input style={{ ...inp, opacity:isAdmin?1:0.5 }} value={familyName} onChange={e=>setFamilyName(e.target.value)} disabled={!isAdmin} /></div>
            <div>
              <label style={lbl}>קוד הזמנה</label>
              <input style={{ ...inp, letterSpacing:'3px', fontWeight:700, fontSize:'17px', opacity:isAdmin?1:0.5 }} value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} maxLength={10} disabled={!isAdmin} />
              <p style={{ color:'rgba(255,255,255,.3)', fontSize:'11px', marginTop:'6px' }}>שתף קוד זה עם בני המשפחה</p>
            </div>
          </div>
          {isAdmin && <button onClick={saveFamily} disabled={saving==='family'} style={{ width:'100%', padding:'13px', background:'#4A82D4', border:'none', borderRadius:'14px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', marginTop:'14px', fontFamily:'Heebo, sans-serif', opacity:saving==='family'?0.7:1 }}>{saving==='family'?'שומר...':'✓ שמור פרטי משפחה'}</button>}
        </div>

        {/* MANAGE */}
        <p style={sec}>ניהול</p>
        <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'20px', overflow:'hidden', marginBottom:'16px' }}>
          <button onClick={()=>router.push('/members')} style={{ width:'100%', padding:'16px', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(74,130,212,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>👥</div>
            <span style={{ flex:1, color:'white', fontSize:'14px', fontWeight:600, textAlign:'right' }}>עריכת בני המשפחה</span>
            <span style={{ color:'rgba(255,255,255,.2)', fontSize:'18px' }}>‹</span>
          </button>
          <button onClick={()=>{navigator.clipboard?.writeText(inviteCode);showSuccess(`קוד ${inviteCode} הועתק! ✓`)}} style={{ width:'100%', padding:'16px', background:'transparent', border:'none', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(78,155,106,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📨</div>
            <div style={{ flex:1, textAlign:'right' }}><div style={{ color:'white', fontSize:'14px', fontWeight:600 }}>קוד הזמנה</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:'12px', marginTop:'2px' }}>{inviteCode} · לחץ להעתקה</div></div>
          </button>
        </div>

        <button onClick={signOut} style={{ width:'100%', padding:'14px', background:'transparent', border:'1.5px solid rgba(224,101,95,.3)', borderRadius:'16px', color:'#E0655F', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>🚪 התנתקות</button>
        <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,.15)', marginTop:'20px' }}>סדר בסדר v1.0 · עם ❤️ למשפחות ישראל</p>
      </div>
    </div>
  )
}
