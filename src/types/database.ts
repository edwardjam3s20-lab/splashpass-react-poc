// Hand-written types matching the existing Supabase schema.
// (Can later be regenerated with `supabase gen types typescript` once the
// Supabase CLI is wired into this project — these are accurate by hand for now.)

export interface WashPointExtra {
  id: string
  wash_point_id: string
  name: string
  price: number
  description?: string | null
  service_type?: 'addon' | 'premium_service' | null
}

export interface WashPointRow {
  id: string
  name: string
  area: string
  lat: string | number
  lng: string | number
  description: string | null
  image_url: string | null
  status: 'open' | 'paused' | null
  commission_tier: number | null
  opens_at: string | null
  closes_at: string | null
}

// Shape used throughout the app once raw rows are normalized
export interface WashPoint {
  id: string
  name: string
  area: string
  lat: number
  lng: number
  description: string | null
  image_url: string | null
  status: 'open' | 'paused'
  services: WashPointExtra[]
  commission_tier: number
  opens_at: string
  closes_at: string
  /** populated client-side once we know the user's location */
  dist?: number
}

export interface Profile {
  id?: string
  email: string
  name: string
  phone: string | null
  created_at: string
  sub_status: 'trial' | 'pending' | 'active' | null
  sub_plan?: string | null
  sub_plan_name?: string | null
  sub_car_limit?: number | null
  sub_start?: string | null
  loyalty_points?: number | null
  loyalty_tier?: string | null
  wallet_balance?: number | null
  /** present only transiently in RPC responses — always stripped before storing */
  password?: string
  role?: 'customer' | 'operator'
  email_verified?: boolean
  phone_verified?: boolean
}

export interface Car {
  id: string
  user_email: string
  plate: string
  car_type: string
  make: string
  model: string
  colour?: string
  created_at?: string
}

export interface Booking {
  id: string
  user_email: string
  user_name: string
  user_phone?: string | null
  date: string
  time: string
  location: string
  status: 'pending' | 'accepted' | 'rejected' | 'confirmed' | 'completed' | 'cancelled'
  car_plate: string
  car_type: string
  car_make: string
  car_model: string
  service_name: string
  wash_price: number
  app_fee: number
  total_amount: number
  operator_amount: number
  splash_commission: number
  commission_tier: number
  booking_type: 'trial' | 'subscription'
  booking_code: string
  payment_status?: 'pending' | 'paid'
  accepted_at?: string | null
  rejected_at?: string | null
  rejection_reason?: string | null
  created_at?: string
}

export interface OperatorStatus {
  wash_point: string
  status: 'open' | 'paused'
}

export interface LoyaltyStatus {
  points: number
  tier: string
}

export interface SubPlan {
  id: string
  name: string
  price: number
  billing: 'week' | 'month'
  car_limit: number
  icon: string
  tagline: string
  popular: boolean
}

// Placeholder until generated types are wired in via the Supabase CLI
export type Database = Record<string, never>
