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
      drivers: ReadOnlyTable<{
        full_name: string
        id: string
        is_active: boolean
        organization_id: string
      }>
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          driver_id: string | null
          id: string
          organization_id: string
          spent_on: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          category: string
          description?: string | null
          driver_id?: string | null
          organization_id: string
          spent_on: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          category?: string
          description?: string | null
          driver_id?: string | null
          spent_on?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          organization_id: string
          user_id: string
        }
        Insert: never
        Update: never
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
      organizations: ReadOnlyTable<{
        currency: string
        id: string
        name: string
      }>
      vehicles: ReadOnlyTable<{
        id: string
        is_active: boolean
        organization_id: string
        plate_number: string
      }>
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      driver_pay: {
        Args: {
          p_organization_id: string
          p_from: string
          p_to: string
          p_today: string
        }
        Returns: {
          driver_id: string
          done_trips: number
          monthly_salary: number | null
          trip_pay: number | null
          recorded: number
        }[]
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
