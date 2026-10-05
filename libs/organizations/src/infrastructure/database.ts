export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; is_active: boolean };
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
          is_active: boolean;
          created_at: string;
          login_emails: string[];
          last_sign_in_at: string | null;
        }[];
      };
      set_organization_active: {
        Args: { p_organization_id: string; p_is_active: boolean };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
