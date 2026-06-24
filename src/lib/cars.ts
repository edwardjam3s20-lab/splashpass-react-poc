import { supabase } from './supabase'
import type { Car } from '../types/database'

export async function getCarsByEmail(email: string): Promise<Car[]> {
  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('user_email', email)
    .order('created_at', { ascending: true })

  if (error) return []
  return data as Car[]
}

export async function createCar(car: Omit<Car, 'id' | 'created_at'>): Promise<Car> {
  const { data, error } = await supabase.from('cars').insert(car).select()
  if (error || !data?.[0]) throw error ?? new Error('Failed to save car.')
  return data[0] as Car
}

export async function deleteCarRow(id: string): Promise<void> {
  const { error } = await supabase.from('cars').delete().eq('id', id)
  if (error) throw error
}
