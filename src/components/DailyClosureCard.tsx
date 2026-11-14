'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Image as ImageIcon, Send, Sparkles, X, Loader2, Zap } from 'lucide-react';

interface DailyClosureCardProps {
  onProcess: (payload: { text?: string; imageBase64?: string; imageMimeType?: string }) => Promise<void>;
  isLoading: boolean;
  isPro?: boolean;
  onOpenUpgradeModal?: () => void;
}

export const DailyClosureCard: React.FC<DailyClosureCardProps> = ({
  onProcess,
  isLoading,
  isPro = true,
  onOpenUpgradeModal,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Inicialização da Web Speech API se suportada
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setText(transcript);
        };

        recognition.onerror = (event: unknown) => {
          console.warn('Erro no reconhecimento de voz:', event);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!isPro && onOpenUpgradeModal) {
      onOpenUpgradeModal();
      return;
    }

    if (!speechSupported || !recognitionRef.current) {
      alert('Seu navegador não possui suporte à gravação de voz nativa. Você pode digitar diretamente no campo abaixo.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Erro ao iniciar gravação:', err);
        setIsRecording(false);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !imageBase64) return;
    onProcess({
      text: text.trim() || undefined,
      imageBase64: imageBase64 || undefined,
      imageMimeType: imageMimeType || undefined,
    });
  };

  const handleQuickExample = (exampleText: string) => {
    setText(exampleText);
    onProcess({ text: exampleText });
  };

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-5 shadow-xl sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-base font-bold text-white sm:text-lg">
            Fechamento Rápido do Dia
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-slate-400">
          Voz • Print • Texto
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        Fale ou digite como foi seu turno, ou anexe o print do app (Uber, iFood, 99). A IA extrai valores, calcula o desgaste mecânico e apura seu lucro real.
      </p>

      {/* Preview de Imagem Anexada */}
      {imagePreview && (
        <div className="relative mb-3 inline-block rounded-2xl border border-amber-400/40 bg-slate-950 p-2 shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Print do app"
            className="h-28 w-auto rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
            title="Remover print"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="block mt-1 text-center text-[10px] font-bold text-amber-400">
            Print pronto para IA
          </span>
        </div>
      )}

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              isRecording
                ? '🎙️ Ouvindo sua voz... Fale seus ganhos, km e combustível...'
                : 'Ex: Fiz 190 no iFood, rodei 115 km e gastei 30 de gasolina...'
            }
            className={`w-full rounded-2xl border p-4 text-sm font-medium text-white placeholder-slate-500 focus:outline-none transition-all ${
              isRecording
                ? 'border-rose-500 bg-rose-950/20 ring-2 ring-rose-500/40 animate-pulse'
                : 'border-slate-700 bg-slate-950 focus:border-amber-400'
            }`}
          />

          {/* Botões Flutuantes de Ação Rápida dentro do campo */}
          <div className="absolute right-3 bottom-3.5 flex items-center gap-2">
            {/* Input Oculto de Arquivo */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Botão Anexar Print */}
            <button
              type="button"
              onClick={() => {
                if (!isPro && onOpenUpgradeModal) {
                  onOpenUpgradeModal();
                  return;
                }
                fileInputRef.current?.click();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              title={isPro ? 'Anexar print do app' : 'Recurso Pro (Requer ativação)'}
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            {/* Botão de Gravação de Voz */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all shadow-md active:scale-95 ${
                isRecording
                  ? 'bg-rose-600 text-white animate-bounce ring-4 ring-rose-500/30'
                  : 'border border-amber-400/40 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20'
              }`}
              title={isRecording ? 'Parar gravação' : 'Gravar por voz (fale seus ganhos)'}
            >
              {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Botão Principal de Envio */}
        <button
          type="submit"
          disabled={isLoading || (!text.trim() && !imageBase64)}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-amber-400 py-3.5 px-4 text-base font-black text-slate-950 shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Calculando Raio-X com IA...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Calcular Fechamento do Dia
            </>
          )}
        </button>
      </form>

      {/* Exemplos Rápidos com 1 Clique */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          <Zap className="h-3 w-3 text-amber-400" />
          Testar com 1 clique:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleQuickExample('Fiz 190 no iFood, rodei 110 km e gastei 30 de gasolina')}
            className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-amber-400/40 hover:text-white transition-all text-left"
          >
            🛵 <strong className="text-amber-400">iFood:</strong> R$ 190 • 110 km
          </button>

          <button
            type="button"
            onClick={() => handleQuickExample('Fiz 270 na Uber, rodei 145 km, gastei 45 de gasolina e 20 no lanche')}
            className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-sky-400/40 hover:text-white transition-all text-left"
          >
            🚗 <strong className="text-sky-400">Uber:</strong> R$ 270 • 145 km
          </button>

          <button
            type="button"
            onClick={() => handleQuickExample('Dia fraco de chuva: Ganhei 70 reais, rodei 85 km e gastei 35 de combustível')}
            className="rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-rose-400/40 hover:text-white transition-all text-left"
          >
            ⚠️ <strong className="text-rose-400">Dia Fraco:</strong> R$ 70 • 85 km (Ver Alerta)
          </button>
        </div>
      </div>
    </div>
  );
};
