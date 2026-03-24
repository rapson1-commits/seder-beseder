'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { required, phone as validatePhone, maxLength, validate } from '@/lib/validation'
import type { FamilySide } from '@/types'
import { SIDE_OPTIONS } from '@/types'

type FormFields = 'first_name' | 'phone'

const inp = { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,.07)', border:'1.5px solid rgba(255,255,255,.12)', borderRadius:'14px', fontSize:'15px', fontFamily:'Heebo, sans-serif', direction:'rtl' as const, color:'white', outline:'none' }
const lbl = { display:'block', color:'rgba(255,255,255,.45)', fontSize:'12px', fontWeight:700, marginBottom:'6px' }

export default function EditMemberPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params?.id as string
  const { loading: authLoading } = useFamily()
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', side_of_family: '' as FamilySide | '', notes: '' })
  const [errors, setErrors] = useState<Partial<Record<FormFields, string>>>({})
  const [saving, setSaving] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (authLoading) return
    supabase.from('family_members').select('*').eq('id', memberId).single()
      .then(({ data: member }) => {
        if (member) {
          setForm({
            first_name: member.first_name ?? '',
            last_name: member.last_name ?? '',
            phone: member.phone ?? '',
            side_of_family: (member.side_of_family as FamilySide) ?? '',
            notes: member.notes ?? '',
          })
        }
        setPageLoading(false)
      })
  }, [memberId, authLoading])

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(p => ({ ...p, [key]: value }))
    if (key === 'first_name' || key === 'phone') {
      setErrors(prev => ({ ...prev, [key]: undefined }))
    }
  }

  async function save() {
    const errs = validate<FormFields>([
      ['first_name', required(form.first_name, 'שם פרטי')],
      ['first_name', form.first_name ? maxLength(form.first_name, 50, 'שם פרטי') : null],
      ['phone', validatePhone(form.phone)],
    ])
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true); setServerError('')
    const { error: err } = await supabase.from('family_members').update({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      phone: form.phone.trim() || null,
      side_of_family: form.side_of_family || null,
      notes: form.notes.trim() || null,
    }).eq('id', memberId)
    if (err) { setServerError('שגיאה: ' + err.message); setSaving(false); return }
    router.push('/members')
  }

  const initials = [form.first_name[0], form.last_name[0]].filter(Boolean).join('') || '?'

  if (authLoading || pageLoading) return (
    <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white' }}>טוען...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#192542', fontFamily:'Heebo, sans-serif', direction:'rtl' }}>
      <div style={{ background:'linear-gradient(135deg,#192542,#1e3a6e)', padding:'52px 20px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:'430px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => router.push('/members')} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:'12px', width:'36px', height:'36px', color:'white', fontSize:'18px', cursor:'pointer' }}>→</button>
          <h1 style={{ color:'white', fontSize:'20px', fontWeight:800 }}>עריכת פרטים</h1>
          <button onClick={save} disabled={saving} style={{ background:'#F07A55', border:'none', borderRadius:'12px', padding:'8px 14px', color:'white', fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>{saving ? '...' : '✓ שמור'}</button>
        </div>
      </div>

      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'20px 16px 100px' }}>
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ width:'72px', height:'72px', borderRadius:'22px', background:'#F07A55', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', fontWeight:900, color:'white', margin:'0 auto' }}>{initials}</div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* Name row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div>
              <label style={lbl}>שם פרטי *</label>
              <input style={{ ...inp, borderColor: errors.first_name ? '#E0655F' : 'rgba(255,255,255,.12)' }}
                placeholder="אבי" value={form.first_name}
                onChange={e => set('first_name', e.target.value)} />
              {errors.first_name && <p style={{ color:'#ffb3b0', fontSize:'11px', marginTop:'4px' }}>{errors.first_name}</p>}
            </div>
            <div>
              <label style={lbl}>שם משפחה</label>
              <input style={inp} placeholder="לוי" value={form.last_name}
                onChange={e => set('last_name', e.target.value)} />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label style={lbl}>טלפון</label>
            <input style={{ ...inp, borderColor: errors.phone ? '#E0655F' : 'rgba(255,255,255,.12)' }}
              placeholder="052-0000000" type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value)} />
            {errors.phone && <p style={{ color:'#ffb3b0', fontSize:'11px', marginTop:'4px' }}>{errors.phone}</p>}
          </div>

          {/* Side of family — values match DB CHECK constraint via SIDE_OPTIONS */}
          <div>
            <label style={lbl}>צד במשפחה</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
              {SIDE_OPTIONS.map(({ value, label }) => (
                <button key={value} onClick={() => set('side_of_family', value)}
                  style={{ padding:'8px 16px', borderRadius:'100px', border:'1.5px solid',
                    borderColor: form.side_of_family === value ? '#F07A55' : 'rgba(255,255,255,.15)',
                    background: form.side_of_family === value ? 'rgba(240,122,85,.2)' : 'transparent',
                    color: form.side_of_family === value ? '#F07A55' : 'rgba(255,255,255,.5)',
                    fontSize:'13px', fontWeight:700, cursor:'pointer', fontFamily:'Heebo, sans-serif' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={lbl}>הערות (אופציונלי)</label>
            <textarea style={{ ...inp, height:'80px', resize:'none' }}
              placeholder="אלרגיות, העדפות..." value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        {serverError && (
          <div style={{ background:'rgba(224,101,95,.15)', border:'1px solid rgba(224,101,95,.3)', borderRadius:'12px', padding:'12px 16px', marginTop:'16px', color:'#ffb3b0', fontSize:'13px' }}>
            ⚠️ {serverError}
          </div>
        )}

        <button onClick={save} disabled={saving}
          style={{ width:'100%', padding:'15px', background:'#F07A55', border:'none', borderRadius:'16px', color:'white', fontSize:'15px', fontWeight:700, cursor:'pointer', marginTop:'24px', fontFamily:'Heebo, sans-serif', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'שומר...' : '✓ שמור שינויים'}
        </button>
      </div>
    </div>
  )
}
