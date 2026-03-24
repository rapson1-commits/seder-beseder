'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useFamily } from '@/hooks/useFamily'
import { avatarColor } from '@/lib/utils'
import type { FamilyMember } from '@/types'
import BottomNav from '@/components/layout/BottomNav'

const SIDE_COLOR: Record<string, string> = {
  'אבא':        '#4A82D4',
  'אמא':        '#E0655F',
  'בן/בת זוג': '#4E9B6A',
}

export default function MembersPage() {
  const router = useRouter()
  const { familyId, loading } = useFamily()
  const [members, setMembers] = useState<FamilyMember[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (loading || !familyId) return

    supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('first_name')
      .then(({ data }) => {
        setMembers((data ?? []) as FamilyMember[])
        setDataLoading(false)
      })
  }, [familyId, loading])

  async function deleteMember(id: string, name: string) {
    if (!confirm(`למחוק את ${name}?`)) return
    await supabase.from('family_members').update({ is_active: false }).eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  if (loading || dataLoading) return (
    <div style={{ minHeight:'100vh', background:'#192542', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'white' }}>טוען...</div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#192542', fontFamily:'Heebo, sans-serif', direction:'rtl' }}>
      <div style={{ background:'linear-gradient(135deg,#192542,#1e3a6e)', padding:'52px 20px 20px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:'430px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => router.push('/home')} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:'12px', width:'36px', height:'36px', color:'white', fontSize:'18px', cursor:'pointer' }}>→</button>
          <h1 style={{ color:'white', fontSize:'20px', fontWeight:800 }}>בני המשפחה</h1>
          <button onClick={() => router.push('/members/new')} style={{ background:'#F07A55', border:'none', borderRadius:'12px', width:'36px', height:'36px', color:'white', fontSize:'22px', cursor:'pointer' }}>+</button>
        </div>
      </div>

      <div style={{ maxWidth:'430px', margin:'0 auto', padding:'16px 16px 100px' }}>
        {/* Stats */}
        <div style={{ background:'rgba(255,255,255,.06)', borderRadius:'16px', padding:'14px 20px', marginBottom:'16px', display:'flex', justifyContent:'space-around' }}>
          <div style={{ textAlign:'center' }}><div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{members.length}</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px' }}>סה&quot;כ</div></div>
          <div style={{ textAlign:'center' }}><div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{members.filter(m => m.side_of_family === 'אבא').length}</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px' }}>צד אבא</div></div>
          <div style={{ textAlign:'center' }}><div style={{ color:'white', fontSize:'22px', fontWeight:900 }}>{members.filter(m => m.side_of_family === 'אמא').length}</div><div style={{ color:'rgba(255,255,255,.4)', fontSize:'11px' }}>צד אמא</div></div>
        </div>

        {members.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px 20px', color:'rgba(255,255,255,.4)' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>👥</div>
            <p style={{ fontSize:'16px', fontWeight:600 }}>אין בני משפחה עדיין</p>
          </div>
        ) : members.map((m, i) => {
          const initials = [m.first_name?.[0], m.last_name?.[0]].filter(Boolean).join('') || '?'
          const sc = m.side_of_family ? (SIDE_COLOR[m.side_of_family] ?? '#888') : '#888'
          return (
            <div key={m.id} style={{ background:'rgba(255,255,255,.06)', borderRadius:'16px', padding:'14px 16px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'12px', border:'1px solid rgba(255,255,255,.08)' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:avatarColor(i), display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:800, color:'white', flexShrink:0 }}>{initials}</div>
              <div style={{ flex:1 }}>
                <div style={{ color:'white', fontSize:'15px', fontWeight:700 }}>{m.first_name} {m.last_name}</div>
                <div style={{ display:'flex', gap:'6px', marginTop:'4px', flexWrap:'wrap' }}>
                  {m.side_of_family && <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 8px', borderRadius:'100px', background:`${sc}22`, color:sc }}>{m.side_of_family}</span>}
                  {m.phone && <span style={{ fontSize:'11px', color:'rgba(255,255,255,.4)' }}>{m.phone}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', flexShrink:0 }}>
                <button onClick={() => router.push(`/members/${m.id}/edit`)} style={{ background:'rgba(74,130,212,.2)', border:'none', borderRadius:'10px', width:'34px', height:'34px', color:'#4A82D4', fontSize:'16px', cursor:'pointer' }}>✏️</button>
                <button onClick={() => deleteMember(m.id, m.first_name)} style={{ background:'rgba(224,101,95,.15)', border:'none', borderRadius:'10px', width:'34px', height:'34px', color:'#E0655F', fontSize:'16px', cursor:'pointer' }}>🗑️</button>
              </div>
            </div>
          )
        })}

        <button onClick={() => router.push('/members/new')}
          style={{ width:'100%', padding:'14px', background:'#F07A55', border:'none', borderRadius:'16px', color:'white', fontSize:'15px', fontWeight:700, cursor:'pointer', marginTop:'8px', fontFamily:'Heebo, sans-serif' }}>
          + הוסף בן/בת משפחה
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
