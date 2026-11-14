'use client';

import React from 'react';
import { PiggyBank, RefreshCw, CheckCircle2, AlertCircle, Wrench, ShieldAlert } from 'lucide-react';
import type { MaintenanceItem, Vehicle } from '@/types/database.types';

interface MaintenanceBoxProps {
  vehicle: Vehicle;
  items: MaintenanceItem[];
  onRegisterReplacement: (itemId: string) => void;
}

export const MaintenanceBox: React.FC<MaintenanceBoxProps> = ({
  vehicle,
  items,
  onRegisterReplacement,
}) => {
  const totalReserved = items.reduce((acc, item) => acc + (Number(item.reserved_balance) || 0), 0);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Cabeçalho da Caixinha */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white sm:text-lg">
              Caixinha de Manutenção
            </h3>
            <p className="text-xs text-slate-400">
              Saldo guardado automaticamente a cada km rodado
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-500/30 bg-sky-950/30 px-4 py-2 text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
            Saldo Total Caixinha
          </span>
          <span className="text-xl font-black text-sky-400 sm:text-2xl">
            R$ {totalReserved.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Lista de Peças e Barras de Desgaste */}
      <div className="space-y-4">
        {items.map((item) => {
          const currentOdometer = Number(vehicle.current_odometer || 0);
          const lastChanged = Number(item.last_changed_odometer || 0);
          const kmUsed = Math.max(0, currentOdometer - lastChanged);
          const lifespan = item.lifespan_km > 0 ? item.lifespan_km : 1000;
          const remainingKm = lifespan - kmUsed;
          const percentUsed = Math.min(100, Math.max(0, (kmUsed / lifespan) * 100));
          const isOverdue = remainingKm <= 0;
          const isCritical = remainingKm > 0 && (remainingKm / lifespan) <= 0.15;

          // Cores dinâmicas da barra
          let barColor = 'bg-emerald-500';
          let badgeText = `${remainingKm.toLocaleString('pt-BR')} km restantes`;
          let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

          if (isOverdue) {
            barColor = 'bg-rose-500';
            badgeText = `VENCIDO (${Math.abs(remainingKm).toLocaleString('pt-BR')} km a mais)`;
            badgeColor = 'text-rose-400 bg-rose-500/20 border-rose-500/40 font-black';
          } else if (isCritical) {
            barColor = 'bg-amber-400';
            badgeText = `CRÍTICO (${remainingKm.toLocaleString('pt-BR')} km)`;
            badgeColor = 'text-amber-400 bg-amber-400/20 border-amber-400/40 font-bold';
          }

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition-all ${
                isOverdue
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isCritical
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800 bg-slate-950/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {item.item_name}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      Custo estimado troca: R$ {item.replacement_cost.toFixed(2)}
                    </span>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[11px] ${badgeColor}`}
                >
                  {isOverdue ? (
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                  ) : isCritical ? (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  {badgeText}
                </span>
              </div>

              {/* Barra de Progresso Visual de Desgaste */}
              <div className="my-3">
                <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                  <span>Desgaste: {percentUsed.toFixed(0)}%</span>
                  <span>{kmUsed} / {lifespan} km</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
              </div>

              {/* Saldo da Peça e Botão de Troca Realizada */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Caixinha desta peça:</span>
                  <strong className="text-white font-bold text-sm">
                    R$ {(Number(item.reserved_balance) || 0).toFixed(2)}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={() => onRegisterReplacement(item.id)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 font-bold text-xs text-slate-200 transition-all hover:border-amber-400 hover:bg-slate-800 hover:text-white active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
                  Registrar Troca
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
