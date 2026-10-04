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
          owner_name: string | null
          owner_phone: string | null
          ownership: string
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
          owner_name?: string | null
          owner_phone?: string | null
          ownership?: string
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
          owner_name?: string | null
          owner_phone?: string | null
          ownership?: string
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
