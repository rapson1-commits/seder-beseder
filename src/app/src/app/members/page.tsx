'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Member {
  id: string
  full_name: string
  phone?: string
  family_side?: string
  relationship?: string
  notes?: string
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('family_id')
      .eq('id', user.id)
      .single()

    if (!profile?.family_id) { router.push('/setup'); return }
    setFamilyId(profile.family_id)

    const { data } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', profile.family_id)
      .order('full_name')

    setMembers(data || [])
    setLoading(false)
  }

  async function deleteMember(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return
    await supabase.from('family_members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const sideColors: Record<string, string> = {
    'צד אבא': '#4A82D4',
    'צד אמא': '#E0655F',
    'בן/בת זוג': '#4E9B6A',
  }

  const avatarColors = ['#4A82D4','#4E9B6A','#F07A55','#C99A2E','#E0655F','#9B59B6']

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
          <h1 style={{ color:'white', fontSize:'20px', fontWeight:800 }}>בני המשפחה</h1>
          <button
            onClick={() => router.push('/members/new')}
            style={{ background:'#F07A55', border:'none', borderRadius:'12px', width:'36px', height:'36px', color:'white', fontSize:'22px', cursor:'pointer', fontWeight:'bold' }}>+</button>
        </div>
      </div>

      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'16px 16px 100px' }}>
        {/* Stats */}
        <div style={{ background:'rgba(255,255,255,.06)', borderRadius:'16px', padding:'14px 20px', marginBottom:'16px', display:'flex', justifyContent:'space-between' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{members.length}</div>
            <div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginTop:'2px' }}>סה"כ</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{members.filter(m=>m.family_side==='צד אבא').length}</div>
            <div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginTop:'2px' }}>צד אבא</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{members.filter(m=>m.family_side==='צד אמא').length}</div>
            <div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px', marginTop:'2px' }}>צד אמא</div>
          </div>
        </div>

        {/* Members list */}
        {members.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,.4)' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>👥</div>
            <p style={{ fontSize:'16px', fontWeight:600 }}>אין בני משפחה עדיין</p>
            <p style={{ fontSize:'13px', marginTop:'6px' }}>לחץ + כדי להוסיף</p>
          </div>
        ) : members.map((member, i) => {
          const initials = member.full_name?.split(' ').map(n=>n[0]).join('').slice(0,2) || '?'
          const color = avatarColors[i % avatarColors.length]
          const sideColor = sideColors[member.family_side || ''] || '#888'
          return (
            <div key={member.id} style={{ background:'rgba(255,255,255,.06)', borderRadius:'16px', padding:'14px 16px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px', border:'1px solid rgba(255,255,255,.08)' }}>
              {/* Avatar */}
              <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:'white', flexShrink:0 }}>
                {initials}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'white', fontSize:'15px', fontWeight:700 }}>{member.full_name}</div>
                <div style={{ display:'flex', gap:'6px', marginTop:'4px', flexWrap:'wrap' }}>
                  {member.family_side && (
                    <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'100px', background:`${sideColor}22`, color:sideColor }}>
                      {member.family_side}
                    </span>
                  )}
                  {member.phone && (
                    <span style={{ fontSize:'11px', color:'rgba(255,255,255,.4)' }}>{member.phone}</span>
                  )}
                </div>
              </div>
              {/* Actions */}
              <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                <button
                  onClick={() => router.push(`/members/${member.id}/edit`)}
                  style={{ background:'rgba(74,130,212,.2)', border:'none', borderRadius:'10px', width:'34px', height:'34px', color:'#4A82D4', fontSize:'16px', cursor:'pointer' }}>✏️</button>
                <button
                  onClick={() => deleteMember(member.id, member.full_name)}
                  style={{ background:'rgba(224,101,95,.15)', border:'none', borderRadius:'10px', width:'34px', height:'34px', color:'#E0655F', fontSize:'16px', cursor:'pointer' }}>🗑️</button>
              </div>
            </div>
          )
        })}

        {/* Add button */}
        <button
          onClick={() => router.push('/members/new')}
          style={{ width:'100%', padding:'14px', background:'#F07A55', border:'none', borderRadius:'16px', color:'white', fontSize:'15px', fontWeight:700, cursor:'pointer', marginTop:'8px', boxShadow:'0 6px 20px rgba(240,122,85,.35)' }}>
          + הוסף בן/בת משפחה
        </button>
      </div>
    </div>
  )
}
