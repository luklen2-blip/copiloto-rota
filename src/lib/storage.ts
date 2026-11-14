import type {
  Vehicle,
  MaintenanceItem,
  DailyLog,
} from "@/types/database.types";
import type { DailyClosureResult } from "@/services/financialEngine";

export const STORAGE_KEYS = {
  VEHICLE: "copiloto_rota_vehicle_v1",
  MAINTENANCE_ITEMS: "copiloto_rota_maintenance_items_v1",
  DAILY_LOGS_HISTORY: "copiloto_rota_daily_history_v1",
  ACTIVE_CLOSURE: "copiloto_rota_active_closure_v1",
};

export const INITIAL_VEHICLE: Vehicle = {
  id: "veh-default-01",
  user_id: "local-user",
  vehicle_type: "moto",
  model_name: "Honda CG 160 Fan",
  fuel_price: 5.89,
  avg_km_per_liter: 38.0,
  fixed_monthly_cost: 220.0,
  monthly_km_goal: 2500,
  current_odometer: 18450,
  created_at: new Date().toISOString(),
};

export const INITIAL_MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: "item-oleo-01",
    vehicle_id: "veh-default-01",
    item_name: "Óleo de Motor (10W30 / 20W50)",
    replacement_cost: 45.0,
    lifespan_km: 1500,
    last_changed_odometer: 17200,
    reserved_balance: 37.5,
  },
  {
    id: "item-pneu-01",
    vehicle_id: "veh-default-01",
    item_name: "Pneu Traseiro Sem Câmara",
    replacement_cost: 230.0,
    lifespan_km: 12000,
    last_changed_odometer: 8000,
    reserved_balance: 195.0,
  },
  {
    id: "item-relacao-01",
    vehicle_id: "veh-default-01",
    item_name: "Kit Relação (Corrente/Coroa/Pinhão)",
    replacement_cost: 180.0,
    lifespan_km: 15000,
    last_changed_odometer: 5000,
    reserved_balance: 158.0,
  },
  {
    id: "item-freios-01",
    vehicle_id: "veh-default-01",
    item_name: "Pastilhas e Lonas de Freio",
    replacement_cost: 65.0,
    lifespan_km: 8000,
    last_changed_odometer: 12000,
    reserved_balance: 52.0,
  },
];

// 7 dias de exemplo para visualização imediata do gráfico da semana
export const SAMPLE_WEEK_LOGS: DailyLog[] = [
  {
    id: "sample-log-1",
    user_id: "local-user",
    log_date: new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0],
    platform: "iFood",
    gross_earnings: 210.0,
    km_driven: 118,
    fuel_spent: 32.0,
    food_other_spent: 15.0,
    calculated_wear_cost: 11.2,
    net_profit: 141.42,
    raw_input_text: "Turno padrão iFood",
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: "sample-log-2",
    user_id: "local-user",
    log_date: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
    platform: "Uber",
    gross_earnings: 245.0,
    km_driven: 135,
    fuel_spent: 40.0,
    food_other_spent: 20.0,
    calculated_wear_cost: 12.8,
    net_profit: 160.32,
    raw_input_text: "Uber corrida direta",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "sample-log-3",
    user_id: "local-user",
    log_date: new Date(Date.now() - 4 * 86400000).toISOString().split("T")[0],
    platform: "99",
    gross_earnings: 180.0,
    km_driven: 95,
    fuel_spent: 28.0,
    food_other_spent: 12.0,
    calculated_wear_cost: 9.0,
    net_profit: 122.64,
    raw_input_text: "99 poucas corridas",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: "sample-log-4",
    user_id: "local-user",
    log_date: new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0],
    platform: "iFood",
    gross_earnings: 260.0,
    km_driven: 140,
    fuel_spent: 38.0,
    food_other_spent: 18.0,
    calculated_wear_cost: 13.3,
    net_profit: 178.38,
    raw_input_text: "Sexta-feira forte",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "sample-log-5",
    user_id: "local-user",
    log_date: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
    platform: "iFood",
    gross_earnings: 290.0,
    km_driven: 160,
    fuel_spent: 45.0,
    food_other_spent: 22.0,
    calculated_wear_cost: 15.2,
    net_profit: 193.72,
    raw_input_text: "Sábado almoço e janta",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "sample-log-6",
    user_id: "local-user",
    log_date: new Date(Date.now() - 1 * 86400000).toISOString().split("T")[0],
    platform: "Uber",
    gross_earnings: 195.0,
    km_driven: 110,
    fuel_spent: 33.0,
    food_other_spent: 15.0,
    calculated_wear_cost: 10.45,
    net_profit: 126.87,
    raw_input_text: "Domingo à tarde",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export function getStoredVehicle(): Vehicle {
  if (typeof window === "undefined") return INITIAL_VEHICLE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLE);
    return raw ? JSON.parse(raw) : INITIAL_VEHICLE;
  } catch {
    return INITIAL_VEHICLE;
  }
}

export function saveStoredVehicle(vehicle: Vehicle): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.VEHICLE, JSON.stringify(vehicle));
  } catch (err) {
    console.error("Erro ao salvar veículo no localStorage:", err);
  }
}

export function getStoredMaintenanceItems(): MaintenanceItem[] {
  if (typeof window === "undefined") return INITIAL_MAINTENANCE_ITEMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE_ITEMS);
    return raw ? JSON.parse(raw) : INITIAL_MAINTENANCE_ITEMS;
  } catch {
    return INITIAL_MAINTENANCE_ITEMS;
  }
}

export function saveStoredMaintenanceItems(items: MaintenanceItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE_ITEMS, JSON.stringify(items));
  } catch (err) {
    console.error("Erro ao salvar itens de manutenção:", err);
  }
}

export function getStoredActiveClosure(): DailyClosureResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLOSURE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredActiveClosure(
  closure: DailyClosureResult | null,
): void {
  if (typeof window === "undefined") return;
  try {
    if (closure) {
      localStorage.setItem(
        STORAGE_KEYS.ACTIVE_CLOSURE,
        JSON.stringify(closure),
      );
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CLOSURE);
    }
  } catch (err) {
    console.error("Erro ao salvar fechamento ativo:", err);
  }
}

export function getStoredDailyHistory(): DailyLog[] {
  if (typeof window === "undefined") return SAMPLE_WEEK_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS_HISTORY);
    return raw ? JSON.parse(raw) : SAMPLE_WEEK_LOGS;
  } catch {
    return SAMPLE_WEEK_LOGS;
  }
}

export function saveStoredDailyHistory(history: DailyLog[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      STORAGE_KEYS.DAILY_LOGS_HISTORY,
      JSON.stringify(history),
    );
  } catch (err) {
    console.error("Erro ao salvar histórico no localStorage:", err);
  }
}

export function addStoredDailyLog(log: DailyLog): DailyLog[] {
  const current = getStoredDailyHistory();
  const updated = [log, ...current.filter((item) => item.id !== log.id)].slice(
    0,
    30,
  );
  saveStoredDailyHistory(updated);
  return updated;
}
