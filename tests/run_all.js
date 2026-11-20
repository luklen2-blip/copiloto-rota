const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("====================================================");
console.log("🧪 Iniciando Testes de Validação - Copiloto-Rota");
console.log("====================================================\n");

let failed = false;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed = true;
  }
}

const rootDir = path.resolve(__dirname, "..");

// 1. Validar Estrutura de Pastas e Arquivos Principais
console.log("📂 1. Verificando estrutura de pastas e serviços...");
const requiredPaths = [
  'src/app',
  'src/services',
  'src/types',
  'src/lib',
  'supabase',
  'src/services/financialEngine.ts',
  'src/services/aiExtractor.ts',
  'src/app/api/process-day/route.ts',
  'src/app/api/generate-defense/route.ts',
  'src/components/Header.tsx',
  'src/components/VehicleModal.tsx',
  'src/components/DailyClosureCard.tsx',
  'src/components/ProfitRadioReport.tsx',
  'src/components/MaintenanceBox.tsx',
  'src/components/AntiBlockVault.tsx',
  'src/lib/storage.ts',
  'src/lib/subscription.ts',
  'src/lib/pix.ts',
  'src/services/supabaseSync.ts',
  'src/components/AuthModal.tsx',
  'src/components/UpgradeModal.tsx',
  'src/components/WeeklyHistory.tsx',
  'src/app/api/admin/activate-pro/route.ts',
  'src/types/database.types.ts',
  'src/types/dispatcher.types.ts',
  'src/services/dispatcherAgent.ts',
  'src/components/DispatcherAgent.tsx',
  'src/app/api/dispatcher/ocr-proof/route.ts',
  'src/app/api/dispatcher/optimize/route.ts',
  'public/manifest.json',
  'public/sw.js',
  'public/icon-192.png',
  'public/icon-512.png',
  'src/app/page.tsx',
  'src/components/InteractiveTour.tsx',
  'src/app/termos/page.tsx',
  'src/app/privacidade/page.tsx',
  'tests/test_cloud_live.js',
  'render.yaml',
  'Dockerfile',
  '.env.example'
];

requiredPaths.forEach((item) => {
  const fullPath = path.join(rootDir, item);
  assert(fs.existsSync(fullPath), `Arquivo/Pasta encontrado: ${item}`);
});

// 2. Validar Arquivo supabase/schema.sql
console.log("\n📄 2. Verificando manifest.json PWA e supabase/schema.sql...");
const manifestPath = path.join(rootDir, "public", "manifest.json");
assert(fs.existsSync(manifestPath), "manifest.json existe");
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  assert(
    manifest.display === "standalone",
    "PWA display configurado como standalone",
  );
  assert(
    manifest.icons && manifest.icons.length >= 2,
    "PWA icons configurados",
  );
}
const schemaPath = path.join(rootDir, "supabase", "schema.sql");
assert(fs.existsSync(schemaPath), "Arquivo supabase/schema.sql existe");

if (fs.existsSync(schemaPath)) {
  const sql = fs.readFileSync(schemaPath, "utf-8");

  // Verificar tabela vehicles
  assert(sql.includes("public.vehicles"), "Tabela vehicles definida");
  const vehicleColumns = [
    "id",
    "user_id",
    "vehicle_type",
    "model_name",
    "fuel_price",
    "avg_km_per_liter",
    "fixed_monthly_cost",
    "monthly_km_goal",
    "current_odometer",
    "created_at",
  ];
  vehicleColumns.forEach((col) => {
    assert(sql.includes(col), `Coluna vehicles.${col} presente no SQL`);
  });

  // Verificar tabela maintenance_items
  assert(
    sql.includes("public.maintenance_items"),
    "Tabela maintenance_items definida",
  );
  const maintenanceCols = [
    "id",
    "vehicle_id",
    "item_name",
    "replacement_cost",
    "lifespan_km",
    "last_changed_odometer",
    "reserved_balance",
  ];
  maintenanceCols.forEach((col) => {
    assert(
      sql.includes(col),
      `Coluna maintenance_items.${col} presente no SQL`,
    );
  });

  // Verificar tabela daily_logs
  assert(sql.includes("public.daily_logs"), "Tabela daily_logs definida");
  const dailyCols = [
    "id",
    "user_id",
    "log_date",
    "platform",
    "gross_earnings",
    "km_driven",
    "fuel_spent",
    "food_other_spent",
    "calculated_wear_cost",
    "net_profit",
    "raw_input_text",
    "created_at",
  ];
  dailyCols.forEach((col) => {
    assert(sql.includes(col), `Coluna daily_logs.${col} presente no SQL`);
  });

  // Verificar tabela incident_vault
  assert(
    sql.includes("public.incident_vault"),
    "Tabela incident_vault definida",
  );
  const incidentCols = [
    "id",
    "user_id",
    "platform",
    "description",
    "evidence_urls",
    "generated_defense",
    "created_at",
  ];
  incidentCols.forEach((col) => {
    assert(sql.includes(col), `Coluna incident_vault.${col} presente no SQL`);
  });

  // Verificar tabela subscriptions
  assert(sql.includes("public.subscriptions"), "Tabela subscriptions definida");
  const subCols = [
    "id",
    "user_id",
    "email",
    "plan_status",
    "trial_ends_at",
    "current_period_end",
    "updated_at",
  ];
  subCols.forEach((col) => {
    assert(sql.includes(col), `Coluna subscriptions.${col} presente no SQL`);
  });
}

