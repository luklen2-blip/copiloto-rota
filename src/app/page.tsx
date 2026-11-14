'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { VehicleModal } from '@/components/VehicleModal';
import { AuthModal } from '@/components/AuthModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { InteractiveTour } from '@/components/InteractiveTour';
import { DailyClosureCard } from '@/components/DailyClosureCard';
import { ProfitRadioReport } from '@/components/ProfitRadioReport';
import { MaintenanceBox } from '@/components/MaintenanceBox';
import { WeeklyHistory } from '@/components/WeeklyHistory';
import { AntiBlockVault } from '@/components/AntiBlockVault';
import {
  getStoredVehicle,
  saveStoredVehicle,
  getStoredMaintenanceItems,
  saveStoredMaintenanceItems,
  getStoredActiveClosure,
  saveStoredActiveClosure,
  getStoredDailyHistory,
  addStoredDailyLog,
  INITIAL_VEHICLE,
  INITIAL_MAINTENANCE_ITEMS,
} from '@/lib/storage';
import {
  getSubscriptionStatus,
  getStoredSubscription,
  saveStoredSubscription,
  DEFAULT_TRIAL_SUBSCRIPTION,
} from '@/lib/subscription';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadUserData } from '@/services/supabaseSync';
import type { Vehicle, MaintenanceItem, DailyLog, Subscription } from '@/types/database.types';
import type { DailyClosureResult } from '@/services/financialEngine';

