'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Bike, 
  Mic, 
  DollarSign, 
  Wrench, 
  ShieldAlert, 
  Smartphone, 
  ChevronRight, 
  ChevronLeft, 
  X,
  CheckCircle2
} from 'lucide-react';

interface InteractiveTourProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample?: (text: string) => void;
  onOpenVehicleModal?: () => void;
}

export function InteractiveTour({ 
  isOpen, 
  onClose, 
  onSelectSample, 
  onOpenVehicleModal 
}: InteractiveTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const steps = [
    {
      title: "1. Bem-vindo ao Copiloto-Rota! 🛵",
      badge: "Início Rápido",
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            O <strong>Copiloto-Rota</strong> foi criado sob medida para você que roda de moto ou carro por aplicativo (iFood, Uber, 99, Zé Delivery).
          </p>
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-300 space-y-1.5">
            <p className="font-semibold text-amber-300">Aqui você descobre a verdade:</p>
            <p>❌ <strong>Faturamento Bruto</strong> não é o que sobra no seu bolso.</p>
            <p>✅ <strong>Lucro Líquido Real</strong> desconta gasolina, custos fixos e o desgaste invisível de cada peça da sua máquina.</p>
          </div>
        </div>
      ),
      actionLabel: "Começar Passo a Passo →",
      onAction: () => setCurrentStep(1),
    },
    {
      title: "2. Configure sua Moto ou Carro ⚙️",
      badge: "Personalização",
      icon: <Bike className="w-8 h-8 text-sky-400" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Defina o consumo médio em km/L, o preço do combustível e o odômetro inicial.
          </p>
          <div className="bg-sky-950/40 border border-sky-800/50 rounded-xl p-3 text-xs text-sky-200">
            <p className="font-bold mb-1">Dica de Ouro:</p>
            Mantenha o odômetro atualizado para o Copiloto avisar exatamente quando trocar óleo, pneus e relação antes que quebrem na rua!
          </div>
          {onOpenVehicleModal && (
            <button
              onClick={() => {
                onClose();
                onOpenVehicleModal();
              }}
              className="w-full py-2 bg-sky-600/30 hover:bg-sky-600/50 border border-sky-500 text-sky-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Bike className="w-4 h-4" /> Abrir Ajuste do Veículo Agora
            </button>
          )}
        </div>
      ),
      actionLabel: "Próximo: Fechamento com IA →",
      onAction: () => setCurrentStep(2),
    },
    {
      title: "3. Fechamento Zero Fricção com IA 🎙️📸",
      badge: "Inteligência Artificial",
      icon: <Mic className="w-8 h-8 text-emerald-400" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Você terminou o dia cansado? Não precisa digitar nada no teclado:
          </p>
          <ul className="text-xs text-slate-300 space-y-2 list-none">
            <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700">
              <Mic className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span><strong>Voz Direta:</strong> Clique no microfone e fale: <em>&ldquo;Fiz 210 no iFood, rodei 120 km e gastei 35 de gasolina&rdquo;</em>.</span>
            </li>
            <li className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700">
              <Smartphone className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
              <span><strong>Print da Tela:</strong> Tire print dos ganhos no app do Uber/iFood e suba a imagem. O Gemini extrai tudo sozinho!</span>
            </li>
          </ul>
          {onSelectSample && (
            <button
              onClick={() => {
                onSelectSample("Fiz 190 no iFood hoje, rodei 110 km e coloquei 30 de gasolina");
                onClose();
              }}
              className="w-full py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500 text-emerald-200 text-xs font-semibold rounded-lg transition-colors"
            >
              🚀 Preencher Exemplo no Formulário Agora
            </button>
          )}
        </div>
      ),
      actionLabel: "Próximo: Lucro Real & Caixinha →",
      onAction: () => setCurrentStep(3),
    },
    {
      title: "4. Raio-X & Caixinha de Manutenção 💰🔧",
      badge: "Controle Financeiro",
      icon: <Wrench className="w-8 h-8 text-amber-400" />,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            A cada quilômetro rodado, o sistema calcula centavos de desgaste invisível:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-0.5">Óleo Motor</span>
              <strong className="text-amber-300">~R$ 0,03 / km</strong>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-slate-400 block mb-0.5">Kit Relação</span>
              <strong className="text-amber-300">~R$ 0,012 / km</strong>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            O dinheiro da caixinha vai se acumulando na tela. Quando a peça vence, você aperta <strong>&ldquo;Registrar Troca&rdquo;</strong> e já tem o dinheiro reservado!
          </p>
        </div>
      ),
      actionLabel: "Próximo: Cofre Anti-Bloqueio →",
      onAction: () => setCurrentStep(4),
    },
    {
      title: "5. Cofre Anti-Bloqueio & App no Celular 🛡️📱",
      badge: "Proteção & Instalação",
      icon: <ShieldAlert className="w-8 h-8 text-red-400" />,
      content: (
        <div className="space-y-3">
          <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3 text-xs text-red-200">
            <strong className="block text-red-300 mb-1">Cofre Anti-Bloqueio (IA Jurídica):</strong>
            Cliente agiu de má fé? O app te deu suspensão injusta? Descreva o fato na aba &ldquo;Cofre&rdquo; e gere um recurso formal fundamentado no Código Civil e Defesa do Consumidor.
          </div>
          <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-3 text-xs text-emerald-200 space-y-1">
            <strong className="block text-emerald-300">Instalar como App no Celular (PWA):</strong>
            <p>1. Abra o link no Chrome ou Safari do celular.</p>
            <p>2. Toque em <strong>Compartilhar / Opções</strong> &gt; <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong>.</p>
            <p>3. Ele abre em tela cheia como se fosse baixado na Google Play ou App Store!</p>
          </div>
        </div>
      ),
      actionLabel: "🎉 Concluir e Começar a Usar!",
      onAction: () => {
        try {
          localStorage.setItem('copiloto_tour_completed', 'true');
        } catch {
          // ignora
        }
        onClose();
      },
    }
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
              {current.badge}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Passo {currentStep + 1} de {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar Guia"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso Interativa */}
        <div className="flex gap-1.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
          {steps.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-full flex-1 rounded-full cursor-pointer transition-all duration-300 ${
                idx <= currentStep ? 'bg-amber-400' : 'bg-slate-700/60 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Conteúdo do Passo */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-800 rounded-2xl border border-slate-700/80 shrink-0">
              {current.icon}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">
              {current.title}
            </h2>
          </div>

          <div className="pt-1">
            {current.content}
          </div>
        </div>

        {/* Rodapé com Navegação */}
        <div className="border-t border-slate-800 pt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors ${
              currentStep === 0 
                ? 'opacity-30 cursor-not-allowed text-slate-500' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> Voltar
          </button>

          <button
            onClick={current.onAction}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {current.actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
