import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { authMessage, MESSAGES } from '../lib/errors'
import { purgeCacheIfSynced } from '../lib/journalCache'

const AuthContext = createContext(null)

// Where Supabase sends people back after an email link. Works under /repo-name/ on GitHub Pages.
const returnUrl = () => window.location.href.split('#')[0].split('?')[0]
const fail = (e) => ({ ok: false, message: authMessage(e) })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [recovery, setRecovery] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined
    let live = true
    supabase.auth.getSession()
      .then(({ data }) => { if (live) { setSession(data.session); setLoading(false) } })
      .catch(() => { if (live) setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => { live = false; data.subscription.unsubscribe() }
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    if (!supabase) return { ok: false, message: MESSAGES.config }
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      return error ? fail(error) : { ok: true }
    } catch (e) { return fail(e) }
  }, [])

  const signUp = useCallback(async ({ name, email, password }) => {
    if (!supabase) return { ok: false, message: MESSAGES.config }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: name.trim() ? { full_name: name.trim() } : {}, emailRedirectTo: returnUrl() },
      })
      if (error) return fail(error)
      // With email confirmation on, an existing address comes back as a user with no identities (no error).
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { ok: false, message: authMessage({ code: 'user_already_exists' }) }
      }
      return { ok: true, status: data.session ? 'signed-in' : 'verify' }
    } catch (e) { return fail(e) }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return { ok: true }
    const uid = session && session.user && session.user.id
    try { await supabase.auth.signOut() } catch { /* the local session is cleared either way */ }
    if (uid) purgeCacheIfSynced(uid)
    return { ok: true }
  }, [session])

  const resetPassword = useCallback(async (email) => {
    if (!supabase) return { ok: false, message: MESSAGES.config }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: returnUrl() })
      return error ? fail(error) : { ok: true }
    } catch (e) { return fail(e) }
  }, [])

  const updatePassword = useCallback(async (password) => {
    if (!supabase) return { ok: false, message: MESSAGES.config }
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return fail(error)
      setRecovery(false)
      return { ok: true }
    } catch (e) { return fail(e) }
  }, [])

  const user = session ? session.user : null
  const value = useMemo(() => ({
    user, session, loading, recovery, configured: isSupabaseConfigured,
    displayName: user && user.user_metadata && user.user_metadata.full_name ? user.user_metadata.full_name : '',
    signIn, signUp, signOut, resetPassword, updatePassword,
  }), [user, session, loading, recovery, signIn, signUp, signOut, resetPassword, updatePassword])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.')
  return ctx
}
