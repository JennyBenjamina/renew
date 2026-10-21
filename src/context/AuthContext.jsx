import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthContext = createContext(null)

/* Wraps Supabase Auth. Tracks the session, loads the user's profile (which
 * holds their role), and exposes sign in / sign up / sign out. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  // Which user the loaded profile belongs to, so access checks wait for the
  // profile after a sign-in instead of briefly treating the user as unapproved.
  const [profileFor, setProfileFor] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(sessionUser) {
    if (!sessionUser) {
      setProfile(null)
      setProfileFor(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .maybeSingle()
    setProfile(data ?? null)
    setProfileFor(sessionUser.id)
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

  /** Register a researcher account. Registration fields and attestations are
   *  passed as auth metadata; a DB trigger validates them and creates the
   *  profiles row with approval_status 'pending'. Returns { needsConfirmation }. */
  const signUp = async ({ email, password, ...meta }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Add your keys to .env.')
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: meta,
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) {
      // Errors raised by the signup validation trigger arrive wrapped.
      if (/database error saving new user/i.test(error.message)) {
        throw new Error(
          'We couldn’t create this account. Enter your institution and confirm every statement.'
        )
      }
      throw error
    }
    // Notify the store owners of the new account (fire-and-forget; the function
    // verifies the account exists before emailing, so it can't be abused).
    fetch('/.netlify/functions/notify-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {})
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

  const isAdmin = profile?.role === 'admin'
  const approvalStatus = isAdmin ? 'approved' : profile?.approval_status || 'pending'

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isAffiliate: profile?.role === 'affiliate',
        // Compliance gate: only admins and accounts an admin approved get in.
        isApproved: approvalStatus === 'approved',
        approvalStatus,
        loading: loading || Boolean(user && profileFor !== user.id),
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
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
