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
    Functions: {
      operator_accounts: {
        Args: Record<string, never>;
        Returns: {
          organization_id: string;
          organization_name: string;
          currency: string;
          created_at: string;
          login_emails: string[];
          last_sign_in_at: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
