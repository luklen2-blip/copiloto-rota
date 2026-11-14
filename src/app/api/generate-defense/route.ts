import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export interface DefenseRequestBody {
  platform?: string;
  incidentType?: string;
  description: string;
  driverName?: string;
  orderOrTripId?: string;
  evidenceUrls?: string[];
}

function generateFallbackDefense(data: DefenseRequestBody): string {
  const platform = data.platform || 'Plataforma';
  const orderId = data.orderOrTripId ? ` (ID/Corrida: ${data.orderOrTripId})` : '';
  const dateStr = new Date().toLocaleDateString('pt-BR');

  return `À EQUIPE DE SUPORTE E COMPLIANCE DA ${platform.toUpperCase()}
ASSUNTO: CONTESTAÇÃO FORMAL E PEDIDO DE REVISÃO DE OCORRÊNCIA / BLOQUEIO${orderId}
DATA: ${dateStr}

Prezados Senhores,

Venho por meio desta manifestar minha formal discordância e solicitar a imediata apuração e cancelamento de quaisquer penalidades, desativações temporárias ou marcas desfavoráveis aplicadas ao meu perfil de parceiro.

1. DOS FATOS
No exercício de minhas atividades de prestação de serviços como parceiro desta conceituada plataforma, ocorreu o seguinte evento:
"${data.description}"

2. DA CONDUTA DE BOA-FÉ E DO PROTOCOLO OPERACIONAL
Reafirmo que adotei postura estritamente ética, diligente e em conformidade com as diretrizes operacionais e termos de uso do aplicativo. Em momento algum houve dolo, má-fé ou recusa voluntária no cumprimento da entrega ou transporte. Ocorrências alheias à vontade do parceiro, falhas de sinal/aplicativo ou condutas equivocadas por parte do destinatário/passageiro não podem ensejar penalização unilateral ao parceiro.

3. DOS PEDIDOS
Diante de todo o exposto, solicito:
a) A análise pormenorizada do histórico de rotas (GPS), registros de tentativas de contato e evidências anexadas;
b) A anulação de advertências, abatimentos indevidos de taxa de cancelamento ou bloqueios de repasse;
c) A pronta reativação da conta, permitindo o regular retorno ao trabalho de forma digna e sem prejuízos.

Certo do compromisso desta plataforma com a verdade dos fatos e com o respeito aos parceiros que fazem a operação acontecer, aguardo retorno célere e deferimento do pleito.

Atenciosamente,
Parceiro(a) Condutor(a) / Entregador(a)`;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`defense:${ip}`, 15, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas solicitações de defesa em sequência. Aguarde 1 minuto.' },
        { status: 429 }
      );
    }

    const body: DefenseRequestBody = await req.json().catch(() => ({ description: '' }));

    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Por favor, descreva o que aconteceu no incidente.' },
        { status: 400 }
      );
    }

    // Sanitização e limitação de tamanho para segurança contra prompt injection massivo
    body.description = body.description.trim().slice(0, 3000);

    const platform = body.platform || 'Plataforma de Aplicativo';
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('sua-chave')) {
      const fallbackDefense = generateFallbackDefense(body);
      return NextResponse.json({
        success: true,
        source: 'local-fallback',
        platform,
        generated_defense: fallbackDefense,
        tips: [
          'Tire print de todas as conversas e do trajeto GPS',
          'Envie esta mensagem no suporte oficial da plataforma',
          'Se não responderem em até 48 horas, acione o Consumidor.gov.br e Reclame Aqui',
        ],
      });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `
Você é um especialista em mediação de conflitos, direito digital e defesa de motoristas de aplicativo e entregadores (iFood, Uber, 99, Rappi, Lalamove, Zé Delivery).

O parceiro relatou a seguinte ocorrência na plataforma ${platform}:
Tipo de Ocorrência: ${body.incidentType || 'Contestação Geral'}
Identificador de Corrida/Pedido: ${body.orderOrTripId || 'Não informado'}
Relato do Profissional: "${body.description}"

Gere uma defesa formal, serena, técnica e contundente em português do Brasil:
1. Cabeçalho direcionado ao suporte/compliance da ${platform}.
2. Relato objetivo dos fatos fundamentando a boa-fé do entregador/motorista.
3. Demonstração de que o parceiro seguiu os procedimentos recomendados e não praticou fraude.
4. Pedido formal de revisão urgente da ocorrência, cancelamento de punições/taxas indevidas e restabelecimento imediato da conta.
Não use termos prolixos vazios; foque em clareza, seriedade e proteção dos direitos do parceiro trabalhador.
      `.trim();

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const generatedDefense = response.text || generateFallbackDefense(body);

      return NextResponse.json({
        success: true,
        source: 'gemini-2.5-flash',
        platform,
        generated_defense: generatedDefense,
        tips: [
          'Anexe capturas de tela (prints) de conversas e comprovantes se houver',
          'Envie o texto pelo canal oficial de suporte/recurso',
          'Anote o número de protocolo do atendimento para resguardo legal',
        ],
      });
    } catch (aiError) {
      console.warn('Erro na chamada Gemini, usando gerador jurídico de contingência:', aiError);
      return NextResponse.json({
        success: true,
        source: 'contingency-engine',
        platform,
        generated_defense: generateFallbackDefense(body),
        tips: [
          'Guarde prints da tela de chamado e histórico de localização',
          'Encaminhe a mensagem pelo chat de ajuda ou ouvidoria',
        ],
      });
    }
  } catch (err) {
    console.error('Erro na rota generate-defense:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar defesa técnica.' },
      { status: 500 }
    );
  }
}
