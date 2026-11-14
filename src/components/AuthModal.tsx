'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, UserCheck, LogIn, UserPlus, LogOut, CheckCircle2, AlertCircle, Loader2, Database } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { seedInitialUserData } from '@/services/supabaseSync';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; email?: string } | null;
  onAuthSuccess: (user: { id: string; email?: string } | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Modo Offline / Simulação Local
        const mockUser = {
          id: `local-${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
          email,
        };
        onAuthSuccess(mockUser);
        setSuccessMessage('Conectado em Modo Local com sucesso!');
        setTimeout(() => {
          onClose();
        }, 1200);
        return;
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Cria o veículo e as peças padrão automaticamente no Supabase
          await seedInitialUserData(data.user.id);
          onAuthSuccess({ id: data.user.id, email: data.user.email });
          setSuccessMessage('Conta criada com sucesso! Veículo e caixinha de peças inicializados.');
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          onAuthSuccess({ id: data.user.id, email: data.user.email });
          setSuccessMessage('Login efetuado com sucesso!');
          setTimeout(() => {
            onClose();
          }, 1000);
        }
      }
    } catch (err: unknown) {
      console.error('Erro de autenticação:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao processar autenticação';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      onAuthSuccess(null);
      setSuccessMessage('Você saiu da sua conta.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Erro ao sair:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {currentUser ? 'Sua Conta Copiloto' : mode === 'login' ? 'Entrar no Copiloto' : 'Criar Nova Conta'}
              </h2>
              <p className="text-xs text-slate-400">
                Sincronize seus dados em múltiplos celulares e na nuvem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status da Conexão Supabase */}
        <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-950 px-3.5 py-2 text-xs border border-slate-800">
          <span className="flex items-center gap-2 text-slate-400">
            <Database className="h-4 w-4 text-sky-400" />
            Banco de Dados:
          </span>
          <span
            className={`font-bold ${
              isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isSupabaseConfigured ? '● Supabase Conectado' : '○ Modo Local (Offline-first)'}
          </span>
        </div>

        {currentUser ? (
          /* Usuário já conectado */
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Conectado como:
              </span>
              <p className="text-base font-bold text-white break-all">
                {currentUser.email || 'Condutor Local'}
              </p>
              <span className="text-xs text-slate-400 block mt-1">
                Seus veículos, caixinha de peças e lançamentos diários estão salvos e sincronizados.
              </span>
            </div>

            <button
              onClick={handleSignOut}
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/30 py-3 text-sm font-bold text-rose-400 hover:bg-rose-900/40 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </button>
          </div>
        ) : (
          /* Formulário de Login / Cadastro */
          <div className="mt-5 space-y-4">
            {/* Alternador Login / Cadastro */}
            <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'login'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Já tenho conta
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Criar cadastro
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-400" />
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita sua senha"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20 active:scale-95 disabled:opacity-50 mt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    Entrar na Conta
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Cadastrar e Inicializar Veículo
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
