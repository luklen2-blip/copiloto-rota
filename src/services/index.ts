/**
 * Camada de serviços para a aplicação Copiloto-Rota
 */

export * from './financialEngine';
export * from './aiExtractor';
export * from './supabaseSync';

export const SERVICES_CONFIG = {
  version: '2.1.0',
  description: 'Serviços de IA Gemini 2.5, motor financeiro e sincronização Supabase do Copiloto-Rota',
};
