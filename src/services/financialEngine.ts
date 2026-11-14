import type { Vehicle, MaintenanceItem, DailyLog } from '@/types/database.types';

export interface DailyClosureInput {
  gross_earnings: number;
  km_driven: number;
  fuel_spent?: number;
  food_other_spent?: number;
  platform?: string;
  log_date?: string;
  raw_input_text?: string | null;
}

export interface ItemWearDetail {
  itemId: string;
  itemName: string;
  wearCost: number;
  newReservedBalance: number;
  kmSinceLastChange: number;
  lifespanKm: number;
  remainingKm: number;
  percentRemaining: number;
  isExpired: boolean;
  isCritical: boolean;
}

export interface DailyClosureResult {
  // Dados de entrada e identificação
  gross_earnings: number;
  km_driven: number;
  log_date: string;
  platform: string;
  raw_input_text: string | null;

  // Custos apurados
  fuel_spent: number;
  is_fuel_estimated: boolean;
  diluted_fixed_cost: number;
  calculated_wear_cost: number;
  food_other_spent: number;
  total_expenses: number;

  // Rentabilidade
  net_profit: number;
  net_profit_per_km: number;
  profit_margin_percent: number;

  // Estado atualizado do veículo e manutenções
  new_odometer: number;
  updated_vehicle: Vehicle;
  updated_maintenance_items: MaintenanceItem[];
  items_wear_details: ItemWearDetail[];

  // Objeto pronto para persistência no Supabase (daily_logs)
  daily_log_payload: Omit<DailyLog, 'id' | 'created_at'>;

  // Alertas e diagnósticos
  alerts: string[];
}

/**
 * Arredonda valores numéricos para duas casas decimais
 */
function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Motor Financeiro Inteligente para motoristas e entregadores
 * Calcula custos reais, provisão para caixinha de manutenção e margem líquida por km
 */
