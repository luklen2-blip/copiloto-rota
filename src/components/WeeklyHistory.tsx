'use client';

import React from 'react';
import { Calendar, TrendingUp, DollarSign, Gauge, Award, ChevronRight } from 'lucide-react';
import type { DailyLog } from '@/types/database.types';

interface WeeklyHistoryProps {
  logs: DailyLog[];
  onSelectLog?: (log: DailyLog) => void;
}

export const WeeklyHistory: React.FC<WeeklyHistoryProps> = ({ logs, onSelectLog }) => {
  const displayLogs = logs.slice(0, 7);

  const totalGross = displayLogs.reduce((acc, l) => acc + (Number(l.gross_earnings) || 0), 0);
  const totalNet = displayLogs.reduce((acc, l) => acc + (Number(l.net_profit) || 0), 0);
  const totalKm = displayLogs.reduce((acc, l) => acc + (Number(l.km_driven) || 0), 0);
  const avgProfitPerKm = totalKm > 0 ? totalNet / totalKm : 0;

  // Valor máximo para normalizar a altura das barras do gráfico
  const maxNet = Math.max(...displayLogs.map((l) => Number(l.net_profit) || 0), 100);

  // Formatação de data amigável (ex: Sex, 14/11)
  const formatDayName = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const weekday = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Cabeçalho do Histórico */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white sm:text-lg">
              Evolução dos Últimos 7 Lançamentos
            </h3>
            <p className="text-xs text-slate-400">
              Acompanhe seu lucro real acumulado e rentabilidade por km
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-400">
            <Award className="h-3.5 w-3.5" />
            Líquido Total: R$ {totalNet.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Gráfico de Barras Responsivo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-3">
          <span>Lucro Líquido Real por Turno (R$)</span>
          <span className="text-[11px] text-slate-400">
            Média: R$ {avgProfitPerKm.toFixed(2)}/km
          </span>
        </div>

        <div className="flex items-end justify-between gap-2 h-36 pt-4 px-2">
          {displayLogs.slice().reverse().map((log, idx) => {
            const net = Number(log.net_profit) || 0;
            const heightPercent = Math.max(12, Math.min(100, (net / maxNet) * 100));
            const isGood = net >= 100;

            return (
              <div
                key={log.id || idx}
                className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                onClick={() => onSelectLog && onSelectLog(log)}
                title={`${log.platform}: R$ ${net.toFixed(2)} líquido (${log.km_driven} km)`}
              >
                <span className="text-[9px] font-bold text-slate-300 group-hover:text-amber-400 transition-colors">
                  {net.toFixed(0)}
                </span>
                <div className="w-full max-w-[28px] bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end">
                  <div
                    className={`w-full transition-all duration-500 rounded-t-lg ${
                      isGood
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-emerald-300'
                        : 'bg-gradient-to-t from-amber-600 to-amber-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-white truncate max-w-[36px]">
                  {log.platform.slice(0, 4)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lista Detalhada dos Últimos Dias */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Detalhamento dos Lançamentos
        </h4>

        {displayLogs.map((log) => {
          const net = Number(log.net_profit) || 0;
          const km = Number(log.km_driven) || 0;
          const profitPerKm = km > 0 ? net / km : 0;
          const isGoodMargin = profitPerKm >= 0.80;

          return (
            <div
              key={log.id}
              onClick={() => onSelectLog && onSelectLog(log)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-3 hover:border-slate-700 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                  <Calendar className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {formatDayName(log.log_date)}
                    </span>
                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
                      {log.platform}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>Bruto: R$ {Number(log.gross_earnings).toFixed(2)}</span>
                    <span>•</span>
                    <span>{km.toFixed(0)} km</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <span className="block text-sm font-black text-emerald-400">
                    R$ {net.toFixed(2)}
                  </span>
                  <span
                    className={`block text-[10px] font-bold ${
                      isGoodMargin ? 'text-emerald-400/80' : 'text-amber-400'
                    }`}
                  >
                    R$ {profitPerKm.toFixed(2)}/km
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