// 3. Validar .env.example
console.log("\n🔑 3. Verificando chaves no .env.example...");
const envExample = fs.readFileSync(path.join(rootDir, ".env.example"), "utf-8");
assert(
  envExample.includes("GEMINI_API_KEY"),
  ".env.example contém GEMINI_API_KEY",
);
assert(
  envExample.includes("NEXT_PUBLIC_SUPABASE_URL"),
  ".env.example contém NEXT_PUBLIC_SUPABASE_URL",
);

// 4. Teste de Unidade do Motor Financeiro (financialEngine)
console.log("\n⚙️ 4. Testando cálculos matemáticos do Motor Financeiro...");
const testScript = `
const { processDailyClosure } = require('./dist-test/financialEngine.js');

const mockVehicle = {
  id: 'veh-1',
  user_id: 'user-1',
  vehicle_type: 'moto',
  model_name: 'Honda CG 160',
  fuel_price: 5.00,
  avg_km_per_liter: 40.0,
  fixed_monthly_cost: 200.00,
  monthly_km_goal: 2000,
  current_odometer: 10000,
  created_at: new Date().toISOString()
};

const mockItems = [
  {
    id: 'item-oleo',
    vehicle_id: 'veh-1',
    item_name: 'Óleo',
    replacement_cost: 40.00,
    lifespan_km: 1000,
    last_changed_odometer: 9200,
    reserved_balance: 8.00
  }
];

// Teste 1: Combustível estimado (100km / 40 * 5 = 12.50), Fixo diluído (200 / 2000 * 100 = 10.00)
// Desgaste (40 / 1000 * 100 = 4.00), Gasto comida = 10.00
// Lucro líquido esperado: 150 - (12.50 + 10.00 + 4.00 + 10.00) = 113.50
const result1 = processDailyClosure(mockVehicle, mockItems, {
  gross_earnings: 150,
  km_driven: 100,
  food_other_spent: 10,
  platform: 'Uber'
});

if (result1.fuel_spent !== 12.50) throw new Error('Combustível estimado incorreto: ' + result1.fuel_spent);
if (result1.diluted_fixed_cost !== 10.00) throw new Error('Custo fixo incorreto: ' + result1.diluted_fixed_cost);
if (result1.calculated_wear_cost !== 4.00) throw new Error('Custo desgaste incorreto: ' + result1.calculated_wear_cost);
if (result1.net_profit !== 113.50) throw new Error('Lucro líquido incorreto: ' + result1.net_profit);
if (result1.new_odometer !== 10100) throw new Error('Novo odômetro incorreto: ' + result1.new_odometer);

// Teste 2: Alerta de peça crítica (<= 15% vida restante) e rentabilidade baixa (< 0.80/km)
const mockItemsCritical = [
  {
    id: 'item-oleo',
    vehicle_id: 'veh-1',
    item_name: 'Óleo',
    replacement_cost: 40.00,
    lifespan_km: 1000,
    last_changed_odometer: 9150, // Com 100km adicionais -> 10100 - 9150 = 950km rodados (50km restantes = 5% vida útil)
    reserved_balance: 35.00
  }
];

const resultCritical = processDailyClosure(mockVehicle, mockItemsCritical, {
  gross_earnings: 50, // Baixo faturamento para testar alerta de rentabilidade
  km_driven: 100,
  fuel_spent: 20
});

const hasCriticalAlert = resultCritical.alerts.some(a => a.includes('ALERTA DE PEÇA CRÍTICA') || a.includes('Óleo'));
const hasProfitAlert = resultCritical.alerts.some(a => a.includes('RENTABILIDADE CRÍTICA'));

if (!hasCriticalAlert) throw new Error('Falha ao gerar alerta de peça crítica');
if (!hasProfitAlert) throw new Error('Falha ao gerar alerta de lucro por km < 0.80');

console.log('✅ Cálculos do motor financeiro e alertas validados com perfeição!');
`;

