import React from 'react';
import Link from 'next/link';

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <Link href="/" className="text-amber-400 hover:text-amber-300 font-semibold text-sm flex items-center gap-1">
            ← Voltar ao Copiloto-Rota
          </Link>
          <span className="text-xs text-slate-500">LGPD Compliance • Versão 2.0.0</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-amber-400">
          Política de Privacidade e Proteção de Dados
        </h1>

        <div className="bg-blue-950/30 border border-blue-800/50 rounded-xl p-4 text-xs text-blue-200/90 leading-relaxed">
          <p className="font-bold mb-1">🔒 COMPROMISSO COM A SUA PRIVACIDADE (LGPD):</p>
          O <strong>Copiloto-Rota</strong> está em total conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD)</strong>, com o Marco Civil da Internet (Lei nº 12.965/2014) e com o Artigo 14 da LGPD (proteção de dados de adolescentes e jovens). Nós valorizamos a segurança e a confidencialidade das suas informações de faturamento e rotina de trabalho.
        </div>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">1. Dados Coletados e Finalidade</h2>
          <p>
            Coletamos apenas as informações estritamente necessárias para a prestação do serviço:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dados de Identificação:</strong> E-mail para autenticação de conta e sincronização de dados via Supabase Auth.</li>
            <li><strong>Dados Operacionais do Veículo:</strong> Modelo, odômetro, consumo médio (km/L), custos fixos e quilometragem de peças para cálculo da caixinha de manutenção.</li>
            <li><strong>Dados Financeiros e Diários:</strong> Ganhos brutos, quilômetros rodados, gastos com combustível e alimentação informados diretamente por você ou extraídos a partir de resumos fornecidos voluntariamente.</li>
            <li><strong>Imagens de Resumo Diário:</strong> Processadas temporariamente via API do Google Gemini para extração exclusiva de texto e números de faturamento, não sendo armazenadas em servidores permanentes de terceiros para outros fins.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">2. Modo Offline-First e Armazenamento Local</h2>
          <p>
            Quando você utiliza o Copiloto-Rota sem criar uma conta ou em modo convidado, <strong>todos os seus dados financeiros, odômetros e veículos permanecem salvos unicamente no armazenamento local do seu próprio navegador (localStorage)</strong>. Nenhuma informação de ganhos é transmitida para bancos de dados centrais a menos que você realize o login voluntário.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">3. Tratamento de Dados de Menores de Idade (Art. 14 da LGPD e ECA)</h2>
          <p>
            O serviço não coleta deliberadamente dados de crianças ou adolescentes menores de 16 anos. Caso seja detectado qualquer cadastro efetuado por menores sem a expressa anuência ou representação de pais ou responsáveis legais, os dados serão prontamente eliminados da base de dados.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">4. Direitos do Titular de Dados (Art. 18 da LGPD)</h2>
          <p>
            Você tem o direito de, a qualquer momento e mediante simples requisição:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmar a existência de tratamento e acessar os seus dados.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Requerer a exclusão integral ou anonimização dos seus dados pessoais e histórico diário armazenado na nuvem.</li>
            <li>Revogar o consentimento para tratamento a qualquer momento.</li>
          </ul>
          <p>
            Para exercer qualquer um destes direitos, basta entrar em contato com o Encarregado de Proteção de Dados (DPO) através do canal oficial de suporte pelo e-mail <strong>luklen2@gmail.com</strong> ou WhatsApp oficial.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-300">
          <h2 className="text-lg font-bold text-slate-100">5. Segurança da Informação</h2>
          <p>
            Empregamos criptografia SSL/TLS em todas as comunicações, isolamento de linhas no banco de dados (Row Level Security no PostgreSQL) e chaves autenticadas para garantir que apenas você acesse as informações do seu veículo e seus ganhos.
          </p>
        </section>

        <div className="border-t border-slate-800 pt-4 flex justify-between text-xs text-slate-500">
          <span>Copiloto-Rota &copy; 2026</span>
          <Link href="/termos" className="text-amber-400 hover:underline">
            Ver Termos de Uso →
          </Link>
        </div>
      </div>
    </div>
  );
}
