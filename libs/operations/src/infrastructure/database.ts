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
        is_active: boolean
        name: string
        organization_id: string
      }>
      daily_trips: {
        Row: {
          change_reason: string | null
          created_at: string
          customer_id: string
          departure_time: string
          direction: string
          driver_id: string
          id: string
          is_cancelled: boolean
          is_done: boolean
          is_extra: boolean
          notes: string | null
          organization_id: string
          route_id: string | null
          service_date: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          customer_id: string
          departure_time: string
          direction: string
          driver_id: string
          id?: string
          is_cancelled?: boolean
          is_done?: boolean
          is_extra?: boolean
          notes?: string | null
          organization_id: string
          route_id?: string | null
          service_date: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          customer_id?: string
          departure_time?: string
          direction?: string
          driver_id?: string
          id?: string
          is_cancelled?: boolean
          is_done?: boolean
          is_extra?: boolean
          notes?: string | null
          organization_id?: string
          route_id?: string | null
          service_date?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: []
      }
      drivers: ReadOnlyTable<{
        full_name: string
        id: string
        is_active: boolean
        organization_id: string
      }>
      operations_settings: ReadOnlyTable<{
        created_at: string
        organization_id: string
        trip_recording: string
        updated_at: string
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
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      routes: ReadOnlyTable<{
        customer_id: string
        driver_id: string
        id: string
        is_active: boolean
        name: string
        organization_id: string
        vehicle_id: string | null
      }>
      vehicles: ReadOnlyTable<{
        id: string
        is_active: boolean
        organization_id: string
        ownership: string
        plate_number: string
      }>
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      prepare_daily_trips: {
        Args: { p_organization_id: string; p_service_date: string }
        Returns: undefined
      }
      set_trip_recording: {
        Args: { p_organization_id: string; p_trip_recording: string }
        Returns: undefined
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
