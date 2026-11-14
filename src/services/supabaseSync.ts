import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Vehicle, MaintenanceItem, DailyLog, Subscription } from '@/types/database.types';
import { INITIAL_VEHICLE, INITIAL_MAINTENANCE_ITEMS } from '@/lib/storage';
import type { DailyClosureResult } from '@/services/financialEngine';

export interface UserLoadedData {
  vehicle: Vehicle;
  maintenanceItems: MaintenanceItem[];
  weeklyLogs: DailyLog[];
  subscription: Subscription | null;
}

export const INITIAL_TRIAL_SUBSCRIPTION: Subscription = {
  id: 'sub-local-trial',
  user_id: 'local-user',
  email: null,
  plan_status: 'trial',
  trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  current_period_end: null,
  updated_at: new Date().toISOString(),
};

/**
 * Cria o veículo padrão, as 4 peças iniciais de manutenção e a assinatura Trial de 7 dias no Supabase
 * para novos usuários que acabaram de se cadastrar
 */
export async function seedInitialUserData(
  userId: string,
  email?: string | null
): Promise<{ vehicle: Vehicle; maintenanceItems: MaintenanceItem[]; subscription: Subscription }> {
  const trialEndsAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const defaultSub: Subscription = {
    id: `sub-${userId}`,
    user_id: userId,
    email: email || null,
    plan_status: 'trial',
    trial_ends_at: trialEndsAt,
    current_period_end: null,
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    return {
      vehicle: { ...INITIAL_VEHICLE, user_id: userId },
      maintenanceItems: INITIAL_MAINTENANCE_ITEMS,
      subscription: defaultSub,
    };
  }

  try {
    // 1. Criar veículo padrão
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vehicleData, error: vehErr } = await (supabase.from('vehicles') as any)
      .insert({
        user_id: userId,
        vehicle_type: INITIAL_VEHICLE.vehicle_type,
        model_name: INITIAL_VEHICLE.model_name,
        fuel_price: INITIAL_VEHICLE.fuel_price,
        avg_km_per_liter: INITIAL_VEHICLE.avg_km_per_liter,
        fixed_monthly_cost: INITIAL_VEHICLE.fixed_monthly_cost,
        monthly_km_goal: INITIAL_VEHICLE.monthly_km_goal,
        current_odometer: INITIAL_VEHICLE.current_odometer,
      })
      .select()
      .single();

    const createdVehicle: Vehicle = vehicleData || { ...INITIAL_VEHICLE, user_id: userId };

    if (vehErr) {
      console.warn('Erro ao inserir veículo no Supabase, usando fallback:', vehErr.message);
    }

    // 2. Criar as 4 peças de manutenção vinculadas a este veículo
    let createdItems: MaintenanceItem[] = INITIAL_MAINTENANCE_ITEMS;
    if (createdVehicle.id && !createdVehicle.id.startsWith('veh-')) {
      const itemsToInsert = INITIAL_MAINTENANCE_ITEMS.map((item) => ({
        vehicle_id: createdVehicle.id,
        item_name: item.item_name,
        replacement_cost: item.replacement_cost,
        lifespan_km: item.lifespan_km,
        last_changed_odometer: item.last_changed_odometer,
        reserved_balance: item.reserved_balance,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: itemsData, error: itemsErr } = await (supabase.from('maintenance_items') as any)
        .insert(itemsToInsert)
        .select();

      if (!itemsErr && itemsData) {
        createdItems = itemsData;
      }
    }

    // 3. Criar registro de Assinatura (Trial de 7 dias)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subData, error: subErr } = await (supabase.from('subscriptions') as any)
      .insert({
        user_id: userId,
        email: email || null,
        plan_status: 'trial',
        trial_ends_at: trialEndsAt,
      })
      .select()
      .single();

    const createdSub: Subscription = subData || defaultSub;

    if (subErr) {
      console.warn('Erro ao inserir assinatura no Supabase:', subErr.message);
    }

    return {
      vehicle: createdVehicle,
      maintenanceItems: createdItems,
      subscription: createdSub,
    };
  } catch (err) {
    console.error('Falha geral no seed de dados do usuário:', err);
    return {
      vehicle: { ...INITIAL_VEHICLE, user_id: userId },
      maintenanceItems: INITIAL_MAINTENANCE_ITEMS,
      subscription: defaultSub,
    };
  }
}

/**
 * Carrega veículo, peças, assinatura e histórico dos últimos 7 dias do Supabase
 */
export async function loadUserData(userId: string): Promise<UserLoadedData> {
  if (!isSupabaseConfigured) {
    return {
      vehicle: { ...INITIAL_VEHICLE, user_id: userId },
      maintenanceItems: INITIAL_MAINTENANCE_ITEMS,
      weeklyLogs: [],
      subscription: INITIAL_TRIAL_SUBSCRIPTION,
    };
  }

  try {
    // 1. Buscar veículo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vehicles } = await (supabase.from('vehicles') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!vehicles || vehicles.length === 0) {
      const seeded = await seedInitialUserData(userId);
      return {
        vehicle: seeded.vehicle,
        maintenanceItems: seeded.maintenanceItems,
        weeklyLogs: [],
        subscription: seeded.subscription,
      };
    }

    const activeVehicle: Vehicle = vehicles[0];

    // 2. Buscar peças de manutenção
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: items } = await (supabase.from('maintenance_items') as any)
      .select('*')
      .eq('vehicle_id', activeVehicle.id);

    // 3. Buscar assinatura
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subs } = await (supabase.from('subscriptions') as any)
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    let userSubscription: Subscription | null = subs && subs.length > 0 ? subs[0] : null;

    if (!userSubscription) {
      // Cria trial se não existir
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newSub } = await (supabase.from('subscriptions') as any)
        .insert({
          user_id: userId,
          plan_status: 'trial',
          trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        })
        .select()
        .single();
      userSubscription = newSub || INITIAL_TRIAL_SUBSCRIPTION;
    }

    // 4. Buscar logs dos últimos 7 dias
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: logs } = await (supabase.from('daily_logs') as any)
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(7);

    return {
      vehicle: activeVehicle,
      maintenanceItems: items && items.length > 0 ? items : INITIAL_MAINTENANCE_ITEMS,
      weeklyLogs: logs || [],
      subscription: userSubscription,
    };
  } catch (err) {
    console.error('Erro ao carregar dados do usuário no Supabase:', err);
    return {
      vehicle: { ...INITIAL_VEHICLE, user_id: userId },
      maintenanceItems: INITIAL_MAINTENANCE_ITEMS,
      weeklyLogs: [],
      subscription: INITIAL_TRIAL_SUBSCRIPTION,
    };
  }
}

/**
 * Sincroniza o fechamento diário completo no Supabase
 */
export async function syncDailyClosureToSupabase(
  userId: string,
  closure: DailyClosureResult
): Promise<{ success: boolean; logId?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false };
  }

  try {
    const logPayload = {
      ...closure.daily_log_payload,
      user_id: userId,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: logData, error: logErr } = await (supabase.from('daily_logs') as any)
      .insert(logPayload)
      .select('id')
      .single();

    if (logErr) {
      console.warn('Erro ao inserir daily_log:', logErr.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('vehicles') as any)
      .update({ current_odometer: closure.new_odometer })
      .eq('id', closure.updated_vehicle.id);

    for (const item of closure.updated_maintenance_items) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('maintenance_items') as any)
        .update({ reserved_balance: item.reserved_balance })
        .eq('id', item.id);
    }

    return { success: true, logId: logData?.id };
  } catch (err) {
    console.error('Erro ao sincronizar fechamento com Supabase:', err);
    return { success: false };
  }
}
