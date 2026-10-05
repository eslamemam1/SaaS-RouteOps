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
        organization_id: string
        owner_name: string | null
        ownership: string
        plate_number: string
      }>
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      expense_totals: {
        Args: { p_organization_id: string; p_from: string; p_to: string }
        Returns: {
          category: string
          vehicle_id: string | null
          total: number
        }[]
      }
      trip_report: {
        Args: {
          p_organization_id: string
          p_from: string
          p_to: string
          p_today: string
        }
        Returns: {
          customer_id: string
          vehicle_id: string | null
          driver_id: string | null
          done_trips: number
          extra_trips: number
          revenue: number
          unpriced_trips: number
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
