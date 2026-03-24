'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types'

interface FamilyState {
  familyId: string
  profile: UserProfile
  /** True when the signed-in user has is_admin = true in user_profiles */
  isAdmin: boolean
  loading: boolean
}

/**
 * Centralised auth + family guard.
 *
 * • Redirects to '/'      if the user is not signed in.
 * • Redirects to '/setup' if the user has no family_id yet.
 * • Returns { familyId, profile, loading } once resolved.
 *
 * Replace per-page boilerplate:
 *   const { data: { user } } = await supabase.auth.getUser()
 *   if (!user) { router.push('/'); return }
 *   const { data: profile } = await supabase.from('user_profiles')…
 *   if (!profile?.family_id) { router.push('/setup'); return }
 */
export function useFamily(): FamilyState {
  const router = useRouter()
  const [state, setState] = useState<FamilyState>({
    familyId: '',
    profile: {} as UserProfile,
    isAdmin: false,
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (cancelled) return

      if (!profile?.family_id) { router.push('/setup'); return }

      setState({
        familyId: profile.family_id,
        profile: profile as UserProfile,
        isAdmin: (profile as UserProfile).is_admin ?? false,
        loading: false,
      })
    }

    load()
    return () => { cancelled = true }
  }, [router])

  return state
}
