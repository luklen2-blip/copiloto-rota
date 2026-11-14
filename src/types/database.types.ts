export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VehicleType = 'moto' | 'carro';

export interface Vehicle {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  model_name: string;
  fuel_price: number;
  avg_km_per_liter: number;
  fixed_monthly_cost: number;
  monthly_km_goal: number | null;
  current_odometer: number;
  created_at: string;
}

export interface MaintenanceItem {
  id: string;
  vehicle_id: string;
  item_name: string;
  replacement_cost: number;
  lifespan_km: number;
  last_changed_odometer: number;
  reserved_balance: number;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;
  platform: string;
  gross_earnings: number;
  km_driven: number;
  fuel_spent: number;
  food_other_spent: number;
  calculated_wear_cost: number;
  net_profit: number;
  raw_input_text: string | null;
  created_at: string;
}

export type PlanStatus = 'trial' | 'active' | 'expired' | 'canceled';

export interface Subscription {
  id: string;
  user_id: string;
  email: string | null;
  plan_status: PlanStatus;
  trial_ends_at: string;
  current_period_end: string | null;
  updated_at: string;
}

export interface IncidentVault {
  id: string;
  user_id: string;
  platform: string;
  description: string;
  evidence_urls: string[];
  generated_defense: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: Vehicle;
        Insert: {
          id?: string;
          user_id: string;
          vehicle_type: VehicleType;
          model_name: string;
          fuel_price?: number;
          avg_km_per_liter?: number;
          fixed_monthly_cost?: number;
          monthly_km_goal?: number | null;
          current_odometer?: number;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          vehicle_type: VehicleType;
          model_name: string;
          fuel_price: number;
          avg_km_per_liter: number;
          fixed_monthly_cost: number;
          monthly_km_goal: number | null;
          current_odometer: number;
          created_at: string;
        }>;
        Relationships: [];
      };
      maintenance_items: {
        Row: MaintenanceItem;
        Insert: {
          id?: string;
          vehicle_id: string;
          item_name: string;
          replacement_cost?: number;
          lifespan_km: number;
          last_changed_odometer?: number;
          reserved_balance?: number;
        };
        Update: Partial<{
          id: string;
          vehicle_id: string;
          item_name: string;
          replacement_cost: number;
          lifespan_km: number;
          last_changed_odometer: number;
          reserved_balance: number;
        }>;
        Relationships: [];
      };
      daily_logs: {
        Row: DailyLog;
        Insert: {
          id?: string;
          user_id: string;
          log_date: string;
          platform: string;
          gross_earnings: number;
          km_driven: number;
          fuel_spent: number;
          food_other_spent: number;
          calculated_wear_cost: number;
          net_profit: number;
          raw_input_text?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          log_date: string;
          platform: string;
          gross_earnings: number;
          km_driven: number;
          fuel_spent: number;
          food_other_spent: number;
          calculated_wear_cost: number;
          net_profit: number;
          raw_input_text: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      incident_vault: {
        Row: IncidentVault;
        Insert: {
          id?: string;
          user_id: string;
          platform: string;
          description: string;
          evidence_urls?: string[];
          generated_defense?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          platform: string;
          description: string;
          evidence_urls: string[];
          generated_defense: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      subscriptions: {
        Row: Subscription;
        Insert: {
          id?: string;
          user_id: string;
          email?: string | null;
          plan_status?: PlanStatus;
          trial_ends_at?: string;
          current_period_end?: string | null;
          updated_at?: string;
        };
        Update: Partial<{
          id: string;
          user_id: string;
          email: string | null;
          plan_status: PlanStatus;
          trial_ends_at: string;
          current_period_end: string | null;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