export default function HomePage() {
  const [vehicle, setVehicle] = useState<Vehicle>(INITIAL_VEHICLE);
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>(INITIAL_MAINTENANCE_ITEMS);
  const [activeClosure, setActiveClosure] = useState<DailyClosureResult | null>(null);
  const [weeklyLogs, setWeeklyLogs] = useState<DailyLog[]>([]);
  const [subscription, setSubscription] = useState<Subscription>(DEFAULT_TRIAL_SUBSCRIPTION);
  const [aiMessage, setAiMessage] = useState<string | undefined>();
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'closure' | 'vault'>('closure');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState<number | undefined>(undefined);

  const subscriptionStatus = getSubscriptionStatus(subscription, nowMs);

  // Carrega estado persistido do localStorage e sessão Supabase na montagem
  useEffect(() => {
    setNowMs(Date.now());
    setVehicle(getStoredVehicle());
    setMaintenanceItems(getStoredMaintenanceItems());
    setActiveClosure(getStoredActiveClosure());
    setWeeklyLogs(getStoredDailyHistory());
    setSubscription(getStoredSubscription());

    try {
      const tourDone = localStorage.getItem('copiloto_tour_completed');
      if (tourDone !== 'true') {
        const timer = setTimeout(() => setIsTourOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          const userObj = { id: data.user.id, email: data.user.email };
          setCurrentUser(userObj);
          loadUserData(data.user.id).then((loaded) => {
            setVehicle(loaded.vehicle);
            saveStoredVehicle(loaded.vehicle);
            setMaintenanceItems(loaded.maintenanceItems);
            saveStoredMaintenanceItems(loaded.maintenanceItems);
            if (loaded.weeklyLogs.length > 0) {
              setWeeklyLogs(loaded.weeklyLogs);
            }
            if (loaded.subscription) {
              setSubscription(loaded.subscription);
              saveStoredSubscription(loaded.subscription);
            }
          });
        }
      });
    }

    setMounted(true);
  }, []);

  // Ao autenticar com sucesso (Login / Cadastro)
  const handleAuthSuccess = async (user: { id: string; email?: string } | null) => {
    setCurrentUser(user);
    if (user && isSupabaseConfigured) {
      const loaded = await loadUserData(user.id);
      setVehicle(loaded.vehicle);
      saveStoredVehicle(loaded.vehicle);
      setMaintenanceItems(loaded.maintenanceItems);
      saveStoredMaintenanceItems(loaded.maintenanceItems);
      if (loaded.weeklyLogs.length > 0) {
        setWeeklyLogs(loaded.weeklyLogs);
      }
      if (loaded.subscription) {
        setSubscription(loaded.subscription);
        saveStoredSubscription(loaded.subscription);
      }
    }
  };

  // Simulação de ativação Pro (Modo Teste / Demonstração)
  const handleSimulateProActivation = () => {
    const activeSub: Subscription = {
      ...subscription,
      plan_status: 'active',
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };
    setSubscription(activeSub);
    saveStoredSubscription(activeSub);

    if (currentUser && isSupabaseConfigured && subscription.id && !subscription.id.startsWith('sub-local')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('subscriptions') as any)
        .update({
          plan_status: 'active',
          current_period_end: activeSub.current_period_end,
          updated_at: activeSub.updated_at,
        })
        .eq('id', subscription.id)
        .then(({ error }: { error?: { message: string } }) => {
          if (error) console.warn('Erro ao atualizar assinatura no Supabase:', error.message);
        });
    }

    alert('🎉 Plano Pro Ativado com Sucesso! Acesso ilimitado a todas as ferramentas liberado.');
  };

  // Processa o fechamento diário chamando a API integrada
  const handleProcessClosure = async (payload: {
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
  }) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/process-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          vehicle,
          maintenanceItems,
          userId: currentUser?.id,
          saveToSupabase: Boolean(currentUser && isSupabaseConfigured),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar fechamento diário');
      }

      const closure: DailyClosureResult = data.closure;
      setActiveClosure(closure);
      setAiMessage(data.ai_extractor?.summary_message);

      // Atualiza e persiste o novo odômetro do veículo
      const newVehicle = closure.updated_vehicle || {
        ...vehicle,
        current_odometer: closure.new_odometer,
      };
      setVehicle(newVehicle);
      saveStoredVehicle(newVehicle);

      // Atualiza e persiste os novos saldos das peças
      const newItems = closure.updated_maintenance_items || maintenanceItems;
      setMaintenanceItems(newItems);
      saveStoredMaintenanceItems(newItems);

      // Salva o fechamento ativo
      saveStoredActiveClosure(closure);

      // Atualiza o histórico dos últimos 7 dias
      const newLogItem: DailyLog = {
        id: `log-${Date.now()}`,
        user_id: currentUser?.id || 'local-user',
        log_date: closure.log_date,
        platform: closure.platform,
        gross_earnings: closure.gross_earnings,
        km_driven: closure.km_driven,
        fuel_spent: closure.fuel_spent,
        food_other_spent: closure.food_other_spent,
        calculated_wear_cost: closure.calculated_wear_cost,
        net_profit: closure.net_profit,
        raw_input_text: closure.raw_input_text,
        created_at: new Date().toISOString(),
      };
      const updatedHistory = addStoredDailyLog(newLogItem);
      setWeeklyLogs(updatedHistory);
    } catch (err) {
      console.error('Falha no fechamento diário:', err);
      alert(err instanceof Error ? err.message : 'Erro ao processar fechamento.');
    } finally {
      setIsLoading(false);
    }
  };

  // Salva alterações cadastrais do veículo
  const handleSaveVehicle = (updatedVehicle: Vehicle) => {
    setVehicle(updatedVehicle);
    saveStoredVehicle(updatedVehicle);

    if (currentUser && isSupabaseConfigured && updatedVehicle.id && !updatedVehicle.id.startsWith('sim-')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('vehicles') as any)
        .update(updatedVehicle)
        .eq('id', updatedVehicle.id)
        .then(({ error }: { error?: { message: string } }) => {
          if (error) console.warn('Erro ao atualizar veículo no Supabase:', error.message);
        });
    }
  };

  // Registra troca de peça preventiva
  const handleRegisterReplacement = (itemId: string) => {
    const targetItem = maintenanceItems.find((i) => i.id === itemId);
    const itemName = targetItem ? targetItem.item_name : 'Peça';

    if (
      !confirm(
        `Confirmar a troca física da peça "${itemName}"?\nO odômetro desta peça será atualizado para o km atual (${vehicle.current_odometer.toLocaleString('pt-BR')} km) e o saldo da caixinha será reiniciado.`
      )
    ) {
      return;
    }

    const updatedItems = maintenanceItems.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          last_changed_odometer: vehicle.current_odometer,
          reserved_balance: 0,
        };
      }
      return item;
    });

    setMaintenanceItems(updatedItems);
    saveStoredMaintenanceItems(updatedItems);

    if (currentUser && isSupabaseConfigured && itemId && !itemId.startsWith('sim-')) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from('maintenance_items') as any)
        .update({
          last_changed_odometer: vehicle.current_odometer,
          reserved_balance: 0,
        })
        .eq('id', itemId)
        .then(({ error }: { error?: { message: string } }) => {
          if (error) console.warn('Erro ao atualizar peça no Supabase:', error.message);
        });
    }

    if (activeClosure) {
      const refreshedAlerts = activeClosure.alerts.filter((a) => !a.includes(itemName));
      const refreshedClosure = { ...activeClosure, alerts: refreshedAlerts };
      setActiveClosure(refreshedClosure);
      saveStoredActiveClosure(refreshedClosure);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Carregando Copiloto-Rota...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Cabeçalho Fixo, Identidade, Badge Pro e Acesso a Conta */}
      <Header
        vehicle={vehicle}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        subscriptionStatus={subscriptionStatus}
        currentUser={currentUser}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 mx-auto w-full max-w-4xl p-4 sm:p-6 space-y-6">
        {activeTab === 'closure' ? (
          <>
            {/* 1. Card Principal de Fechamento com IA */}
            <DailyClosureCard
              onProcess={handleProcessClosure}
              isLoading={isLoading}
              isPro={subscriptionStatus.isPro}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
            />

            {/* 2. Painel de Resultado: Raio-X do Lucro Real (se houver fechamento) */}
            {activeClosure && (
              <ProfitRadioReport
                closure={activeClosure}
                aiMessage={aiMessage}
              />
            )}

            {/* 3. Evolução dos Últimos 7 Lançamentos */}
            <WeeklyHistory
              logs={weeklyLogs}
            />

            {/* 4. Caixinha de Manutenção & Odômetro */}
            <MaintenanceBox
              vehicle={vehicle}
              items={maintenanceItems}
              onRegisterReplacement={handleRegisterReplacement}
            />
          </>
        ) : (
          /* 5. Aba Cofre Anti-Bloqueio */
          <AntiBlockVault
            defaultPlatform={activeClosure?.platform || 'iFood'}
            isPro={subscriptionStatus.isPro}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />
        )}
      </main>

      {/* Modal de Ajuste de Veículo */}
      <VehicleModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        vehicle={vehicle}
        onSave={handleSaveVehicle}
      />

      {/* Modal de Autenticação Supabase */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Modal de Checkout PIX Direto (7 dias grátis + R$ 19,90/mês) */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        currentUser={currentUser}
        onSimulateActivation={handleSimulateProActivation}
      />

      {/* Passo a Passo Interativo para o Usuário */}
      <InteractiveTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onOpenVehicleModal={() => setIsVehicleModalOpen(true)}
        onSelectSample={(sampleText) => {
          handleProcessClosure({ text: sampleText });
        }}
      />

      {/* Rodapé Informativo com Links Legais LGPD e Guia Interativo */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium">
            <button
              onClick={() => setIsTourOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
            >
              📖 Passo a Passo Interativo
            </button>
            <span className="text-slate-700">•</span>
            <Link href="/termos" className="text-slate-400 hover:text-slate-200 transition-colors">
              Termos de Uso
            </Link>
            <span className="text-slate-700">•</span>
            <Link href="/privacidade" className="text-slate-400 hover:text-slate-200 transition-colors">
              Privacidade (LGPD)
            </Link>
            <span className="text-slate-700">•</span>
            <a
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-500/80 hover:text-emerald-400 font-mono text-[11px] transition-colors"
            >
              Monitor 24/7 (/api/health)
            </a>
          </div>

          <p className="font-semibold text-slate-400">
            Copiloto-Rota • Inteligência Financeira e Defesa para Motoristas e Entregadores
          </p>
          <p className="text-[11px] text-slate-600">
            Versão 2.0.0 • Deploy Contínuo 24/7 • Assinatura PIX Direto (R$ 19,90/mês) • 7 Dias Grátis
          </p>
        </div>
      </footer>
    </div>
  );
}
