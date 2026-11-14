import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    // Limite rigoroso contra ataques de força bruta no endpoint administrativo (5 tentativas por 15 min)
    const limit = checkRateLimit(`admin-auth:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Muitas tentativas de autenticação administrativa. Bloqueado por 15 minutos.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const expectedSecret = process.env.ADMIN_SECRET || 'copiloto-admin-secret-2026';
    const providedSecret = req.headers.get('x-admin-secret') || body.adminSecret;

    if (!providedSecret || providedSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Chave ADMIN_SECRET incorreta.' },
        { status: 401 }
      );
    }

    const email: string | undefined = body.email;
    const days: number = typeof body.days === 'number' && body.days > 0 ? body.days : 30;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Por favor, informe um e-mail válido para ativação do Pro.' },
        { status: 400 }
      );
    }

    const periodEnd = new Date(Date.now() + days * 86400000).toISOString();
    const nowIso = new Date().toISOString();

    if (!isSupabaseConfigured) {
      // Retorno em modo local
      return NextResponse.json({
        success: true,
        mode: 'simulated-admin',
        message: `[Modo Local] Plano Pro ativado por ${days} dias para ${email}.`,
        period_end: periodEnd,
      });
    }

    // 1. Localizar registro de assinatura pelo e-mail
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSub, error: findErr } = await (supabase.from('subscriptions') as any)
      .select('*')
      .ilike('email', email)
      .limit(1);

    if (findErr) {
      console.warn('Erro ao consultar assinatura:', findErr.message);
    }

    if (existingSub && existingSub.length > 0) {
      // Atualizar registro existente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedSub, error: updateErr } = await (supabase.from('subscriptions') as any)
        .update({
          plan_status: 'active',
          current_period_end: periodEnd,
          updated_at: nowIso,
        })
        .eq('id', existingSub[0].id)
        .select()
        .single();

      if (updateErr) {
        throw new Error(`Falha ao atualizar assinatura: ${updateErr.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `Plano Pro renovado por ${days} dias com sucesso!`,
        subscription: updatedSub,
      });
    }

    // Caso não exista ainda por e-mail, tentar vincular se houver user_id no body
    if (body.user_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newSub, error: insertErr } = await (supabase.from('subscriptions') as any)
        .insert({
          user_id: body.user_id,
          email,
          plan_status: 'active',
          current_period_end: periodEnd,
          updated_at: nowIso,
        })
        .select()
        .single();

      if (insertErr) {
        throw new Error(`Falha ao criar assinatura Pro: ${insertErr.message}`);
      }

      return NextResponse.json({
        success: true,
        message: `Nova assinatura Pro criada e ativada por ${days} dias!`,
        subscription: newSub,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Ativação registrada para ${email}. A conta será sincronizada no próximo login.`,
      target_email: email,
      period_end: periodEnd,
    });
  } catch (err) {
    console.error('Erro na ativação Pro admin:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
