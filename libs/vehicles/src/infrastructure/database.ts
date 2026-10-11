export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type ReadOnlyTable<Row> = {
  Row: Row
  Insert: never
  Update: never
  Relationships: []
}

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      customers: ReadOnlyTable<{
        id: string
        name: string
        organization_id: string
      }>
      drivers: ReadOnlyTable<{
        full_name: string
        id: string
        organization_id: string
      }>
      routes: ReadOnlyTable<{
        customer_id: string
        driver_id: string | null
        id: string
        is_active: boolean
        name: string
        organization_id: string
        outbound_time: string | null
        return_time: string | null
        vehicle_id: string | null
      }>
      organization_memberships: {
        Row: {
          created_at: string
          organization_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          currency: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          license_expires_on: string | null
          model: string | null
          model_year: number | null
          monthly_rent: number | null
          notes: string | null
          organization_id: string
          owner_name: string | null
          outbound_rent: number | null
          owner_phone: string | null
          ownership: string
          plate_number: string
          rent_type: string
          return_rent: number | null
          seats: number | null
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_expires_on?: string | null
          model?: string | null
          model_year?: number | null
          monthly_rent?: number | null
          notes?: string | null
          organization_id: string
          outbound_rent?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          ownership?: string
          plate_number: string
          rent_type?: string
          return_rent?: number | null
          seats?: number | null
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          license_expires_on?: string | null
          model?: string | null
          model_year?: number | null
          monthly_rent?: number | null
          notes?: string | null
          organization_id?: string
          outbound_rent?: number | null
          owner_name?: string | null
          owner_phone?: string | null
          ownership?: string
          plate_number?: string
          rent_type?: string
          return_rent?: number | null
          seats?: number | null
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      trip_log: {
        Args: {
          p_organization_id: string
          p_from: string
          p_to: string
          p_today: string
          p_driver_id?: string
          p_vehicle_id?: string
        }
        Returns: {
          id: string
          service_date: string
          departure_time: string
          direction: string
          customer_id: string
          route_id: string | null
          vehicle_id: string | null
          driver_id: string
          planned_driver_id: string | null
          is_extra: boolean
          status: string
          change_reason: string | null
          notes: string | null
          price: number | null
        }[]
      }
      vehicle_pay: {
        Args: {
          p_organization_id: string
          p_from: string
          p_to: string
          p_today: string
        }
        Returns: {
          vehicle_id: string
          ownership: string
          rent_type: string
          monthly_rent: number | null
          outbound_rent: number | null
          return_rent: number | null
          done_outbound: number
          done_return: number
          recorded: number
        }[]
      }
      expense_totals: {
        Args: { p_organization_id: string; p_from: string; p_to: string }
        Returns: {
          category: string
          vehicle_id: string | null
          driver_id: string | null
          total: number
        }[]
      }
      unopened_days: {
        Args: { p_organization_id: string; p_from: string; p_to: string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
