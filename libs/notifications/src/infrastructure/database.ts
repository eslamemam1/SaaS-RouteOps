// The part of the generated Supabase types the notifications read.
type ReadOnlyTable<Row> = {
  Row: Row;
  Insert: never;
  Update: never;
  Relationships: [];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      drivers: ReadOnlyTable<{
        id: string;
        organization_id: string;
        full_name: string;
        license_expires_on: string | null;
        is_active: boolean;
      }>;
      vehicles: ReadOnlyTable<{
        id: string;
        organization_id: string;
        plate_number: string;
        license_expires_on: string | null;
        is_active: boolean;
      }>;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      trip_log: {
        Args: {
          p_organization_id: string;
          p_from: string;
          p_to: string;
          p_today: string;
          p_driver_id?: string;
          p_vehicle_id?: string;
        };
        Returns: {
          id: string;
          service_date: string;
          departure_time: string;
          direction: string;
          customer_id: string;
          route_id: string | null;
          vehicle_id: string | null;
          driver_id: string;
          planned_driver_id: string | null;
          is_extra: boolean;
          status: string;
          change_reason: string | null;
          notes: string | null;
          price: number | null;
        }[];
      };
      driver_pay: {
        Args: {
          p_organization_id: string;
          p_from: string;
          p_to: string;
          p_today: string;
        };
        Returns: {
          driver_id: string;
          pay_type: string;
          monthly_salary: number | null;
          salary_trips: number | null;
          outbound_pay: number | null;
          return_pay: number | null;
          done_outbound: number;
          done_return: number;
          absent_outbound: number;
          absent_return: number;
          recorded: number;
          extra_outbound: number;
          extra_return: number;
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
          vehicle_id: string;
          ownership: string;
          rent_type: string;
          monthly_rent: number | null;
          outbound_rent: number | null;
          return_rent: number | null;
          done_outbound: number;
          done_return: number;
          recorded: number;
        }[];
      };
      unopened_days: {
        Args: { p_organization_id: string; p_from: string; p_to: string };
        Returns: string[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
