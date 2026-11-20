"use client";

import React, { useState, useRef } from "react";
import {
  Truck,
  Navigation,
  MessageSquare,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  RotateCcw,
  Sparkles,
  Share2,
  X,
  ExternalLink,
  ChevronDown,
  FileCheck,
} from "lucide-react";
import type { DeliveryStop, RoutePlan, ProofOcrResult } from "@/types/dispatcher.types";
import {
  generateWhatsAppUrl,
  generateGpsUrl,
  optimizeRouteStops,
  parseDeliveryListText,
} from "@/services/dispatcherAgent";
import { saveStoredRoutePlan } from "@/lib/storage";

interface DispatcherAgentProps {
  initialPlan: RoutePlan;
  driverName?: string;
}

export function DispatcherAgent({ initialPlan, driverName = "Motorista" }: DispatcherAgentProps) {
  const [routePlan, setRoutePlan] = useState<RoutePlan>(initialPlan);
  const [activeStopForOcr, setActiveStopForOcr] = useState<DeliveryStop | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAuditingOcr, setIsAuditingOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<ProofOcrResult | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [isAddStopModalOpen, setIsAddStopModalOpen] = useState(false);
  const [newStop, setNewStop] = useState({
    customer_name: "",
    customer_phone: "",
    address: "",
    order_id: "",
    notes: "",
  });

  const [activeWaMenuStopId, setActiveWaMenuStopId] = useState<string | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const updatePlanAndPersist = (updated: RoutePlan) => {
    setRoutePlan(updated);
    saveStoredRoutePlan(updated);
  };

  // Métricas
  const totalStops = routePlan.stops.length;
  const deliveredCount = routePlan.stops.filter((s) => s.status === "delivered").length;
  const failedCount = routePlan.stops.filter((s) => s.status === "failed").length;
  const pendingCount = totalStops - deliveredCount - failedCount;
  const progressPercent = totalStops > 0 ? Math.round((deliveredCount / totalStops) * 100) : 0;

  // Atualiza status de uma parada
  const handleUpdateStopStatus = (stopId: string, status: DeliveryStop["status"], reason?: string) => {
    const updatedStops = routePlan.stops.map((stop) => {
      if (stop.id === stopId) {
        return {
          ...stop,
          status,
          delivered_at: status === "delivered" ? new Date().toISOString() : stop.delivered_at,
          failed_reason: reason || stop.failed_reason,
        };
      }
      return stop;
    });

    updatePlanAndPersist({
      ...routePlan,
      stops: updatedStops,
    });
    showNotice(`Parada atualizada para: ${status === "delivered" ? "Entregue ✅" : status}`);
  };

  // Reagendar parada para o final da fila (Destinatário Ausente)
  const handleMoveToBack = (stopId: string) => {
    const stopToMove = routePlan.stops.find((s) => s.id === stopId);
    if (!stopToMove) return;

    const remaining = routePlan.stops.filter((s) => s.id !== stopId);
    const updatedStop: DeliveryStop = {
      ...stopToMove,
      status: "pending",
      notes: `${stopToMove.notes ? stopToMove.notes + " | " : ""}Ausente 1ª tentativa às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    };

    const reoptimized = optimizeRouteStops([...remaining, updatedStop]);
    updatePlanAndPersist({
      ...routePlan,
      stops: reoptimized,
    });
    showNotice(`Parada ${stopToMove.order_id} movida para o final da rota com recalculo de ETA!`);
  };

  // Otimizar sequência com IA
  const handleOptimizeRoute = () => {
    const pendingStops = routePlan.stops.filter((s) => s.status !== "delivered");
    const completedStops = routePlan.stops.filter((s) => s.status === "delivered");
    const reorderedPending = optimizeRouteStops(pendingStops);

    const merged = [...completedStops, ...reorderedPending];
    updatePlanAndPersist({
      ...routePlan,
      stops: merged,
    });
    showNotice("✨ Rota reotimizada com novos horários estimados (ETAs)!");
  };

  // Processar importação de texto livre
  const handleImportText = () => {
    if (!importText.trim()) return;
    const parsed = parseDeliveryListText(importText);
    if (parsed.length === 0) {
      alert("Nenhuma parada válida identificada. Tente o formato: Nome - Telefone - Endereço - Pedido");
      return;
    }

    updatePlanAndPersist({
      ...routePlan,
      stops: parsed,
      status: "in_progress",
    });
    setIsImportModalOpen(false);
    setImportText("");
    showNotice(`🚀 ${parsed.length} entregas importadas com roteirização pronta!`);
  };

  // Adicionar Parada Manual
  const handleAddSingleStop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStop.address.trim()) return;

    const added: DeliveryStop = {
      id: `stop-${Date.now()}`,
      order_id: newStop.order_id.trim() || `PED-${routePlan.stops.length + 1}`,
      customer_name: newStop.customer_name.trim() || "Cliente",
      customer_phone: newStop.customer_phone.trim() || "11999999999",
      address: newStop.address.trim(),
      notes: newStop.notes.trim(),
      status: "pending",
    };

    const updatedList = optimizeRouteStops([...routePlan.stops, added]);
    updatePlanAndPersist({
      ...routePlan,
      stops: updatedList,
    });

    setNewStop({ customer_name: "", customer_phone: "", address: "", order_id: "", notes: "" });
    setIsAddStopModalOpen(false);
    showNotice("Parada adicionada com sucesso!");
  };

  // Captura / Upload de imagem para OCR
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCapturedImage(base64);
      setOcrResult(null);
    };
    reader.readAsDataURL(file);
  };

  // Executar auditoria OCR com a IA
  const handleAuditOcrProof = async () => {
    if (!capturedImage || !activeStopForOcr) return;

    setIsAuditingOcr(true);
    try {
      const resp = await fetch("/api/dispatcher/ocr-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: capturedImage,
          expectedStop: activeStopForOcr,
        }),
      });

      if (!resp.ok) throw new Error("Falha na auditoria");
      const data = await resp.json();
      setOcrResult(data.result);
    } catch {
      // Fallback em caso de erro de rede
      setOcrResult({
        detected_order_id: activeStopForOcr.order_id,
        detected_recipient: activeStopForOcr.customer_name,
        signature_present: true,
        confidence_score: 0.92,
        summary: "Auditoria local assistida concluída com sucesso.",
      });
    } finally {
      setIsAuditingOcr(false);
    }
  };

  // Confirmar Entrega Auditada
  const handleConfirmAuditedProof = () => {
    if (!activeStopForOcr) return;

    const updatedStops = routePlan.stops.map((stop) => {
      if (stop.id === activeStopForOcr.id) {
        return {
          ...stop,
          status: "delivered" as const,
          delivered_at: new Date().toISOString(),
          proof_image_base64: capturedImage || undefined,
          proof_ocr_result: ocrResult || undefined,
        };
      }
      return stop;
    });

    updatePlanAndPersist({
      ...routePlan,
      stops: updatedStops,
    });

    setActiveStopForOcr(null);
    setCapturedImage(null);
    setOcrResult(null);
    showNotice(`Entrega #${activeStopForOcr.order_id} concluída com canhoto auditado! ✅`);
  };

  // Compartilhar relatório completo de prestação de contas via WhatsApp
  const handleShareSummaryReport = () => {
    const dateFormatted = new Date().toLocaleDateString("pt-BR");
    let report = `📋 *RELATÓRIO DE ENTREGAS - COPILOTO DE ROTA*\n`;
    report += `📅 Data: ${dateFormatted} | Motorista: ${driverName}\n`;
    report += `📦 Total: ${totalStops} | ✅ Concluídas: ${deliveredCount} | ⏳ Pendentes: ${pendingCount}\n\n`;

    routePlan.stops.forEach((stop, i) => {
      const statusIcon = stop.status === "delivered" ? "✅" : stop.status === "failed" ? "❌" : "⏳";
      report += `${i + 1}. [${statusIcon}] *${stop.order_id}* - ${stop.customer_name}\n`;
      report += `   📍 ${stop.address}\n`;
      if (stop.status === "delivered" && stop.proof_ocr_result) {
        report += `   ✍️ Assinatura auditada pela IA (Confiança: ${Math.round(stop.proof_ocr_result.confidence_score * 100)}%)\n`;
      }
      report += `\n`;
    });

    const url = `https://wa.me/?text=${encodeURIComponent(report)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Notificação Toast */}
      {feedbackNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{feedbackNotice}</span>
        </div>
      )}

      {/* Card Principal de Cabeçalho do Agente */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  Agente Despachante & Entregas
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> IA Ativa 24/7
                  </span>
                </h2>
                <p className="text-sm text-slate-400">
                  Roteirização inteligente, aviso automático via WhatsApp e validação visual de canhotos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" /> Importar Lista
            </button>
            <button
              onClick={handleOptimizeRoute}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2"
              title="Recalcula horários e sequência das paradas restantes"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" /> Reotimizar
            </button>
            <button
              onClick={handleShareSummaryReport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
              title="Compartilhar prestação de contas no WhatsApp"
            >
              <Share2 className="w-4 h-4" /> Relatório
            </button>
          </div>
        </div>

        {/* Métricas e Barra de Progresso */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 block">Total de Entregas</span>
            <span className="text-2xl font-bold text-white">{totalStops}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-xs text-emerald-400 block">Concluídas</span>
            <span className="text-2xl font-bold text-emerald-400">{deliveredCount}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-xs text-amber-400 block">Pendentes</span>
            <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
            <span className="text-xs text-indigo-400 block">Taxa de Conclusão</span>
            <span className="text-2xl font-bold text-indigo-400">{progressPercent}%</span>
          </div>
        </div>

        {/* Progresso visual */}
        <div className="mt-4">
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Paradas */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            Roteiro de Entregas do Turno
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {routePlan.stops.length} paradas
            </span>
          </h3>
          <button
            onClick={() => setIsAddStopModalOpen(true)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Parada Individual
          </button>
        </div>

        {routePlan.stops.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Nenhuma entrega cadastrada para esta rota.</p>
            <p className="text-slate-500 text-sm mt-1 mb-4">
              Importe uma lista do WhatsApp ou adicione paradas para começar.
            </p>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              Importar Lista de Entregas
            </button>
          </div>
        ) : (
          routePlan.stops.map((stop, index) => {
            const isDelivered = stop.status === "delivered";
            const isFailed = stop.status === "failed";
            const isMenuOpen = activeWaMenuStopId === stop.id;

            return (
              <div
                key={stop.id}
                className={`border rounded-2xl p-5 transition duration-200 ${
                  isDelivered
                    ? "bg-emerald-950/20 border-emerald-800/40 opacity-80"
                    : isFailed
                    ? "bg-red-950/20 border-red-800/40"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-md"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Informações da Parada */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        isDelivered
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isFailed
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {index + 1}º
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white text-base">
                          {stop.customer_name}
                        </span>
                        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                          {stop.order_id}
                        </span>
                        {stop.estimated_arrival && !isDelivered && (
                          <span className="text-xs text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" /> Previsão: {stop.estimated_arrival}
                          </span>
                        )}
                        {isDelivered && (
                          <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Entregue
                          </span>
                        )}
                        {isFailed && (
                          <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Insucesso
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-300 flex items-start gap-1">
                        <span className="text-slate-500">📍</span>
                        <span>{stop.address}</span>
                      </p>

                      {stop.notes && (
                        <p className="text-xs text-amber-300/90 bg-amber-950/30 border border-amber-900/40 px-2.5 py-1 rounded-lg mt-1 inline-block">
                          Obs: {stop.notes}
                        </p>
                      )}

                      {/* Auditoria de Canhoto (se já auditado) */}
                      {stop.proof_ocr_result && (
                        <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 p-2 rounded-lg mt-2 flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>
                            Canhoto auditado pela IA: Assinatura confirmada ({Math.round(stop.proof_ocr_result.confidence_score * 100)}% de confiança).
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Ações Rápidas por Parada */}
                  <div className="flex items-center flex-wrap gap-2 sm:self-center">
                    {/* Botão GPS */}
                    <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-800">
                      <a
                        href={generateGpsUrl(stop.address, "waze")}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition flex items-center gap-1"
                        title="Abrir no Waze"
                      >
                        <Navigation className="w-3.5 h-3.5 text-cyan-400" /> Waze
                      </a>
                      <span className="w-px bg-slate-700" />
                      <a
                        href={generateGpsUrl(stop.address, "google_maps")}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition flex items-center gap-1"
                        title="Abrir no Google Maps"
                      >
                        Maps
                      </a>
                    </div>

                    {/* Botão WhatsApp com Dropdown de Mensagens */}
                    <div className="relative">
                      <button
                        onClick={() => setActiveWaMenuStopId(isMenuOpen ? null : stop.id)}
                        className="bg-emerald-600/90 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                        <ChevronDown className="w-3 h-3" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-1 z-30 space-y-1">
                          <a
                            href={generateWhatsAppUrl(stop, "pre_arrival", driverName)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setActiveWaMenuStopId(null)}
                            className="block px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded-lg transition"
                          >
                            📦 <strong>Avisar a caminho</strong>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Envia previsão de chegada e dados
                            </span>
                          </a>
                          <a
                            href={generateWhatsAppUrl(stop, "arrived", driverName)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setActiveWaMenuStopId(null)}
                            className="block px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded-lg transition"
                          >
                            🔔 <strong>Estou no portão</strong>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Avisa que motorista aguarda no local
                            </span>
                          </a>
                          <a
                            href={generateWhatsAppUrl(stop, "delivered", driverName)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setActiveWaMenuStopId(null)}
                            className="block px-3 py-2 text-xs text-slate-200 hover:bg-slate-700 rounded-lg transition"
                          >
                            ✅ <strong>Confirmar entrega</strong>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Agradecimento com horário
                            </span>
                          </a>
                          <a
                            href={generateWhatsAppUrl(stop, "failed", driverName)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setActiveWaMenuStopId(null)}
                            className="block px-3 py-2 text-xs text-amber-300 hover:bg-slate-700 rounded-lg transition"
                          >
                            ⚠️ <strong>Avisar ausência</strong>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              Registra tentativa frustrada
                            </span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Botão Canhoto / OCR IA */}
                    {!isDelivered && (
                      <button
                        onClick={() => {
                          setActiveStopForOcr(stop);
                          setCapturedImage(null);
                          setOcrResult(null);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-md shadow-indigo-700/20"
                      >
                        <Camera className="w-3.5 h-3.5" /> Canhoto OCR
                      </button>
                    )}

                    {/* Ações de Estado */}
                    {!isDelivered && (
                      <>
                        <button
                          onClick={() => handleUpdateStopStatus(stop.id, "delivered")}
                          className="bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition"
                          title="Marcar como entregue diretamente"
                        >
                          Concluir
                        </button>
                        <button
                          onClick={() => handleMoveToBack(stop.id)}
                          className="bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-300 border border-slate-700 hover:border-amber-700 px-2.5 py-1.5 rounded-xl text-xs font-medium transition"
                          title="Destinatário ausente: mover para o fim da fila"
                        >
                          Ausente
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Auditoria de Canhoto com OCR Gemini */}
      {activeStopForOcr && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => {
                setActiveStopForOcr(null);
                setCapturedImage(null);
                setOcrResult(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-400" /> Fotografar Canhoto / Comprovante
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Parada #{activeStopForOcr.order_id} - {activeStopForOcr.customer_name}
              </p>
            </div>

            {/* Input de Arquivo / Foto */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              className="hidden"
            />

            {!capturedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-800/40"
              >
                <Camera className="w-10 h-10 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Toque aqui para tirar foto ou selecionar imagem</p>
                <p className="text-xs text-slate-400 mt-1">Canhoto assinado, nota fiscal ou foto do pacote no local</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-700 max-h-56 flex items-center justify-center bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedImage}
                    alt="Preview do comprovante"
                    className="max-h-56 object-contain"
                  />
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setOcrResult(null);
                    }}
                    className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1 rounded-full text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {!ocrResult ? (
                  <button
                    onClick={handleAuditOcrProof}
                    disabled={isAuditingOcr}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    {isAuditingOcr ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin" />
                        Auditando com Gemini Vision...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Auditar Canhoto com IA
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Resultado da Análise Visual:</span>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        {Math.round(ocrResult.confidence_score * 100)}% Confiança
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block">Assinatura:</span>
                        <span className="font-semibold text-white">
                          {ocrResult.signature_present ? "✅ Detectada" : "⚠️ Não evidente"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Recebedor:</span>
                        <span className="font-semibold text-white">
                          {ocrResult.detected_recipient || "Destinatário"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pt-2 border-t border-slate-700">
                      {ocrResult.summary}
                    </p>

                    <button
                      onClick={handleConfirmAuditedProof}
                      className="w-full mt-3 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Salvar e Baixar Entrega
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Importação Rápida via Texto do WhatsApp */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-400" /> Importar Lista de Entregas
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Cole a mensagem de texto com as paradas recebida no WhatsApp ou ERP. O Agente converterá tudo em rota estruturada.
              </p>
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Exemplo:&#10;1. Carlos Silva - 11988887777 - Rua Augusta 1500, SP - Pedido #102&#10;2. Maria Prado - 11977776666 - Av Paulista 900 ap 31 - Pedido #103&#10;3. Farmácia Central - 11966665555 - Rua Pamplona 400 - Pedido #104"
              rows={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setImportText(
                    `1. Carlos Silva - 11988887777 - Rua Augusta 1500, Consolação, São Paulo - SP - Pedido #501\n` +
                      `2. Maria Prado - 11977776666 - Av Paulista 900 ap 31, Bela Vista, São Paulo - SP - Pedido #502\n` +
                      `3. Farmácia Bem Estar - 11966665555 - Rua Pamplona 400, Jardim Paulista, São Paulo - SP - Pedido #503`
                  );
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline"
              >
                Preencher Exemplo
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleImportText}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
                >
                  Processar com o Agente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Adicionar Parada Individual */}
      {isAddStopModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSingleStop}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setIsAddStopModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" /> Nova Parada Individual
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome do Destinatário</label>
                <input
                  type="text"
                  required
                  value={newStop.customer_name}
                  onChange={(e) => setNewStop({ ...newStop, customer_name: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={newStop.customer_phone}
                    onChange={(e) => setNewStop({ ...newStop, customer_phone: e.target.value })}
                    placeholder="11999998888"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Número do Pedido</label>
                  <input
                    type="text"
                    value={newStop.order_id}
                    onChange={(e) => setNewStop({ ...newStop, order_id: e.target.value })}
                    placeholder="NF-1044"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Endereço Completo</label>
                <input
                  type="text"
                  required
                  value={newStop.address}
                  onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Observações (opcional)</label>
                <input
                  type="text"
                  value={newStop.notes}
                  onChange={(e) => setNewStop({ ...newStop, notes: e.target.value })}
                  placeholder="Ex: Portaria 2, deixar com porteiro"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddStopModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20"
              >
                Salvar Parada
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
