'use client';

import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Fuel, Wrench, ShieldCheck, Utensils, Gauge, Sparkles } from 'lucide-react';
import type { DailyClosureResult } from '@/services/financialEngine';

interface ProfitRadioReportProps {
  closure: DailyClosureResult;
  aiMessage?: string;
}

export const ProfitRadioReport: React.FC<ProfitRadioReportProps> = ({ closure, aiMessage }) => {
  const isHealthyMargin = closure.net_profit_per_km >= 0.80;
  const isPositiveProfit = closure.net_profit > 0;

  return (
    <div className="space-y-4">
      {/* Mensagem da IA confirmando os dados identificados */}
      {aiMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 text-xs text-sky-200">
          <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-sky-300 block mb-0.5">Visão do Copiloto IA:</span>
            <p className="leading-relaxed">{aiMessage}</p>
          </div>
        </div>
      )}

      {/* Alertas Proativos do Motor Financeiro */}
      {closure.alerts.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Alertas Críticos e Atenção do Dia
          </div>
          <div className="space-y-1.5">
            {closure.alerts.map((alert, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 rounded-xl bg-slate-950/60 p-2.5 text-xs text-slate-200 border border-slate-800"
              >
                <span className="leading-relaxed">{alert}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Raio-X: Comparativo Faturamento Bruto vs Lucro Líquido Real */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Raio-X do Turno ({closure.platform})
            </span>
            <h3 className="text-xl font-black text-white">Lucro Líquido Real</h3>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-black shadow-inner ${
              isHealthyMargin
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            R$ {closure.net_profit_per_km.toFixed(2)}/km
          </div>
        </div>

        {/* Números Principais em Destaque */}
        <div className="grid grid-cols-2 gap-3 my-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">
              Faturamento Bruto
            </span>
            <div className="text-2xl font-black text-slate-100 sm:text-3xl">
              R$ {closure.gross_earnings.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              {closure.km_driven.toFixed(1)} km rodados
            </span>
          </div>

          <div
            className={`rounded-2xl border p-4 shadow-lg ${
              isPositiveProfit
                ? 'border-emerald-500/40 bg-emerald-950/20'
                : 'border-rose-500/40 bg-rose-950/20'
            }`}
          >
            <span className="text-[11px] font-semibold text-slate-300 block mb-1">
              Líquido no Bolso (Real)
            </span>
            <div
              className={`text-2xl font-black sm:text-3xl ${
                isPositiveProfit ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              R$ {closure.net_profit.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Margem real: {closure.profit_margin_percent.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Detalhamento dos Descontos e Custos Reais */}
        <div className="space-y-3 pt-2 border-t border-slate-800/80">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
            Para onde foi o restante do dinheiro:
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Combustível */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Fuel className="h-4 w-4 text-amber-400" />
                Combustível
              </span>
              <strong className="text-white">R$ {closure.fuel_spent.toFixed(2)}</strong>
            </div>

            {/* Desgaste Mecânico / Caixinha */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Wrench className="h-4 w-4 text-sky-400" />
                Caixinha Peças
              </span>
              <strong className="text-sky-400">R$ {closure.calculated_wear_cost.toFixed(2)}</strong>
            </div>

            {/* Custos Fixos Diluídos */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                Fixo Diluído
              </span>
              <strong className="text-white">R$ {closure.diluted_fixed_cost.toFixed(2)}</strong>
            </div>

            {/* Alimentação e outros */}
            <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-2.5">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Utensils className="h-4 w-4 text-rose-400" />
                Alimentação
              </span>
              <strong className="text-white">R$ {closure.food_other_spent.toFixed(2)}</strong>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Gauge className="h-4 w-4 text-amber-400" />
              Novo Odômetro do Veículo:
            </span>
            <strong className="text-amber-400 font-bold">{closure.new_odometer.toLocaleString('pt-BR')} km</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
