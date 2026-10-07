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
      drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          license_expires_on: string | null
          license_number: string | null
          monthly_salary: number | null
          national_id: string | null
          notes: string | null
          organization_id: string
          outbound_pay: number | null
          pay_type: string
          phone: string | null
          return_pay: number | null
          salary_trips: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          license_expires_on?: string | null
          license_number?: string | null
          monthly_salary?: number | null
          national_id?: string | null
          notes?: string | null
          organization_id: string
          outbound_pay?: number | null
          pay_type?: string
          phone?: string | null
          return_pay?: number | null
          salary_trips?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          license_expires_on?: string | null
          license_number?: string | null
          monthly_salary?: number | null
          national_id?: string | null
          notes?: string | null
          organization_id?: string
          outbound_pay?: number | null
          pay_type?: string
          phone?: string | null
          return_pay?: number | null
          salary_trips?: number | null
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
          currency: string
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
