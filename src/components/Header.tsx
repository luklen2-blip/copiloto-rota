"use client";

import React from "react";
import {
  Bike,
  Car,
  Wrench,
  ShieldAlert,
  Sparkles,
  Gauge,
  Fuel,
  User,
  CheckCircle2,
  Zap,
  HelpCircle,
  Truck,
} from "lucide-react";
import type { Vehicle } from "@/types/database.types";
import type { SubscriptionStatusInfo } from "@/lib/subscription";

interface HeaderProps {
  vehicle: Vehicle;
  onOpenVehicleModal: () => void;
  onOpenAuthModal: () => void;
  onOpenUpgradeModal: () => void;
  onOpenTour?: () => void;
  subscriptionStatus: SubscriptionStatusInfo;
  currentUser: { id: string; email?: string } | null;
  activeTab: "closure" | "vault" | "dispatcher";
  onTabChange: (tab: "closure" | "vault" | "dispatcher") => void;
}

export const Header: React.FC<HeaderProps> = ({
  vehicle,
  onOpenVehicleModal,
  onOpenAuthModal,
  onOpenUpgradeModal,
  onOpenTour,
  subscriptionStatus,
  currentUser,
  activeTab,
  onTabChange,
}) => {
  const isMoto = vehicle.vehicle_type === "moto";

  const badgeStyle = {
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    amber: "bg-amber-400/15 border-amber-400/30 text-amber-300",
    rose: "bg-rose-500/15 border-rose-500/30 text-rose-400",
  }[subscriptionStatus.badgeVariant];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur supports-[backdrop-filter]:bg-slate-950/80">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:px-6">
        {/* Barra superior de identidade, plano e botões de acesso */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 shadow-lg shadow-amber-500/20">
              {isMoto ? (
                <Bike className="h-6 w-6 stroke-[2.5]" />
              ) : (
                <Car className="h-6 w-6 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">
                  Copiloto<span className="text-amber-400">Rota</span>
                </h1>

                {/* Badge Discreta do Status do Plano */}
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black transition-all hover:scale-105 active:scale-95 ${badgeStyle}`}
                  title="Clique para ver detalhes do plano ou renovar via PIX"
                >
                  <Zap className="h-3 w-3" />
                  {subscriptionStatus.badgeLabel}
                </button>
              </div>
              <p className="text-xs font-medium text-slate-400">
                Lucro Real & Manutenção Inteligente
              </p>
            </div>
          </div>

          {/* Botões do Topo: Conta e Ajustar Veículo */}
          <div className="flex items-center gap-2">
            {onOpenTour && (
              <button
                onClick={onOpenTour}
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 sm:px-3 py-2 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20 active:scale-95"
                title="Abrir passo a passo interativo"
              >
                <HelpCircle className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Como</span> Usar
              </button>
            )}

            <button
              onClick={onOpenAuthModal}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                currentUser
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/30"
                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-400/50 hover:bg-slate-800"
              }`}
              title="Gerenciar conta e sincronização"
            >
              {currentUser ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="max-w-[80px] sm:max-w-[120px] truncate">
                    {currentUser.email?.split("@")[0] || "Conta"}
                  </span>
                </>
              ) : (
                <>
                  <User className="h-3.5 w-3.5 text-amber-400" />
                  <span>Entrar</span>
                </>
              )}
            </button>

            <button
              onClick={onOpenVehicleModal}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition-all hover:border-amber-400/50 hover:bg-slate-800 active:scale-95"
              title="Editar parâmetros do veículo"
            >
              <Wrench className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Ajustar</span> Veículo
            </button>
          </div>
        </div>

        {/* Banner com resumo rápido do veículo ativo */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-900/60 px-3.5 py-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-white">{vehicle.model_name}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-sky-400" />
              <strong className="text-slate-200">
                {vehicle.current_odometer.toLocaleString("pt-BR")}
              </strong>{" "}
              km
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="h-3.5 w-3.5 text-amber-400" />
              <strong className="text-slate-200">
                {vehicle.avg_km_per_liter}
              </strong>{" "}
              km/L
            </span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline">
              Gasolina:{" "}
              <strong className="text-slate-200">
                R$ {vehicle.fuel_price.toFixed(2)}
              </strong>
              /L
            </span>
          </div>
        </div>

        {/* Abas de Navegação Principal */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-1">
          <button
            onClick={() => onTabChange("closure")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "closure"
                ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span className="truncate">Fechamento</span>
          </button>

          <button
            onClick={() => onTabChange("dispatcher")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "dispatcher"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Truck className="h-4 w-4 text-indigo-300" />
            <span className="truncate">Despachante</span>
          </button>

          <button
            onClick={() => onTabChange("vault")}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "vault"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span className="truncate">Cofre Anti-Bloqueio</span>
          </button>
        </div>
      </div>
    </header>
  );
};
