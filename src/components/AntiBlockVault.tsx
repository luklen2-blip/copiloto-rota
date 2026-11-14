'use client';

import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, Sparkles, Loader2, AlertCircle, Send, FileText } from 'lucide-react';

interface AntiBlockVaultProps {
  defaultPlatform?: string;
  isPro?: boolean;
  onOpenUpgradeModal?: () => void;
}

export const AntiBlockVault: React.FC<AntiBlockVaultProps> = ({
  defaultPlatform = 'iFood',
  isPro = true,
  onOpenUpgradeModal,
}) => {
  const [platform, setPlatform] = useState(defaultPlatform);
  const [incidentType, setIncidentType] = useState('Cliente recusou dar o código');
  const [orderOrTripId, setOrderOrTripId] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedDefense, setGeneratedDefense] = useState<string | null>(null);
  const [tips, setTips] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const quickIncidents = [
    'Cliente recusou informar código de entrega',
    'Cliente alegou falsamente que não recebeu o pedido',
    'Bloqueio ou suspensão temporária sem justificativa',
    'Cancelamento indevido de corrida pelo passageiro em trânsito',
    'Cobrança indevida de taxa de cancelamento/avaria',
  ];

  const handleSelectQuick = (incident: string) => {
    setIncidentType(incident);
    if (!description) {
      setDescription(`Fui afetado pelo seguinte problema: ${incident}. Adotei todos os procedimentos operacionais adequados, aguardei no local e tentei contato com o cliente.`);
    }
  };

  const handleGenerateDefense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro && onOpenUpgradeModal) {
      onOpenUpgradeModal();
      return;
    }

    if (!description.trim()) return;

    setIsLoading(true);
    setCopied(false);

    try {
      const res = await fetch('/api/generate-defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          incidentType,
          orderOrTripId: orderOrTripId.trim() || undefined,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.generated_defense) {
        setGeneratedDefense(data.generated_defense);
        setTips(data.tips || []);
      } else {
        alert(data.error || 'Erro ao gerar defesa.');
      }
    } catch (err) {
      console.error('Erro na requisição da defesa:', err);
      alert('Falha na comunicação com o gerador de defesa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedDefense) return;
    navigator.clipboard.writeText(generatedDefense);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Banner de Apresentação */}
      <div className="rounded-3xl border border-sky-500/30 bg-gradient-to-b from-sky-950/40 to-slate-900 p-5 sm:p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white sm:text-xl">
              Cofre Anti-Bloqueio & Defesa Jurídica
            </h2>
            <p className="text-xs text-sky-300">
              Gere recursos técnicos, formais e objetivos para suporte da plataforma e Reclame Aqui
            </p>
          </div>
        </div>

        <form onSubmit={handleGenerateDefense} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plataforma */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Plataforma Afetada
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-semibold text-white focus:border-sky-400 focus:outline-none"
              >
                <option value="iFood">iFood</option>
                <option value="Uber">Uber</option>
                <option value="99">99</option>
                <option value="Rappi">Rappi</option>
                <option value="Lalamove">Lalamove</option>
                <option value="Zé Delivery">Zé Delivery</option>
                <option value="Outra Plataforma">Outra Plataforma</option>
              </select>
            </div>

            {/* Código / ID do Pedido */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                ID da Corrida / Pedido (Opcional)
              </label>
              <input
                type="text"
                value={orderOrTripId}
                onChange={(e) => setOrderOrTripId(e.target.value)}
                placeholder="Ex: #4819 ou Uber Trip ID"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-sky-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Atalhos de Incidentes Comuns */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Motivo do Ocorrido (Toque para preencher):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {quickIncidents.map((incident, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleSelectQuick(incident)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all text-left ${
                    incidentType === incident
                      ? 'border-sky-400 bg-sky-500/20 text-sky-200'
                      : 'border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {incident}
                </button>
              ))}
            </div>
          </div>

          {/* Relato em Texto */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Seu relato do que realmente aconteceu:</span>
              <span className="text-[10px] text-slate-500 lowercase">seja o mais claro possível</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: O cliente se recusou a passar o código de 4 dígitos. Esperei 10 minutos no local, mandei mensagem no chat da plataforma e o suporte não respondeu no momento..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 p-3.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>

          {/* Botão de Geração */}
          <button
            type="submit"
            disabled={isLoading || !description.trim()}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-sky-500 py-3.5 px-4 text-base font-black text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-400 active:scale-98 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Redigindo Defesa com IA...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Gerar Defesa Técnica Pronta
              </>
            )}
          </button>
        </form>
      </div>

      {/* Resultado da Minuta Gerada */}
      {generatedDefense && (
        <div className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Minuta de Contestação Pronta
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all ${
                copied
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'border border-slate-700 bg-slate-800 text-white hover:bg-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copiado com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Texto Completo
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
            {generatedDefense}
          </div>

          {tips.length > 0 && (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-4 space-y-1.5">
              <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                Recomendações Práticas do Copiloto:
              </span>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
