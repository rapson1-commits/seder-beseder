'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthCtx {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  loading: true,
  signInWithEmail: async () => ({ error: null }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('[Auth] Initializing...')

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Session on load:', session?.user?.email ?? 'none')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] State change:', event, session?.user?.email ?? 'none')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email: string): Promise<{ error: string | null }> {
    console.log('[Auth] Sending magic link to:', email)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/home` },
    })
    if (error) {
      console.error('[Auth] Magic link error:', error.message)
      return { error: error.message }
    }
    console.log('[Auth] Magic link sent successfully')
    return { error: null }
  }

  async function signOut() {
    console.log('[Auth] Signing out...')
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
