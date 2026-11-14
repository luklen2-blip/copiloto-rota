import type { Subscription } from '@/types/database.types';

export const SUBSCRIPTION_STORAGE_KEY = 'copiloto_rota_subscription_v1';

export const DEFAULT_TRIAL_SUBSCRIPTION: Subscription = {
  id: 'local-trial-sub',
  user_id: 'local-user',
  email: null,
  plan_status: 'trial',
  trial_ends_at: '2099-12-31T23:59:59.000Z',
  current_period_end: null,
  updated_at: '2026-01-01T00:00:00.000Z',
};

export function createDefaultTrialSubscription(): Subscription {
  return {
    id: 'local-trial-sub',
    user_id: 'local-user',
    email: null,
    plan_status: 'trial',
    trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    current_period_end: null,
    updated_at: new Date().toISOString(),
  };
}

export interface SubscriptionStatusInfo {
  isPro: boolean;
  isTrial: boolean;
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  badgeLabel: string;
  badgeVariant: 'emerald' | 'amber' | 'rose';
}

/**
 * Avalia o status da assinatura e se o condutor tem acesso aos recursos Pro.
 * Suporta passagem de currentTimeMs para evitar alertas de hidratação ou prerender do Next.js.
 */
export function getSubscriptionStatus(
  sub?: Subscription | null,
  currentTimeMs?: number
): SubscriptionStatusInfo {
  const currentSub = sub || DEFAULT_TRIAL_SUBSCRIPTION;

  // 1. Assinatura Paga Ativa (R$ 19,90/mês)
  if (currentSub.plan_status === 'active') {
    return {
      isPro: true,
      isTrial: false,
      isActive: true,
      isExpired: false,
      daysRemaining: 30,
      badgeLabel: 'Plano Pro Ativo',
      badgeVariant: 'emerald',
    };
  }

  // 2. Período de Teste Grátis (7 dias)
  if (currentSub.plan_status === 'trial') {
    const trialEndMs = new Date(currentSub.trial_ends_at).getTime();
    const nowMs = currentTimeMs !== undefined ? currentTimeMs : (typeof window !== 'undefined' ? Date.now() : 0);

    // Se estiver em SSR estático sem timestamp disponível
    if (!nowMs) {
      return {
        isPro: true,
        isTrial: true,
        isActive: false,
        isExpired: false,
        daysRemaining: 7,
        badgeLabel: 'Teste Grátis: 7 dias',
        badgeVariant: 'amber',
      };
    }

    const diffMs = trialEndMs - nowMs;
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    if (daysRemaining > 0) {
      return {
        isPro: true,
        isTrial: true,
        isActive: false,
        isExpired: false,
        daysRemaining,
        badgeLabel: `Teste Grátis: ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
        badgeVariant: 'amber',
      };
    }

    return {
      isPro: false,
      isTrial: true,
      isActive: false,
      isExpired: true,
      daysRemaining: 0,
      badgeLabel: 'Teste Expirado',
      badgeVariant: 'rose',
    };
  }

  // 3. Expirado ou Cancelado
  return {
    isPro: false,
    isTrial: false,
    isActive: false,
    isExpired: true,
    daysRemaining: 0,
    badgeLabel: 'Plano Expirado',
    badgeVariant: 'rose',
  };
}

export function getStoredSubscription(): Subscription {
  if (typeof window === 'undefined') return DEFAULT_TRIAL_SUBSCRIPTION;
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : createDefaultTrialSubscription();
  } catch {
    return createDefaultTrialSubscription();
  }
}

export function saveStoredSubscription(sub: Subscription): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(sub));
  } catch (err) {
    console.error('Erro ao salvar assinatura no localStorage:', err);
  }
}
