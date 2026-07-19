// src/lib/auth.ts
// Login/register go through splashmain (never directly to Supabase).
// Profile management still hits Supabase directly (no sensitive RPCs needed).

import { supabase } from './supabase'
import { apiFetch } from './tokenRefresh'
import type { Profile } from '../types/database'
export type { Profile } from '../types/database'

const API = import.meta.env.VITE_API_BASE_URL as string

export class AuthError extends Error {}

// Profile type is defined in ../types/database.ts and re-exported from there

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  user?:                  Profile
  pendingToken?:          string
  needsEmailVerification: boolean
  needsPhoneVerification: boolean
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<LoginResult> {
  const res = await fetch(`${API}/api/auth/login`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (!res.ok) throw new AuthError(data.error || 'Login failed.')

  // Fully verified — session cookie set by server
  if (data.ok) {
    return {
      user:                   data.user,
      pendingToken:           undefined,
      needsEmailVerification: false,
      needsPhoneVerification: false,
    }
  }

  // Unverified — return which step to resume
  return {
    user:                   data.user,
    pendingToken:           data.pendingToken,
    needsEmailVerification: !data.emailVerified,
    needsPhoneVerification: data.emailVerified && !data.phoneVerified,
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterResult {
  user:         Profile
  pendingToken: string
}

export async function registerWithEmail(
  name:     string,
  email:    string,
  phone:    string,
  password: string
): Promise<RegisterResult> {
  const res = await fetch(`${API}/api/auth/register`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ name, email, phone, password }),
  })

  const data = await res.json()
  if (!res.ok) throw new AuthError(data.error || 'Registration failed.')

  return { user: data.user, pendingToken: data.pendingToken }
}

// ─── Forgot / reset password ────────────────────────────────────────────────
// Always resolves on a 2xx from /forgot-password — the backend responds
// { ok: true } whether or not the email matches an account, so there's
// nothing to branch on here beyond network/rate-limit failures.

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API}/api/auth/forgot-password`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ email }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AuthError(data.error || 'Could not send reset code.')
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  const res = await fetch(`${API}/api/auth/reset-password`, {
    method:      'POST',
    credentials: 'include',
    headers:     { 'Content-Type': 'application/json' },
    body:        JSON.stringify({ email, code, newPassword }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new AuthError(data.error || 'Could not reset password.')
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, {
    method:      'POST',
    credentials: 'include',
  })
}

// ─── Profile & account management ────────────────────────────────────────────
// Reads still go directly to Supabase. Writes go through SECURITY DEFINER
// RPCs instead of `.update()`/`.delete()` on the raw table — see
// supabase/profile_account_security.sql for why: with only the public
// anon key and no Supabase Auth session, a direct `.update(updates)`
// accepted ANY column for ANY email, which meant a forged request could
// set wallet_balance/loyalty_points/role/sub_status directly. The RPC is
// a hard whitelist of the few fields a user should be able to touch
// about themselves.

export async function updateProfile(email: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase.rpc('update_profile_secure', {
    p_email:   email,
    p_updates: updates,
  })
  if (error) throw error
}

export async function changePassword(
  email: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('change_password', {
    p_email: email,
    p_old:   oldPassword,
    p_new:   newPassword,
  })
  if (error) throw new AuthError('Error updating password.')
  return Boolean(data)
}

export async function verifyPasswordOnly(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_password_only', {
    p_email:    email,
    p_password: password,
  })
  if (error) return false
  return Boolean(data)
}

// Now requires the account password. Previously this deleted any email
// passed to it with zero authentication at all — literally any POST with
// a stranger's email would delete their account. Deleting an account is
// destructive and irreversible, so re-verifying the password (the same
// check the server already does for change_password) is the minimum bar
// here, even though it means DeleteAccountScreen now needs a password
// field it didn't have before.
export async function deleteAccount(email: string, password: string): Promise<void> {
  const { error } = await supabase.rpc('delete_account_secure', {
    p_email:    email,
    p_password: password,
  })
  if (error) throw new AuthError('Incorrect password, or account could not be deleted.')
}

const SPLASHMAIN_BASE = import.meta.env.VITE_SPLASHMAIN_URL || 'https://splashmain.vercel.app'

// Reads the caller's OWN profile via the session cookie rather than
// hitting Supabase directly with an arbitrary email — see
// app/api/customer/profile/route.js in splashmain. The `email` param is
// kept for now to avoid touching every call site, but it's no longer used
// for the actual lookup; the one real caller (useSubscriptionPoll) already
// only ever passes currentUser.email anyway.
export async function getUserByEmail(_email: string): Promise<Profile | null> {
  const res = await apiFetch(`${SPLASHMAIN_BASE}/api/customer/profile`, { credentials: 'include' })
  if (res.status === 404) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || 'Failed to load profile.')
  return (data.profile as Profile) ?? null
}