try {
  // Transpila temporariamente financialEngine para JS para teste unitário
  execSync(
    "npx esbuild src/services/financialEngine.ts --bundle --platform=node --outdir=dist-test",
    { cwd: rootDir, stdio: "pipe" },
  );
  execSync(`node -e "${testScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`, {
    cwd: rootDir,
    stdio: "inherit",
  });
  // Limpar dist-test
  fs.rmSync(path.join(rootDir, "dist-test"), { recursive: true, force: true });
} catch (testErr) {
  console.error(
    "❌ [FAIL] Erro nos testes unitários do financialEngine:",
    testErr.message,
  );
  failed = true;
}

// 5. Teste de Unidade do Gerador PIX Oficial (Bacen EMV)
console.log("\n💳 5. Testando Gerador PIX Oficial e Assinatura...");
const pixTestScript = `
const { generatePixPayload } = require('./dist-test-pix/pix.js');
const { getSubscriptionStatus } = require('./dist-test-pix/subscription.js');

// Teste PIX EMV
const payload = generatePixPayload({
  pixKey: 'luklen2@gmail.com',
  name: 'Luciano da Silva Sant Anna',
  city: 'Rio de Janeiro',
  amount: 19.90,
  txId: 'COPILOTO'
});

if (!payload.includes('br.gov.bcb.pix')) throw new Error('Payload PIX sem domínio Bacen');
if (!payload.includes('luklen2@gmail.com')) throw new Error('Payload PIX sem chave correta');
if (!payload.includes('19.90')) throw new Error('Payload PIX sem valor correto');
if (payload.length < 60) throw new Error('Payload PIX com tamanho inválido');

// Teste Assinatura
const trialStatus = getSubscriptionStatus({
  id: 'sub-1',
  user_id: 'user-1',
  email: 'teste@exemplo.com',
  plan_status: 'trial',
  trial_ends_at: new Date(Date.now() + 5 * 86400000).toISOString(),
  current_period_end: null,
  updated_at: new Date().toISOString()
});

if (!trialStatus.isPro || !trialStatus.isTrial) throw new Error('Status trial inválido');

const expiredStatus = getSubscriptionStatus({
  id: 'sub-2',
  user_id: 'user-2',
  email: 'teste@exemplo.com',
  plan_status: 'trial',
  trial_ends_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  current_period_end: null,
  updated_at: new Date().toISOString()
});

if (expiredStatus.isPro) throw new Error('Trial vencido não deveria ser Pro');

console.log('✅ PIX EMV Copia-e-Cola e regras de assinatura validadas com sucesso!');
`;

