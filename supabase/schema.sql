-- ==============================================================================
-- Schema do Banco de Dados PostgreSQL / Supabase
-- Projeto: Copiloto-Rota (Controle Financeiro & Manutenção para Entregadores e Motoristas)
-- ==============================================================================

-- Habilitar extensão para geração de UUID caso não esteja disponível nativamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. TABELA: vehicles (Veículos cadastrados pelo usuário - moto ou carro)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('moto', 'carro')),
    model_name TEXT NOT NULL,
    fuel_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    avg_km_per_liter NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    fixed_monthly_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    monthly_km_goal NUMERIC(10, 2) DEFAULT NULL,
    current_odometer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários na tabela e colunas de vehicles
COMMENT ON TABLE public.vehicles IS 'Veículos de trabalho (motos ou carros) vinculados ao motorista/entregador.';
COMMENT ON COLUMN public.vehicles.vehicle_type IS 'Tipo do veículo: moto ou carro.';
COMMENT ON COLUMN public.vehicles.fuel_price IS 'Preço médio do combustível por litro pago pelo condutor.';
COMMENT ON COLUMN public.vehicles.avg_km_per_liter IS 'Consumo médio em km por litro do veículo.';
COMMENT ON COLUMN public.vehicles.fixed_monthly_cost IS 'Custos fixos mensais somados (seguro, IPVA, financiamento, MEI, rastreador).';
COMMENT ON COLUMN public.vehicles.monthly_km_goal IS 'Meta mensal estimada de quilometragem rodada.';
COMMENT ON COLUMN public.vehicles.current_odometer IS 'Quilometragem atual no odômetro do veículo.';

-- ==============================================================================
-- 2. TABELA: maintenance_items (Itens de manutenção preventiva e reserva de desgaste)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    replacement_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lifespan_km NUMERIC(10, 2) NOT NULL CHECK (lifespan_km > 0),
    last_changed_odometer NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reserved_balance NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- Comentários na tabela e colunas de maintenance_items
COMMENT ON TABLE public.maintenance_items IS 'Itens de desgaste preventivo (pneu, óleo, relação, pastilhas) e provisão de caixa.';
COMMENT ON COLUMN public.maintenance_items.vehicle_id IS 'FK para a tabela vehicles.';
COMMENT ON COLUMN public.maintenance_items.replacement_cost IS 'Custo estimado da troca/substituição do item.';
COMMENT ON COLUMN public.maintenance_items.lifespan_km IS 'Vida útil estimada do item em quilômetros.';
COMMENT ON COLUMN public.maintenance_items.last_changed_odometer IS 'Km do odômetro na data da última substituição.';
COMMENT ON COLUMN public.maintenance_items.reserved_balance IS 'Saldo acumulado na reserva financeira de depreciação do item.';

-- ==============================================================================
-- 3. TABELA: daily_logs (Registros diários de corridas, ganhos e despesas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    platform TEXT NOT NULL,
    gross_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    km_driven NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fuel_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    food_other_spent NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    calculated_wear_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_profit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    raw_input_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários na tabela e colunas de daily_logs
COMMENT ON TABLE public.daily_logs IS 'Lançamentos diários ou por turno de ganhos brutos, km rodada e despesas.';
COMMENT ON COLUMN public.daily_logs.platform IS 'Plataforma de atuação (iFood, Uber, 99, Rappi, Lalamove, Particular, etc).';
COMMENT ON COLUMN public.daily_logs.calculated_wear_cost IS 'Custo de desgaste mecânico/depreciação provisionado para a quilometragem do dia.';
COMMENT ON COLUMN public.daily_logs.net_profit IS 'Lucro real líquido: bruto - combustível - alimentação - desgaste calculado.';
COMMENT ON COLUMN public.daily_logs.raw_input_text IS 'Texto de entrada rápida gerado por áudio, OCR ou atalhos.';

-- ==============================================================================
-- 4. TABELA: incident_vault (Cofre de incidentes, contestações e defesas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.incident_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}'::TEXT[],
    generated_defense TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários na tabela e colunas de incident_vault
COMMENT ON TABLE public.incident_vault IS 'Cofre de segurança para bloqueios indevidos, reclamações e defesas pré-formatadas.';
COMMENT ON COLUMN public.incident_vault.evidence_urls IS 'Array com URLs ou caminhos das evidências (fotos, prints, notas).';
COMMENT ON COLUMN public.incident_vault.generated_defense IS 'Texto da minuta de defesa/contestação formal gerada para o aplicativo.';

-- ==============================================================================
-- 5. TABELA: subscriptions (Assinaturas, Trial de 7 Dias e Acesso Pro via PIX)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    plan_status VARCHAR(20) NOT NULL DEFAULT 'trial' CHECK (plan_status IN ('trial', 'active', 'expired', 'canceled')),
    trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    current_period_end TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários na tabela e colunas de subscriptions
COMMENT ON TABLE public.subscriptions IS 'Controle de acesso Pro e período de teste de 7 dias com renovação via PIX.';
COMMENT ON COLUMN public.subscriptions.plan_status IS 'Status da assinatura: trial (teste 7 dias), active (pago R$ 19,90/mês), expired ou canceled.';
COMMENT ON COLUMN public.subscriptions.trial_ends_at IS 'Data/hora limite para o término do teste grátis de 7 dias.';
COMMENT ON COLUMN public.subscriptions.current_period_end IS 'Data/hora de expiração do ciclo pago ativo.';

-- ==============================================================================
-- ÍNDICES DE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance_items(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_incident_vault_user_id ON public.incident_vault(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email);

-- ==============================================================================
-- POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas para vehicles
CREATE POLICY "Usuários podem gerenciar seus próprios veículos"
    ON public.vehicles
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para maintenance_items (baseadas no dono do veículo)
CREATE POLICY "Usuários podem gerenciar itens de manutenção dos seus veículos"
    ON public.maintenance_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            WHERE v.id = maintenance_items.vehicle_id
            AND v.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vehicles v
            WHERE v.id = maintenance_items.vehicle_id
            AND v.user_id = auth.uid()
        )
    );

-- Políticas para daily_logs
CREATE POLICY "Usuários podem gerenciar seus registros diários"
    ON public.daily_logs
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para incident_vault
CREATE POLICY "Usuários podem gerenciar seus registros de incidentes"
    ON public.incident_vault
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Políticas para subscriptions
CREATE POLICY "Usuários podem visualizar sua própria assinatura"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar sua própria assinatura"
    ON public.subscriptions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
