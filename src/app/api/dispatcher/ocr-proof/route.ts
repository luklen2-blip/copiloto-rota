import { NextResponse } from 'next/server';
import { analyzeDeliveryProofWithAI } from '@/services/dispatcherAgent';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Aguarde um instante.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { imageBase64, mimeType, expectedStop } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Imagem do comprovante não fornecida.' },
        { status: 400 }
      );
    }

    const result = await analyzeDeliveryProofWithAI(
      imageBase64,
      mimeType || 'image/jpeg',
      expectedStop
    );

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro na API OCR do Despachante:', error);
    return NextResponse.json(
      { error: 'Falha ao processar comprovante.' },
      { status: 500 }
    );
  }
}
