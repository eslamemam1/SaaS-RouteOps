export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          license_expires_on: string | null
          license_number: string | null
          national_id: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          license_expires_on?: string | null
          license_number?: string | null
          national_id?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          license_expires_on?: string | null
          license_number?: string | null
          national_id?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      routes: {
        Row: {
          created_at: string
          customer_id: string
          driver_id: string | null
          end_point: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          operating_days: number[]
          organization_id: string
          outbound_time: string | null
          return_time: string | null
          start_point: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          driver_id?: string | null
          end_point: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          operating_days: number[]
          organization_id: string
          outbound_time?: string | null
          return_time?: string | null
          start_point: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          driver_id?: string | null
          end_point?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          operating_days?: number[]
          organization_id?: string
          outbound_time?: string | null
          return_time?: string | null
          start_point?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          license_expires_on: string | null
          model: string | null
          model_year: number | null
          notes: string | null
          organization_id: string
          plate_number: string
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
          notes?: string | null
          organization_id: string
          plate_number: string
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
          notes?: string | null
          organization_id?: string
          plate_number?: string
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
