export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'premium'
          subscription_status: 'active' | 'cancelled' | 'past_due' | null
          customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium'
          subscription_status?: 'active' | 'cancelled' | 'past_due' | null
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium'
          subscription_status?: 'active' | 'cancelled' | 'past_due' | null
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trip_calculations: {
        Row: {
          id: string
          user_id: string
          type: 'distanceToCost' | 'budgetToDistance'
          distance: number | null
          mileage: number
          fuel_rate: number
          budget: number | null
          fuel_needed: number | null
          total_cost: number | null
          fuel_affordable: number | null
          distance_covered: number | null
          country_code: string
          currency: string
          volume_unit: string
          distance_unit: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'distanceToCost' | 'budgetToDistance'
          distance?: number | null
          mileage: number
          fuel_rate: number
          budget?: number | null
          fuel_needed?: number | null
          total_cost?: number | null
          fuel_affordable?: number | null
          distance_covered?: number | null
          country_code: string
          currency: string
          volume_unit: string
          distance_unit: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'distanceToCost' | 'budgetToDistance'
          distance?: number | null
          mileage?: number
          fuel_rate?: number
          budget?: number | null
          fuel_needed?: number | null
          total_cost?: number | null
          fuel_affordable?: number | null
          distance_covered?: number | null
          country_code?: string
          currency?: string
          volume_unit?: string
          distance_unit?: string
          created_at?: string
        }
      }
      saved_stations: {
        Row: {
          id: string
          user_id: string
          name: string
          brand: string | null
          lat: number
          lon: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          brand?: string | null
          lat: number
          lon: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          brand?: string | null
          lat?: number
          lon?: number
          created_at?: string
        }
      }
      fuel_logs: {
        Row: {
          id: string
          user_id: string
          station_id: string
          filled_at: string
          fuel_type: 'petrol' | 'diesel' | 'electric' | 'hybrid'
          amount: number
          price: number
          currency: string
          mileage: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          station_id: string
          filled_at?: string
          fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid'
          amount: number
          price: number
          currency: string
          mileage?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          station_id?: string
          filled_at?: string
          fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid'
          amount?: number
          price?: number
          currency?: string
          mileage?: number | null
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type TripCalculation = Database['public']['Tables']['trip_calculations']['Row']
export type SavedStation = Database['public']['Tables']['saved_stations']['Row']
export type FuelLog = Database['public']['Tables']['fuel_logs']['Row']

export interface TripCalculationInput {
  type: 'distanceToCost' | 'budgetToDistance'
  distance?: number
  mileage: number
  fuelRate: number
  budget?: number
  countryCode: string
  currency: string
  volumeUnit: string
  distanceUnit: string
}

export interface TripCalculationOutput {
  fuelNeeded?: number
  totalCost?: number
  fuelAffordable?: number
  distance?: number
}