'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Copy, Sparkles, ShieldCheck, Zap, MessageCircle, QrCode, ArrowRight, Star } from 'lucide-react';
import { generatePixPayload, generatePixQrCodeDataUrl, generatePixProofWhatsAppUrl } from '@/lib/pix';
import type { Subscription } from '@/types/database.types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: { id: string; email?: string } | null;
  onSimulateActivation?: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSimulateActivation,
}) => {
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY || 'luklen2@gmail.com';
  const pixName = process.env.NEXT_PUBLIC_PIX_NAME || 'Luciano da Silva Sant Anna';
  const pixCity = process.env.NEXT_PUBLIC_PIX_CITY || 'Rio de Janeiro';
  const pixAmount = 19.90;

  const pixPayload = generatePixPayload({
    pixKey,
    name: pixName,
    city: pixCity,
    amount: pixAmount,
    txId: currentUser?.email?.slice(0, 10) || 'COPILOTO',
  });

  useEffect(() => {
    if (isOpen) {
      generatePixQrCodeDataUrl(pixPayload).then((dataUrl) => {
        setQrCodeDataUrl(dataUrl);
      });
    }
  }, [isOpen, pixPayload]);

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const whatsappUrl = generatePixProofWhatsAppUrl({
    email: currentUser?.email,
    amount: pixAmount,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Copiloto-Rota Pro</h2>
                <span className="rounded-full bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5">
                  7 DIAS GRÁTIS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Menos de R$ 0,66 por dia para proteger seu ganho na rua
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

        {/* Oferta Principal */}
        <div className="mt-4 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Assinatura Mensal
            </span>
            <div className="text-right">
              <span className="text-2xl font-black text-white sm:text-3xl">R$ 19,90</span>
              <span className="text-xs text-slate-400"> /mês</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Teste gratuitamente por 7 dias. Para continuar com acesso ilimitado a todas as ferramentas, faça o PIX e envie o comprovante:
          </p>

          {/* Vantagens Pro */}
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong>IA Multimodal Ilimitada:</strong> leitura de prints de tela do Uber/iFood/99</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong>Gravação por Voz Nativa</strong> sem limites de lançamentos</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong>Cofre Anti-Bloqueio:</strong> defesas jurídicas prontas para recursos</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
              <span><strong>Caixinha de Peças:</strong> odômetro e provisão de manutenção em tempo real</span>
            </li>
          </ul>
        </div>

        {/* Área do PIX */}
        <div className="mt-5 space-y-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 text-amber-400">
              <QrCode className="h-4 w-4" />
              Pague com PIX Direto (R$ 19,90)
            </span>
            <span className="text-[11px] text-slate-400">Liberação Rápida</span>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white max-w-[200px] mx-auto shadow-md">
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeDataUrl}
                alt="QR Code PIX Copiloto-Rota"
                className="w-44 h-44 object-contain rounded-lg"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-slate-900 text-xs font-bold">
                Gerando QR Code...
              </div>
            )}
            <span className="text-[10px] font-black text-slate-950 uppercase tracking-wider mt-1">
              Banco Central • PIX Oficial
            </span>
          </div>

          {/* Dados do Recebedor */}
          <div className="rounded-xl bg-slate-900/80 p-3 text-xs space-y-1 text-slate-300 border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Recebedor:</span>
              <strong className="text-white">{pixName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Chave E-mail:</span>
              <strong className="text-amber-400">{pixKey}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cidade:</span>
              <span className="text-white">{pixCity}</span>
            </div>
          </div>

          {/* Botões de Cópia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyPayload}
              className={`flex items-center justify-center gap-2 rounded-xl py-3 px-3 text-xs font-bold transition-all ${
                copiedPayload
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
            >
              {copiedPayload ? (
                <>
                  <Check className="h-4 w-4" />
                  PIX Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Código PIX
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyKey}
              className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-3 text-xs font-bold transition-all ${
                copiedKey
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
                  : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {copiedKey ? (
                <>
                  <Check className="h-4 w-4" />
                  Chave Copiada!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Chave E-mail
                </>
              )}
            </button>
          </div>

          {/* Botão Enviar Comprovante no WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-4 text-sm font-black text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 transition-all active:scale-95 text-center"
          >
            <MessageCircle className="h-5 w-5" />
            Já paguei — Enviar Comprovante no WhatsApp
          </a>
        </div>

        {/* Botão de Teste Rápido (Modo Desenvolvedor / Homologação) */}
        {onSimulateActivation && (
          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => {
                onSimulateActivation();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400/80 hover:text-amber-300 hover:underline"
            >
              <Zap className="h-3.5 w-3.5" />
              ⚡ Ativar Plano Pro Agora (Modo de Teste / Demonstração)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
