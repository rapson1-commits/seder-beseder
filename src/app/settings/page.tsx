'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SettingsPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Profile
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  // Family
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, phone, family_id, is_admin')
      .eq('id', user.id)
      .single()

    if (profile) {
      setFullName(profile.full_name || '')
      setPhone(profile.phone || '')
      setIsAdmin(profile.is_admin || false)
      if (profile.family_id) {
        setFamilyId(profile.family_id)
        const { data: family } = await supabase
          .from('families')
          .select('name, invite_code')
          .eq('id', profile.family_id)
          .single()
        if (family) {
          setFamilyName(family.name || '')
          setInviteCode(family.invite_code || '')
        }
      }
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving('profile'); setSuccess(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id)
    setSaving(null); showSuccess('הפרופיל עודכן! ✓')
  }

  async function saveFamily() {
    if (!isAdmin) return
    setSaving('family'); setSuccess(null)
    await supabase.from('families')
      .update({ name: familyName, invite_code: inviteCode.toUpperCase() })
      .eq('id', familyId)
    setSaving(null); showSuccess('פרטי המשפחה עודכנו! ✓')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function showSuccess(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,.07)',
    border: '1.5px solid rgba(255,255,255,.12)',
    borderRadius: '14px',
    fontSize: '15px',
    fontFamily: 'Heebo, sans-serif',
    direction: 'rtl' as const,
    color: 'white',
    outline: 'none',
  }

  const labelStyle = {
    display: 'block',
    color: 'rgba(255,255,255,.45)',
    fontSize: '12px',
    fontWeight: 700,
    marginBottom: '6px',
    letterSpacing: '.3px',
  }

  const sectionTitle = {
    color: 'rgba(255,255,255,.35)',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '10px',
    marginTop: '4px',
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white', fontSize:'16px' }}>טוען...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#192542', fontFamily:'Heebo, sans-serif', direction:'rtl' }}>

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#192542,#1e3a6e)', padding:'52px 20px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:'430px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => router.push('/home')} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:'12px', width:'36px', height:'36px', color:'white', fontSize:'18px', cursor:'pointer' }}>→</button>
          <h1 style={{ color:'white', fontSize:'20px', fontWeight:800 }}>הגדרות</h1>
          <div style={{ width:'36px' }} />
        </div>
      </div>

      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'20px 16px 100px' }}>

        {/* Success message */}
        {success && (
          <div style={{ background:'rgba(78,155,106,.2)', border:'1px solid rgba(78,155,106,.4)', borderRadius:'14px', padding:'12px 16px', marginBottom:'16px', color:'#7fdeaa', fontSize:'14px', fontWeight:700, textAlign:'center' }}>
            {success}
          </div>
        )}

        {/* ── PROFILE ── */}
        <p style={sectionTitle}>פרופיל אישי</p>
        <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'20px', padding:'16px', marginBottom:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'16px' }}>
            <div style={{ width:'56px', height:'56px', borderRadius:'18px', background:'#F07A55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:900, color:'white', flexShrink:0 }}>
              {fullName ? fullName[0] : '?'}
            </div>
            <div>
              <div style={{ color:'white', fontSize:'16px', fontWeight:800 }}>{fullName || 'המשתמש שלי'}</div>
              <div style={{ color:'rgba(255,255,255,.4)', fontSize:'12px', marginTop:'2px' }}>{isAdmin ? '👑 מנהל משפחה' : 'חבר משפחה'}</div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div>
              <label style={labelStyle}>שם מלא</label>
              <input style={inputStyle} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="השם שלך" />
            </div>
            <div>
              <label style={labelStyle}>טלפון</label>
              <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="052-0000000" type="tel" />
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving === 'profile'}
            style={{ width:'100%', padding:'13px', background:'#F07A55', border:'none', borderRadius:'14px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', marginTop:'14px', fontFamily:'Heebo, sans-serif', opacity: saving === 'profile' ? 0.7 : 1, boxShadow:'0 4px 16px rgba(240,122,85,.3)' }}>
            {saving === 'profile' ? 'שומר...' : '✓ שמור פרופיל'}
          </button>
        </div>

        {/* ── FAMILY ── */}
        <p style={sectionTitle}>פרטי המשפחה</p>
        <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'20px', padding:'16px', marginBottom:'16px' }}>
          {!isAdmin && (
            <div style={{ background:'rgba(255,255,255,.05)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px', color:'rgba(255,255,255,.4)', fontSize:'13px' }}>
              🔒 רק מנהל המשפחה יכול לשנות פרטים אלה
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div>
              <label style={labelStyle}>שם המשפחה</label>
              <input
                style={{ ...inputStyle, opacity: isAdmin ? 1 : 0.5 }}
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                placeholder="משפחת לוי"
                disabled={!isAdmin}
              />
            </div>
            <div>
              <label style={labelStyle}>קוד הזמנה</label>
              <div style={{ position:'relative' }}>
                <input
                  style={{ ...inputStyle, letterSpacing:'3px', fontWeight:700, fontSize:'17px', opacity: isAdmin ? 1 : 0.5 }}
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="LEVI2025"
                  maxLength={10}
                  disabled={!isAdmin}
                />
              </div>
              <p style={{ color:'rgba(255,255,255,.3)', fontSize:'11px', marginTop:'6px', fontWeight:500 }}>
                שתף קוד זה עם בני המשפחה כדי שיוכלו להצטרף
              </p>
            </div>
          </div>

          {isAdmin && (
            <button
              onClick={saveFamily}
              disabled={saving === 'family'}
              style={{ width:'100%', padding:'13px', background:'#4A82D4', border:'none', borderRadius:'14px', color:'white', fontSize:'14px', fontWeight:700, cursor:'pointer', marginTop:'14px', fontFamily:'Heebo, sans-serif', opacity: saving === 'family' ? 0.7 : 1, boxShadow:'0 4px 16px rgba(74,130,212,.3)' }}>
              {saving === 'family' ? 'שומר...' : '✓ שמור פרטי משפחה'}
            </button>
          )}
        </div>

        {/* ── MEMBERS ── */}
        <p style={sectionTitle}>ניהול</p>
        <div style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.08)', borderRadius:'20px', overflow:'hidden', marginBottom:'16px' }}>
          <button
            onClick={() => router.push('/members')}
            style={{ width:'100%', padding:'16px', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,.06)', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(74,130,212,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>👥</div>
            <span style={{ flex:1, color:'white', fontSize:'14px', fontWeight:600, textAlign:'right' }}>עריכת בני המשפחה</span>
            <span style={{ color:'rgba(255,255,255,.2)', fontSize:'18px' }}>‹</span>
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(inviteCode)
              showSuccess(`קוד ${inviteCode} הועתק! ✓`)
            }}
            style={{ width:'100%', padding:'16px', background:'transparent', border:'none', display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(78,155,106,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>📨</div>
            <div style={{ flex:1, textAlign:'right' }}>
              <div style={{ color:'white', fontSize:'14px', fontWeight:600 }}>קוד הזמנה</div>
              <div style={{ color:'rgba(255,255,255,.4)', fontSize:'12px', marginTop:'2px' }}>{inviteCode} · לחץ להעתקה</div>
            </div>
          </button>
        </div>

        {/* ── SIGN OUT ── */}
        <button
          onClick={signOut}
          style={{ width:'100%', padding:'14px', background:'transparent', border:'1.5px solid rgba(224,101,95,.3)', borderRadius:'16px', color:'#E0655F', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
          🚪 התנתקות
        </button>

        <p style={{ textAlign:'center', fontSize:'11px', color:'rgba(255,255,255,.15)', marginTop:'20px' }}>
          סדר בסדר v1.0 · עם ❤️ למשפחות ישראל
        </p>
      </div>
    </div>
  )
}
