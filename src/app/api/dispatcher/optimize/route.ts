import { NextResponse } from 'next/server';
import { parseDeliveryListText, optimizeRouteStops } from '@/services/dispatcherAgent';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { DeliveryStop } from '@/types/dispatcher.types';

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
    const { rawText, stops } = body as { rawText?: string; stops?: DeliveryStop[] };

    let processedStops: DeliveryStop[] = [];

    if (rawText && rawText.trim()) {
      processedStops = parseDeliveryListText(rawText);
    } else if (Array.isArray(stops)) {
      processedStops = optimizeRouteStops(stops);
    } else {
      return NextResponse.json(
        { error: 'Nenhuma informação de rota ou paradas fornecida.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      count: processedStops.length,
      stops: processedStops,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro na API de Otimização do Despachante:', error);
    return NextResponse.json(
      { error: 'Falha ao processar paradas da rota.' },
      { status: 500 }
    );
  }
}