export function processDailyClosure(
  vehicle: Vehicle,
  maintenanceItems: MaintenanceItem[],
  input: DailyClosureInput
): DailyClosureResult {
  const gross = Math.max(0, input.gross_earnings || 0);
  const kmDriven = Math.max(0, input.km_driven || 0);
  const foodOther = Math.max(0, input.food_other_spent || 0);
  const alerts: string[] = [];

  // a) Combustível: se fuel_spent > 0, usa valor real informado; senão, calcula estimativa
  let effectiveFuelSpent = 0;
  let isFuelEstimated = false;

  if (typeof input.fuel_spent === 'number' && input.fuel_spent > 0) {
    effectiveFuelSpent = round2(input.fuel_spent);
    isFuelEstimated = false;
  } else {
    const avgConsumption = vehicle.avg_km_per_liter > 0 ? vehicle.avg_km_per_liter : 1;
    const fuelPrice = vehicle.fuel_price > 0 ? vehicle.fuel_price : 0;
    effectiveFuelSpent = round2((kmDriven / avgConsumption) * fuelPrice);
    isFuelEstimated = true;
  }

  // b) Custo fixo mensal diluído pela meta de km
  let dilutedFixedCost = 0;
  const monthlyGoal = vehicle.monthly_km_goal && vehicle.monthly_km_goal > 0 ? vehicle.monthly_km_goal : 0;
  if (monthlyGoal > 0 && vehicle.fixed_monthly_cost > 0) {
    dilutedFixedCost = round2((vehicle.fixed_monthly_cost / monthlyGoal) * kmDriven);
  }

  // c) Desgaste e Caixinha de Manutenção
  let totalWearCost = 0;
  const newOdometer = round2(Number(vehicle.current_odometer || 0) + kmDriven);
  const updatedMaintenanceItems: MaintenanceItem[] = [];
  const itemsWearDetails: ItemWearDetail[] = [];

  for (const item of maintenanceItems) {
    const lifespan = item.lifespan_km > 0 ? item.lifespan_km : 1000;
    const cost = item.replacement_cost > 0 ? item.replacement_cost : 0;
    
    // Provisão de desgaste proporcional aos km rodados hoje
    const itemWearCost = round2((cost / lifespan) * kmDriven);
    const newReservedBalance = round2(Number(item.reserved_balance || 0) + itemWearCost);
    totalWearCost = round2(totalWearCost + itemWearCost);

    // Quilometragem percorrida desde a última troca
    const kmSinceLastChange = round2(newOdometer - Number(item.last_changed_odometer || 0));
    const remainingKm = round2(lifespan - kmSinceLastChange);
    const percentRemaining = round2((remainingKm / lifespan) * 100);

    const isExpired = remainingKm <= 0;
    const isCritical = percentRemaining <= 15 && !isExpired;

    itemsWearDetails.push({
      itemId: item.id,
      itemName: item.item_name,
      wearCost: itemWearCost,
      newReservedBalance,
      kmSinceLastChange,
      lifespanKm: lifespan,
      remainingKm,
      percentRemaining,
      isExpired,
      isCritical,
    });

    updatedMaintenanceItems.push({
      ...item,
      reserved_balance: newReservedBalance,
    });

    // f) Alertas de manutenção preventiva
    if (isExpired) {
      alerts.push(
        `🚨 MANUTENÇÃO VENCIDA: A peça "${item.item_name}" rodou ${kmSinceLastChange} km (vida útil limite: ${lifespan} km). Substitua com urgência! Saldo disponível na caixinha: R$ ${newReservedBalance.toFixed(2)}.`
      );
    } else if (isCritical) {
      alerts.push(
        `⚠️ ALERTA DE PEÇA CRÍTICA: "${item.item_name}" está em ${percentRemaining.toFixed(0)}% da vida útil (${remainingKm} km restantes). Planeje a troca estimada em R$ ${cost.toFixed(2)}.`
      );
    }
  }

  // d) Atualização do veículo
  const updatedVehicle: Vehicle = {
    ...vehicle,
    current_odometer: newOdometer,
  };

  // e) Lucro líquido real
  const totalExpenses = round2(effectiveFuelSpent + dilutedFixedCost + totalWearCost + foodOther);
  const netProfit = round2(gross - totalExpenses);
  const netProfitPerKm = kmDriven > 0 ? round2(netProfit / kmDriven) : 0;
  const profitMarginPercent = gross > 0 ? round2((netProfit / gross) * 100) : 0;

  // f) Alertas de rentabilidade
  if (kmDriven > 0 && netProfitPerKm < 0.80) {
    alerts.push(
      `📉 RENTABILIDADE CRÍTICA: Seu lucro líquido real foi de R$ ${netProfitPerKm.toFixed(2)}/km, abaixo do piso seguro recomendado de R$ 0,80/km. Avalie melhor as rotas e plataformas.`
    );
  }

  if (netProfit < 0) {
    alerts.push(
      `🛑 PREJUÍZO OPERACIONAL: Hoje as despesas reais superaram os ganhos brutos em R$ ${Math.abs(netProfit).toFixed(2)}. Não retire dinheiro sem repor o desgaste do veículo!`
    );
  }

  // Objeto preparado para inserção direta no banco supabase (daily_logs)
  const logDate = input.log_date || new Date().toISOString().split('T')[0];
  const platform = input.platform || 'Geral';
  const rawInputText = input.raw_input_text || null;

  const dailyLogPayload: Omit<DailyLog, 'id' | 'created_at'> = {
    user_id: vehicle.user_id,
    log_date: logDate,
    platform,
    gross_earnings: gross,
    km_driven: kmDriven,
    fuel_spent: effectiveFuelSpent,
    food_other_spent: foodOther,
    calculated_wear_cost: totalWearCost,
    net_profit: netProfit,
    raw_input_text: rawInputText,
  };

  return {
    gross_earnings: gross,
    km_driven: kmDriven,
    log_date: logDate,
    platform,
    raw_input_text: rawInputText,

    fuel_spent: effectiveFuelSpent,
    is_fuel_estimated: isFuelEstimated,
    diluted_fixed_cost: dilutedFixedCost,
    calculated_wear_cost: totalWearCost,
    food_other_spent: foodOther,
    total_expenses: totalExpenses,

    net_profit: netProfit,
    net_profit_per_km: netProfitPerKm,
    profit_margin_percent: profitMarginPercent,

    new_odometer: newOdometer,
    updated_vehicle: updatedVehicle,
    updated_maintenance_items: updatedMaintenanceItems,
    items_wear_details: itemsWearDetails,

    daily_log_payload: dailyLogPayload,
    alerts,
  };
}
