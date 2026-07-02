// src/lib/auth.ts
// Login/register go through splashmain (never directly to Supabase).
// Profile management still hits Supabase directly (no sensitive RPCs needed).

import { supabase } from './supabase'

const API = import.meta.env.VITE_API_BASE_URL as string

export class AuthError extends Error {}

export interface Profile {
  id?:             string
  email:           string
  name?:           string
  phone?:          string
  role?:           string
  sub_status?:     string
  loyalty_points?: number
  loyalty_tier?:   string
  email_verified?: boolean
  phone_verified?: boolean
  [key: string]:   unknown
}

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

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutUser(): Promise<void> {
  await fetch(`${API}/api/auth/logout`, {
    method:      'POST',
    credentials: 'include',
  })
}

// ─── Profile & account management ────────────────────────────────────────────
// These go directly to Supabase since they only read/write the profiles table
// with no password hashing or session logic needed.

export async function updateProfile(email: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('email', email)
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

export async function deleteAccount(email: string): Promise<void> {
  await supabase
    .from('bookings')
    .update({ user_email: 'deleted@splashpass.site', user_name: 'Deleted User' })
    .eq('user_email', email)

  const { error } = await supabase.from('profiles').delete().eq('email', email)
  if (error) throw error
}

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()
  if (error) throw error
  if (data) delete data.password
  return data
}
