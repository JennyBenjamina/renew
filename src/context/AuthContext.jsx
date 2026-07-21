import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

/* Wraps Supabase Auth. Tracks the session, loads the user's profile (which
 * holds their role), and exposes sign in / sign up / sign out. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(sessionUser) {
    if (!sessionUser) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .maybeSingle()
    setProfile(data ?? null)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null
      setUser(u)
      await loadProfile(u)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      await loadProfile(u)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Add your keys to .env.')
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  /** Register a customer. Profile fields are passed as auth metadata; a DB
   *  trigger creates the profiles row (role 'customer') from them. Returns
   *  { needsConfirmation } so the UI can prompt for email confirmation. */
  const signUp = async ({ email, password, ...meta }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Add your keys to .env.')
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  }

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
  }

  /** Send a password-reset email. The link lands on /reset-password. */
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Add your keys to .env.')
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }

  /** Set a new password for the currently-authenticated (recovery) session. */
  const updatePassword = async (password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Add your keys to .env.')
    }
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  const refreshProfile = () => loadProfile(user)

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin: profile?.role === 'admin',
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
