'use client';

import React, { useState } from 'react';
import { X, Check, Bike, Car, Gauge, Fuel, DollarSign, Calendar } from 'lucide-react';
import type { Vehicle } from '@/types/database.types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  onSave: (updatedVehicle: Vehicle) => void;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  vehicle,
  onSave,
}) => {
  const [formData, setFormData] = useState<Vehicle>({ ...vehicle });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
              {formData.vehicle_type === 'moto' ? <Bike className="h-6 w-6" /> : <Car className="h-6 w-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Parâmetros do seu Veículo</h2>
              <p className="text-xs text-slate-400">Usado no cálculo exato de combustível e custos fixos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Tipo de Veículo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tipo de Veículo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, vehicle_type: 'moto' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                  formData.vehicle_type === 'moto'
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Bike className="h-5 w-5" />
                Moto / Entrega
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, vehicle_type: 'carro' })}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${
                  formData.vehicle_type === 'carro'
                    ? 'border-amber-400 bg-amber-400/15 text-amber-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Car className="h-5 w-5" />
                Carro / App
              </button>
            </div>
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Modelo do Veículo
            </label>
            <input
              type="text"
              required
              value={formData.model_name}
              onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
              placeholder="Ex: Honda CG 160 Fan, Factor 150, Onix Plus..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Preço Combustível */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Fuel className="h-3.5 w-3.5 text-amber-400" />
                Gasolina (R$/L)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                value={formData.fuel_price}
                onChange={(e) => setFormData({ ...formData, fuel_price: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            {/* Consumo Médio */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-sky-400" />
                Consumo (km/L)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                required
                value={formData.avg_km_per_liter}
                onChange={(e) => setFormData({ ...formData, avg_km_per_liter: parseFloat(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Custos Fixos Mensais */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Fixo Mensal (R$)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formData.fixed_monthly_cost}
                onChange={(e) => setFormData({ ...formData, fixed_monthly_cost: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                title="Seguro, IPVA, parcelas, MEI, rastreador somados"
              />
              <span className="text-[10px] text-slate-500">Seguro, IPVA, MEI</span>
            </div>

            {/* Meta Mensal de KM */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-purple-400" />
                Meta KM/Mês
              </label>
              <input
                type="number"
                step="50"
                min="100"
                value={formData.monthly_km_goal || 2500}
                onChange={(e) => setFormData({ ...formData, monthly_km_goal: parseFloat(e.target.value) || 2500 })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                title="Quilometragem esperada no mês para diluir o custo fixo"
              />
              <span className="text-[10px] text-slate-500">Para ratear custos</span>
            </div>
          </div>

          {/* Odômetro Atual */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-amber-400" />
              Odômetro Atual no Painel (km)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={formData.current_odometer}
              onChange={(e) => setFormData({ ...formData, current_odometer: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base font-bold text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-bold text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20 active:scale-95"
            >
              <Check className="h-4 w-4" />
              Salvar Veículo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
