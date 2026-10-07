export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; currency: string; is_active: boolean };
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
      daily_trips: {
        Row: { organization_id: string; service_date: string; is_cancelled: boolean };
        Insert: never;
        Update: never;
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
      trip_report: {
        Args: {
          p_organization_id: string;
          p_from: string;
          p_to: string;
          p_today: string;
        };
        Returns: { done_trips: number; revenue: number; unpriced_trips: number }[];
      };
      expense_totals: {
        Args: { p_organization_id: string; p_from: string; p_to: string };
        Returns: { total: number }[];
      };
      unopened_days: {
        Args: { p_organization_id: string; p_from: string; p_to: string };
        Returns: string[];
      };
      driver_pay: {
        Args: {
          p_organization_id: string;
          p_from: string;
          p_to: string;
          p_today: string;
        };
        Returns: {
          pay_type: string;
          done_outbound: number;
          done_return: number;
          recorded: number;
        }[];
      };
      vehicle_pay: {
        Args: {
          p_organization_id: string;
          p_from: string;
          p_to: string;
          p_today: string;
        };
        Returns: {
          rent_type: string;
          done_outbound: number;
          done_return: number;
          recorded: number;
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
