import React from 'react';
import Link from 'next/link';

export default function TermosDeUso() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="text-amber-400 hover:text-amber-300 font-semibold text-sm flex items-center gap-1">
            ← Voltar ao Copiloto-Rota
          </Link>
          <span className="text-xs text-slate-500">Versão 2.0.0 • Vigência 2026</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-amber-400">
          Termos e Condições Gerais de Uso
        </h1>

        <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 text-xs text-amber-200/90 leading-relaxed">
          <p className="font-bold mb-1">⚠️ AVISO REGULATÓRIO & ÉTICO IMPORTANTE:</p>
          O <strong>Copiloto-Rota</strong> é um software de produtividade, organização financeira e suporte operacional para condutores de veículos e entregadores. O sistema <strong>não substitui consultoria contábil, assessoria jurídica individualizada, perícias mecânicas ou consultas e orientações de saúde física/mental</strong>. O condutor é o único responsável pela condução segura de seu veículo e verificação física dos componentes mecânicos.
        </div>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">1. Aceitação e Elegibilidade</h2>
          <p>
            Ao utilizar o Copiloto-Rota ou contratar o plano Pro, o usuário declara ter ciência e concordar integralmente com estes Termos.
          </p>
          <p>
            <strong>Classificação Indicativa e Idade Mínima:</strong> A utilização básica da plataforma é recomendada para maiores de 16 anos devidamente autorizados. A contratação de planos de assinatura pagos (R$ 19,90/mês) é <strong>estritamente restrita a maiores de 18 anos</strong> dotados de plena capacidade civil segundo a legislação brasileira (Código Civil, Lei nº 10.406/2002) ou emancipados/assistidos por seus representantes legais.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">2. Objeto e Funcionalidades do Serviço</h2>
          <p>
            O Copiloto-Rota disponibiliza ferramentas digitais para:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cálculo estimativo de lucro líquido real, deduzindo combustível, custos fixos diluídos e provisão de desgaste de componentes mecânicos.</li>
            <li>Extração assistida de resumos diários por inteligência artificial (Gemini 2.5) via texto, transcrição de áudio e leitura de capturas de tela.</li>
            <li>Gestão visual de provisão de caixinha de manutenção preventiva.</li>
            <li>Geração automatizada de minutas formais para recursos administrativos e contestações em plataformas digitais de entrega e transporte (&ldquo;Cofre Anti-Bloqueio&rdquo;).</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">3. Natureza dos Cálculos e Limitação de Responsabilidade</h2>
          <p>
            Os cálculos de desgaste de peças (óleo, pneus, relação, pastilhas) baseiam-se em médias estatísticas operacionais inseridas pelo próprio usuário. Condições severas de piso, clima e estilo de pilotagem exigem inspeção presencial diária do veículo. O Copiloto-Rota não se responsabiliza por avarias mecânicas, acidentes de trânsito ou decisões financeiras individuais.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">4. Período de Testes (Trial) e Assinatura PIX</h2>
          <p>
            Todo novo cadastro tem direito a <strong>7 (sete) dias corridos de teste gratuito</strong> com acesso a todos os recursos. Após o término do período de teste, a continuidade do plano Pro dar-se-á mediante assinatura no valor de <strong>R$ 19,90 por mês</strong> via PIX (BR Code oficial do Banco Central).
          </p>
          <p>
            A ativação e renovação ocorrem imediatamente após a confirmação do comprovante. Não há cláusula de fidelidade ou multa rescisória: o usuário pode suspender a renovação mensal a qualquer tempo sem qualquer penalidade.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">5. Foro e Legislação Aplicável</h2>
          <p>
            Estes Termos são regidos exclusivamente pelas leis da República Federativa do Brasil. Para dirimir quaisquer litígios oriundos deste instrumento, fica eleito o Foro da Comarca do Rio de Janeiro - RJ.
          </p>
        </section>

        <div className="border-t border-slate-800 pt-4 flex justify-between text-xs text-slate-500">
          <span>Copiloto-Rota &copy; 2026</span>
          <Link href="/privacidade" className="text-amber-400 hover:underline">
            Ver Política de Privacidade →
          </Link>
        </div>
      </div>
    </div>
  );
}
