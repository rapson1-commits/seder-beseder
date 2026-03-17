'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface MemberForm {
  full_name: string
  phone: string
  family_side: string
  relationship: string
  notes: string
}

export default function NewMemberPage() {
  const router = useRouter()
  const [form, setForm] = useState<MemberForm>({
    full_name: '',
    phone: '',
    family_side: '',
    relationship: '',
    notes: '',
  })
  const [familyId, setFamilyId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: profile } = await supabase
      .from('user_profiles').select('family_id').eq('id', user.id).single()
    if (!profile?.family_id) { router.push('/setup'); return }
    setFamilyId(profile.family_id)
  }

  async function save() {
    if (!form.full_name.trim()) { setError('שם הוא שדה חובה'); return }
    if (!familyId) return
    setSaving(true); setError('')
    const { error: err } = await supabase
      .from('family_members')
      .insert({ ...form, family_id: familyId })
    if (err) { setError('שגיאה בשמירה, נסה שוב'); setSaving(false); return }
    router.push('/members')
  }

  const inputStyle = {
    width:'100%', padding:'13px 16px',
    background:'rgba(255,255,255,.07)',
    border:'1.5px solid rgba(255,255,255,.12)',
    borderRadius:'14px', fontSize:'15px',
    fontFamily:'Heebo, sans-serif', direction:'rtl' as const,
    color:'white', outline:'none',
  }
  const labelStyle = {
    display:'block', color:'rgba(255,255,255,.5)',
    fontSize:'12px', fontWeight:700, marginBottom:'6px',
  }
  const sides = ['צד אבא','צד אמא','בן/בת זוג','ילד/ה','אחר']

  return (
    <div style={{ minHeight:'100vh', background:'#192542', fontFamily:'Heebo, sans-serif', direction:'rtl' }}>
      <div style={{ background:'linear-gradient(135deg,#192542,#1e3a6e)', padding:'52px 20px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:'430px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => router.push('/members')} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:'12px', width:'36px', height:'36px', color:'white', fontSize:'18px', cursor:'pointer' }}>→</button>
          <h1 style={{ color:'white', fontSize:'20px', fontWeight:800 }}>הוסף בן/בת משפחה</h1>
          <button onClick={save} disabled={saving} style={{ background:'#F07A55', border:'none', borderRadius:'12px', padding:'8px 14px', color:'white', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
            {saving ? '...' : '✓ שמור'}
          </button>
        </div>
      </div>
      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'20px 16px 100px' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ width:'72px', height:'72px', borderRadius:'22px', background:'#F07A55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', fontWeight:900, color:'white', margin:'0 auto' }}>
            {form.full_name ? form.full_name.split(' ').map((n:string)=>n[0]).join('').slice(0,2) : '?'}
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div>
            <label style={labelStyle}>שם מלא *</label>
            <input style={inputStyle} placeholder="לדוגמה: אבי לוי" value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} />
          </div>
          <div>
            <label style={labelStyle}>טלפון</label>
            <input style={inputStyle} placeholder="052-0000000" type="tel" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} />
          </div>
          <div>
            <label style={labelStyle}>צד במשפחה</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {sides.map(side=>(
                <button key={side} onClick={()=>setForm(p=>({...p,family_side:side}))}
                  style={{ padding:'8px 16px', borderRadius:'100px', border:'1.5px solid', borderColor:form.family_side===side?'#F07A55':'rgba(255,255,255,.15)', background:form.family_side===side?'rgba(240,122,85,.2)':'transparent', color:form.family_side===side?'#F07A55':'rgba(255,255,255,.5)', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                  {side}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>קשר (אופציונלי)</label>
            <input style={inputStyle} placeholder="דוד, אחות, בן זוג..." value={form.relationship} onChange={e=>setForm(p=>({...p,relationship:e.target.value}))} />
          </div>
          <div>
            <label style={labelStyle}>הערות (אופציונלי)</label>
            <textarea style={{...inputStyle,height:'90px',resize:'none'}} placeholder="אלרגיות, העדפות..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
          </div>
        </div>
        {error && <div style={{ background:'rgba(224,101,95,.15)', border:'1px solid rgba(224,101,95,.3)', borderRadius:'12px', padding:'12px 16px', marginTop:'16px', color:'#E0655F', fontSize:'13px', fontWeight:600 }}>⚠️ {error}</div>}
        <button onClick={save} disabled={saving} style={{ width:'100%', padding:'15px', background:'#F07A55', border:'none', borderRadius:'16px', color:'white', fontSize:'15px', fontWeight:700, cursor:'pointer', marginTop:'24px', boxShadow:'0 6px 20px rgba(240,122,85,.35)', fontFamily:'Heebo, sans-serif' }}>
          {saving ? 'שומר...' : '+ הוסף למשפחה'}
        </button>
      </div>
    </div>
  )
}