try {
  execSync(
    "npx esbuild src/lib/pix.ts src/lib/subscription.ts --bundle --platform=node --outdir=dist-test-pix",
    { cwd: rootDir, stdio: "pipe" },
  );
  execSync(
    `node -e "${pixTestScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { cwd: rootDir, stdio: "inherit" },
  );
  fs.rmSync(path.join(rootDir, "dist-test-pix"), {
    recursive: true,
    force: true,
  });
} catch (pixErr) {
  console.error(
    "❌ [FAIL] Erro nos testes unitários do PIX e Assinatura:",
    pixErr.message,
  );
  failed = true;
}

// 5.5 Testando Agente Despachante & Entregas
console.log("\n🚚 5.5. Testando Agente Despachante & Entregas (WhatsApp, GPS, Rotas)...");
const dispatcherTestScript = `
const {
  sanitizeBrazilianPhone,
  generateWhatsAppUrl,
  generateGpsUrl,
  parseDeliveryListText,
  optimizeRouteStops,
  analyzeDeliveryProofWithAI
} = require('./dist-test-dispatcher/dispatcherAgent.js');

// 1. Sanitização de telefone
if (sanitizeBrazilianPhone('11987654321') !== '5511987654321') throw new Error('Falha na sanitização de telefone 11 dígitos');
if (sanitizeBrazilianPhone('5511987654321') !== '5511987654321') throw new Error('Falha na sanitização com 55 já presente');

// 2. Geração de URLs de WhatsApp
const mockStop = {
  id: 'st-1',
  order_id: 'PED-999',
  customer_name: 'Ana Silva',
  customer_phone: '11988887777',
  address: 'Rua Augusta, 1000 - SP',
  status: 'pending'
};
const waUrlPre = generateWhatsAppUrl(mockStop, 'pre_arrival', 'João');
if (!waUrlPre.includes('wa.me/5511988887777')) throw new Error('URL WhatsApp não contém telefone formatado');
if (!waUrlPre.includes(encodeURIComponent('Ana Silva'))) throw new Error('URL WhatsApp não contém nome do cliente');

const waUrlArrived = generateWhatsAppUrl(mockStop, 'arrived');
if (!waUrlArrived.includes(encodeURIComponent('cheguei'))) throw new Error('Mensagem arrived incorreta');

// 3. Geração de GPS
const wazeUrl = generateGpsUrl('Av Paulista 1000', 'waze');
if (!wazeUrl.includes('waze.com') || !wazeUrl.includes('navigate=yes')) throw new Error('URL Waze inválida');

const mapsUrl = generateGpsUrl('Av Paulista 1000', 'google_maps');
if (!mapsUrl.includes('google.com/maps')) throw new Error('URL Google Maps inválida');

// 4. Parser de lista em texto
const sampleList = '1. Maria - 11999991111 - Rua das Palmeiras 50 - Pedido #101\\n2. Roberto - 11988882222 - Av Brasil 200 - Pedido #102';
const parsed = parseDeliveryListText(sampleList);
if (parsed.length !== 2) throw new Error('Falha no parser de texto: esperava 2 paradas');
if (parsed[0].customer_name !== 'Maria') throw new Error('Nome extraído incorreto');
if (!parsed[0].estimated_arrival) throw new Error('Previsão de chegada não calculada');

// 5. OCR Heurístico
analyzeDeliveryProofWithAI('data:image/jpeg;base64,mock', 'image/jpeg', mockStop).then(res => {
  if (!res.signature_present) throw new Error('Auditoria de canhoto deveria detectar assinatura');
  console.log('✅ Agente Despachante validado com sucesso (Telefones, WhatsApp, GPS, Rotas e OCR)!');
}).catch(err => {
  console.error(err);
  process.exit(1);
});
`;

try {
  execSync(
    "npx esbuild src/services/dispatcherAgent.ts --bundle --platform=node --outdir=dist-test-dispatcher",
    { cwd: rootDir, stdio: "pipe" },
  );
  execSync(
    `node -e "${dispatcherTestScript.replace(/"/g, '\\"').replace(/\n/g, " ")}"`,
    { cwd: rootDir, stdio: "inherit" },
  );
  fs.rmSync(path.join(rootDir, "dist-test-dispatcher"), {
    recursive: true,
    force: true,
  });
} catch (dispErr) {
  console.error(
    "❌ [FAIL] Erro nos testes unitários do Agente Despachante:",
    dispErr.message,
  );
  failed = true;
}

// 6. Validação do TypeScript
console.log("\n🔍 6. Verificando compilação do TypeScript (tsc --noEmit)...");
try {
  execSync("npx tsc --noEmit", { cwd: rootDir, stdio: "inherit" });
  console.log("✅ [PASS] TypeScript verificado sem erros de tipo!");
} catch (err) {
  console.error("❌ [FAIL] Erro na compilação do TypeScript");
  failed = true;
}

console.log("\n====================================================");
if (failed) {
  console.error("❌ Falha nos testes de integridade.");
  process.exit(1);
} else {
  console.log("🎉 Todos os testes passaram com sucesso!");
  process.exit(0);
}
