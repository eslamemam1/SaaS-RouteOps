export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string };
        Insert: { name: string };
        Update: { name?: string };
        Relationships: [];
      };
      organization_memberships: {
        Row: { organization_id: string; user_id: string };
        Insert: { organization_id: string; user_id: string };
        Update: { organization_id?: string; user_id?: string };
        Relationships: [];
      };
      platform_operators: {
        Row: { user_id: string };
        Insert: { user_id: string };
        Update: { user_id?: string };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
