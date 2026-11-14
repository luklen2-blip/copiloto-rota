import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractionInput {
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface ExtractedDailyData {
  platform: string;
  gross_earnings: number;
  km_driven: number;
  fuel_spent: number;
  food_other_spent: number;
  summary_message: string;
}

/**
 * Parser heurístico de fallback para desenvolvimento local ou testes sem chave Gemini
 */
function heuristicFallbackExtractor(text?: string): ExtractedDailyData {
  const content = text || '';
  
  // Detecção de plataforma
  let platform = 'Uber';
  if (/ifood/i.test(content)) platform = 'iFood';
  else if (/99/i.test(content)) platform = '99';
  else if (/rappi/i.test(content)) platform = 'Rappi';
  else if (/lalamove/i.test(content)) platform = 'Lalamove';
  else if (/particular/i.test(content)) platform = 'Particular';

  // Detecção de ganhos (ex: R$ 250, 250 reais, ganhei 250, fiz 240)
  const earningsMatch = content.match(/(?:ganhei|faturei|fiz|bruto|recebi)\s*(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i) ||
                        content.match(/(?:r\$\s*)(\d+(?:[.,]\d{1,2})?)/i) ||
                        content.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|conto)/i);
  const gross = earningsMatch ? parseFloat(earningsMatch[1].replace(',', '.')) : 220.00;

  // Detecção de KM rodado (ex: 120 km, rodei 120)
  const kmMatch = content.match(/(?:rodei|andei|percorri|dist[aâ]ncia)\s*(\d+(?:[.,]\d{1,2})?)/i) ||
                  content.match(/(\d+(?:[.,]\d{1,2})?)\s*km/i);
  const km = kmMatch ? parseFloat(kmMatch[1].replace(',', '.')) : 95.00;

  // Detecção de combustível (ex: gasolina 50, gastei 30 de gasolina, 50 no posto)
  const fuelMatch = content.match(/(?:gastei|coloquei|botei)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:de|em)?\s*(?:gasolina|combust[ií]vel|etanol)/i) ||
                    content.match(/(?:gasolina|combust[ií]vel|abasteci|posto)\s*(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
  const fuel = fuelMatch ? parseFloat(fuelMatch[1].replace(',', '.')) : 0;

  // Detecção de almoço / lanche
  const foodMatch = content.match(/(?:gastei|paguei)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:de|em)?\s*(?:almo[cç]o|lanche|comida|janta|a[cç]a[ií])/i) ||
                    content.match(/(?:almo[cç]o|lanche|comida|alimenta[cç][aã]o|janta)\s*(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
  const food = foodMatch ? parseFloat(foodMatch[1].replace(',', '.')) : 0;

  return {
    platform,
    gross_earnings: gross,
    km_driven: km,
    fuel_spent: fuel,
    food_other_spent: food,
    summary_message: `[Modo Simulação Local] Identifiquei sua jornada na plataforma ${platform}: Faturamento bruto de R$ ${gross.toFixed(2)} e ${km.toFixed(1)} km rodados.`,
  };
}

/**
 * Extrai dados financeiros do turno usando o modelo Gemini 2.5 Flash com Structured Outputs
 */
export async function extractDailyData(input: ExtractionInput): Promise<ExtractedDailyData> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback caso a chave de API não esteja configurada no ambiente
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('sua-chave')) {
    return heuristicFallbackExtractor(input.text);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Preparação dos conteúdos (texto e/ou imagem)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentParts: any[] = [];

    if (input.imageBase64) {
      // Remove cabeçalho data:image/...;base64, se presente
      const cleanBase64 = input.imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      const mimeType = input.imageMimeType || 'image/jpeg';
      
      contentParts.push({
        inlineData: {
          mimeType,
          data: cleanBase64,
        },
      });
    }

    const promptText = `
Você é o assistente inteligente do Copiloto-Rota, focado em motoristas de aplicativo e motoboys (Uber, 99, iFood, Rappi, Lalamove, Zé Delivery, etc.).
Analise a imagem de comprovante/resumo de ganhos do app ou o texto informado pelo condutor e extraia com exatidão:
- Plataforma onde as corridas/entregas foram feitas.
- Ganhos brutos totais do período em Reais.
- Quilômetros totais rodados informados no resumo ou no relato.
- Gastos com combustível declarados (retorne 0 se não encontrar).
- Gastos com alimentação/outros declarados (retorne 0 se não encontrar).
- Mensagem resumida em tom parceiro, direto e motivador confirmando os dados extraídos.

Relato complementar do condutor: "${input.text || 'Nenhum texto adicional, extrair exclusivamente da imagem.'}"
    `.trim();

    contentParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contentParts,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            platform: {
              type: Type.STRING,
              description: 'Nome da plataforma (ex: Uber, iFood, 99, Rappi, Lalamove, etc.)',
            },
            gross_earnings: {
              type: Type.NUMBER,
              description: 'Ganhos brutos em Reais (R$)',
            },
            km_driven: {
              type: Type.NUMBER,
              description: 'Quilômetros rodados no período',
            },
            fuel_spent: {
              type: Type.NUMBER,
              description: 'Valor gasto em combustível em Reais (R$). 0 se não informado',
            },
            food_other_spent: {
              type: Type.NUMBER,
              description: 'Valor gasto em alimentação e outros em Reais (R$). 0 se não informado',
            },
            summary_message: {
              type: Type.STRING,
              description: 'Uma mensagem curta e amigável confirmando o que foi entendido',
            },
          },
          required: [
            'platform',
            'gross_earnings',
            'km_driven',
            'fuel_spent',
            'food_other_spent',
            'summary_message',
          ],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Resposta vazia retornada pelo Gemini 2.5 Flash');
    }

    const parsed = JSON.parse(responseText) as ExtractedDailyData;

    return {
      platform: parsed.platform || 'Geral',
      gross_earnings: Number(parsed.gross_earnings || 0),
      km_driven: Number(parsed.km_driven || 0),
      fuel_spent: Number(parsed.fuel_spent || 0),
      food_other_spent: Number(parsed.food_other_spent || 0),
      summary_message: parsed.summary_message || 'Dados extraídos com sucesso.',
    };
  } catch (error) {
    console.error('Erro na extração com Gemini 2.5 Flash, acionando fallback heurístico:', error);
    const fallback = heuristicFallbackExtractor(input.text);
    return {
      ...fallback,
      summary_message: `[Modo Fallback] Identificado: R$ ${fallback.gross_earnings.toFixed(2)} em ${fallback.km_driven.toFixed(1)} km (${fallback.platform}).`,
    };
  }
}
