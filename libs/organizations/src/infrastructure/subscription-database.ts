import {
  SubscriptionOfferRow,
  SubscriptionPeriodRow,
  SubscriptionPlanRow,
} from '@routeops/shared/pricing';

export interface SubscriptionRow {
  id: string;
  organization_id: string;
  plan_id: string;
  offer_id: string | null;
  months: number | null;
  trial_days: number | null;
  starts_on: string;
  ends_on: string;
  vehicle_limit: number | null;
  price: number;
  note: string | null;
}

// A type rather than an interface, because the client's table types need an index signature.
type OfferColumns = {
  kind: string;
  name_ar: string;
  name_en: string;
  code: string | null;
  percent_off: number | null;
  trial_days: number | null;
  plan_ids: string[];
  months: number[];
  starts_on: string;
  ends_on: string | null;
  is_active: boolean;
};

export interface SubscriptionDatabase {
  public: {
    Tables: {
      subscription_plans: {
        Row: Pick<SubscriptionPlanRow, keyof SubscriptionPlanRow>;
        Insert: {
          currency: string;
          name_ar: string;
          name_en: string;
          vehicle_limit: number | null;
          monthly_price: number | null;
          is_active: boolean;
        };
        Update: {
          currency?: string;
          name_ar?: string;
          name_en?: string;
          vehicle_limit?: number | null;
          monthly_price?: number | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      subscription_periods: {
        Row: Pick<SubscriptionPeriodRow, keyof SubscriptionPeriodRow>;
        Insert: never;
        Update: { discount_percent: number };
        Relationships: [];
      };
      subscription_offers: {
        Row: Pick<SubscriptionOfferRow, keyof SubscriptionOfferRow>;
        Insert: OfferColumns;
        Update: Partial<OfferColumns>;
        Relationships: [];
      };
      organization_subscriptions: {
        Row: Pick<SubscriptionRow, keyof SubscriptionRow>;
        Insert: {
          organization_id: string;
          plan_id: string;
          offer_id: string | null;
          months: number | null;
          starts_on: string;
          vehicle_limit: number | null;
          price: number;
          note: string | null;
        };
        Update: {
          plan_id: string;
          offer_id: string | null;
          months: number | null;
          starts_on: string;
          vehicle_limit: number | null;
          price: number;
          note: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      operator_vehicle_usage: {
        Args: Record<string, never>;
        Returns: {
          organization_id: string;
          active_vehicles: number;
          today: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
