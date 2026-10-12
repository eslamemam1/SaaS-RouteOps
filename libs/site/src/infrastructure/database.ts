import {
  SubscriptionOfferRow,
  SubscriptionPeriodRow,
  SubscriptionPlanRow,
} from '@routeops/shared/pricing';

export interface Database {
  public: {
    Tables: {
      subscription_plans: {
        Row: Pick<SubscriptionPlanRow, keyof SubscriptionPlanRow>;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subscription_periods: {
        Row: Pick<SubscriptionPeriodRow, keyof SubscriptionPeriodRow>;
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subscription_offers: {
        Row: Pick<SubscriptionOfferRow, keyof SubscriptionOfferRow>;
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
