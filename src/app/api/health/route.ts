import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    app: 'Copiloto-Rota',
    version: '2.0.0',
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
