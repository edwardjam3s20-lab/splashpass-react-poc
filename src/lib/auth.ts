import { supabase } from './supabase'
import type { Profile } from '../types/database'

export class AuthError extends Error {}

/**
 * Verifies credentials server-side via the `verify_password` RPC
 * (pgcrypto-based — the password hash never leaves Postgres).
 * Mirrors the original app's `login()`.
 */
export async function loginWithEmail(email: string, password: string): Promise<Profile> {
  const { data, error } = await supabase.rpc('verify_password', {
    p_email: email.trim().toLowerCase(),
    p_password: password,
  })

  if (error) throw new AuthError('Something went wrong. Please try again.')
  if (!data || data.length === 0) throw new AuthError('Invalid email or password.')

  const user = data[0] as Profile & { role?: string; password?: string }
  if (user.role === 'operator') throw new AuthError('Use the operator app.')

  // Never cache the password hash locally
  delete user.password
  return user
}

export async function getUserByEmail(email: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * Registers a new customer. Mirrors the original app's `register()`:
 * hash the password server-side via pgcrypto, then insert the profile row.
 */
export async function registerWithEmail(email: string, password: string): Promise<Profile> {
  const normalizedEmail = email.trim().toLowerCase()

  const existing = await getUserByEmail(normalizedEmail)
  if (existing) throw new AuthError('Account already exists.')

  const { data: hashedPassword, error: hashError } = await supabase.rpc('hash_password', {
    p_password: password,
  })
  if (hashError || !hashedPassword) throw new AuthError('Password hashing failed.')

  const tempName = normalizedEmail.split('@')[0]
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      name: tempName,
      email: normalizedEmail,
      phone: '',
      password: hashedPassword,
      role: 'customer',
      sub_status: 'trial',
      plan: null,
      sub_start: null,
      loyalty_points: 0,
      loyalty_tier: 'Bronze',
    })
    .select()

  if (error || !data?.[0]) throw new AuthError('Something went wrong. Please try again.')

  const newUser = data[0] as Profile & { password?: string }
  delete newUser.password
  return newUser
}

export async function updateProfile(email: string, updates: Partial<Profile>): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('email', email)
  if (error) throw error
}

/**
 * Verifies the current password and sets a new one, all server-side via the
 * change_password RPC (pgcrypto). Returns false if the current password was
 * wrong, mirrors the original's changePassword().
 */
export async function changePassword(
  email: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('change_password', {
    p_email: email,
    p_old: oldPassword,
    p_new: newPassword,
  })
  if (error) throw new AuthError('Error updating password.')
  return Boolean(data)
}

export async function verifyPasswordOnly(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('verify_password_only', {
    p_email: email,
    p_password: password,
  })
  if (error) return false
  return Boolean(data)
}

/**
 * Anonymises the user's bookings (retained for legal compliance) then
 * deletes their profile row. Mirrors deleteAccount() exactly — cars are
 * intentionally NOT deleted here, matching the original's behaviour.
 */
export async function deleteAccount(email: string): Promise<void> {
  await supabase
    .from('bookings')
    .update({ user_email: 'deleted@splashpass.site', user_name: 'Deleted User' })
    .eq('user_email', email)

  const { error } = await supabase.from('profiles').delete().eq('email', email)
  if (error) throw error
}
