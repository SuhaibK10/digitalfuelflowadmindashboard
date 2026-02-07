import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Tank = {
  id: number
  tank_number: string
  fuel_type_id: number
  capacity: number
  current_stock: number
  fuel_types?: { id: number; code: string; name: string; price: number }
}

export type DipReading = {
  id: number
  tank_id: number
  reading_date: string
  opening_dip?: number
  closing_dip?: number
  opening_totalizer?: number
  closing_totalizer?: number
  purchase_qty: number
  status: string
  tanks?: Tank
}

export type FuelToken = {
  id: number
  token_code: string
  quantity: number
  amount: number
  status: string
  created_at: string
  used_at?: string
  fuel_types?: { code: string; name: string }
  token_orders?: { customer_name: string; customer_phone: string }
}
