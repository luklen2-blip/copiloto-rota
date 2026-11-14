import { NextResponse } from "next/server";
import { extractDailyData } from "@/services/aiExtractor";
import {
  processDailyClosure,
  DailyClosureInput,
} from "@/services/financialEngine";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import type { Vehicle, MaintenanceItem } from "@/types/database.types";

// Veículo padrão para ambiente de simulação ou novos usuários sem cadastro
const DEFAULT_SIMULATION_VEHICLE: Vehicle = {
  id: "sim-veh-01",
  user_id: "sim-user-01",
  vehicle_type: "moto",
  model_name: "Honda CG 160 Fan / Start",
  fuel_price: 5.89,
  avg_km_per_liter: 38.0,
  fixed_monthly_cost: 220.0,
  monthly_km_goal: 2500,
  current_odometer: 18450,
  created_at: new Date().toISOString(),
};

// Peças de manutenção padrão com parâmetros reais do mercado brasileiro
const DEFAULT_SIMULATION_MAINTENANCE_ITEMS: MaintenanceItem[] = [
  {
    id: "sim-item-oleo",
    vehicle_id: "sim-veh-01",
    item_name: "Óleo de Motor (10W30 / 20W50)",
    replacement_cost: 45.0,
    lifespan_km: 1500,
    last_changed_odometer: 17200,
    reserved_balance: 37.5,
  },
  {
    id: "sim-item-pneu",
    vehicle_id: "sim-veh-01",
    item_name: "Pneu Traseiro Sem Câmara",
    replacement_cost: 230.0,
    lifespan_km: 12000,
    last_changed_odometer: 8000,
    reserved_balance: 195.0,
  },
  {
    id: "sim-item-relacao",
    vehicle_id: "sim-veh-01",
    item_name: "Kit Transmissão / Relação com Retentor",
    replacement_cost: 180.0,
    lifespan_km: 15000,
    last_changed_odometer: 5000,
    reserved_balance: 158.0,
  },
  {
    id: "sim-item-freios",
    vehicle_id: "sim-veh-01",
    item_name: "Pastilhas e Lonas de Freio",
    replacement_cost: 65.0,
    lifespan_km: 8000,
    last_changed_odometer: 12000,
    reserved_balance: 52.0,
  },
];

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`closure:${ip}`, 45, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: "Limite de requisições excedido. Aguarde 1 minuto." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const textInput: string | undefined = body.text;
    const imageBase64: string | undefined = body.imageBase64;
    const imageMimeType: string | undefined = body.imageMimeType;
    const manualData: Partial<DailyClosureInput> | undefined = body.manualData;

    // 1. Veículo e peças: mescla dados fornecidos pelo cliente ou usa simulação
    const vehicle: Vehicle = {
      ...DEFAULT_SIMULATION_VEHICLE,
      ...(body.vehicle || {}),
    };

    const maintenanceItems: MaintenanceItem[] =
      Array.isArray(body.maintenanceItems) && body.maintenanceItems.length > 0
        ? body.maintenanceItems
        : DEFAULT_SIMULATION_MAINTENANCE_ITEMS;

    // 2. Extração inteligente via Gemini 2.5 Flash (com fallback heurístico automático)
    const aiExtracted = await extractDailyData({
      text: textInput,
      imageBase64,
      imageMimeType,
    });

    // 3. Montagem dos dados de fechamento (priorizando overrides manuais se existirem)
    const closureInput: DailyClosureInput = {
      gross_earnings:
        typeof manualData?.gross_earnings === "number"
          ? manualData.gross_earnings
          : aiExtracted.gross_earnings,
      km_driven:
        typeof manualData?.km_driven === "number"
          ? manualData.km_driven
          : aiExtracted.km_driven,
      fuel_spent:
        typeof manualData?.fuel_spent === "number"
          ? manualData.fuel_spent
          : aiExtracted.fuel_spent,
      food_other_spent:
        typeof manualData?.food_other_spent === "number"
          ? manualData.food_other_spent
          : aiExtracted.food_other_spent,
      platform: manualData?.platform || aiExtracted.platform || "Geral",
      log_date: manualData?.log_date || new Date().toISOString().split("T")[0],
      raw_input_text:
        textInput || (imageBase64 ? "[Comprovante via Imagem]" : null),
    };

    // 4. Execução do Motor Financeiro
    const closureResult = processDailyClosure(
      vehicle,
      maintenanceItems,
      closureInput,
    );

    // 5. Tentativa de persistência no Supabase se configurado e solicitado
    let databaseStatus: "synced" | "simulated" = "simulated";
    const effectiveUserId = body.userId || body.user_id;

    if (effectiveUserId) {
      closureResult.daily_log_payload.user_id = effectiveUserId;
    }

    if (isSupabaseConfigured && (body.saveToSupabase || effectiveUserId)) {
      try {
        // Inserção do log diário
        const { error } = await (supabase.from("daily_logs") as any).insert(
          closureResult.daily_log_payload,
        );

        if (!error) {
          databaseStatus = "synced";

          // Atualiza odômetro do veículo caso exista ID persistido
          if (vehicle.id && !vehicle.id.startsWith("sim-")) {
            await (supabase.from("vehicles") as any)
              .update({ current_odometer: closureResult.new_odometer })
              .eq("id", vehicle.id);
          }

          // Atualiza caixinha das peças
          for (const item of closureResult.updated_maintenance_items) {
            if (item.id && !item.id.startsWith("sim-")) {
              await (supabase.from("maintenance_items") as any)
                .update({ reserved_balance: item.reserved_balance })
                .eq("id", item.id);
            }
          }
        } else {
          console.warn(
            "Erro ao persistir no Supabase (operando em modo simulação):",
            error.message,
          );
        }
      } catch (dbErr) {
        console.warn(
          "Falha na conexão Supabase, mantendo modo simulação:",
          dbErr,
        );
      }
    }

    // 6. Retorno estruturado completo
    return NextResponse.json({
      success: true,
      mode: databaseStatus,
      ai_extractor: aiExtracted,
      closure: closureResult,
      summary: {
        platform: closureResult.platform,
        gross_earnings: closureResult.gross_earnings,
        net_profit: closureResult.net_profit,
        net_profit_per_km: closureResult.net_profit_per_km,
        km_driven: closureResult.km_driven,
        fuel_spent: closureResult.fuel_spent,
        diluted_fixed_cost: closureResult.diluted_fixed_cost,
        calculated_wear_cost: closureResult.calculated_wear_cost,
        alerts_count: closureResult.alerts.length,
      },
      alerts: closureResult.alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro no processamento do fechamento diário:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno no processamento",
      },
      { status: 500 },
    );
  }
}
