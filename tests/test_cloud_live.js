/**
 * Suíte de Testes de Homologação Ao Vivo na Nuvem (Live Cloud E2E)
 * Uso: node tests/test_cloud_live.js [URL_DE_PRODUCAO]
 * Exemplo: node tests/test_cloud_live.js https://copiloto-rota.onrender.com
 *          node tests/test_cloud_live.js http://localhost:3001
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const targetUrl = process.argv[2] || process.env.CLOUD_URL || 'http://localhost:3001';

console.log('===============================================================');
console.log('🚀 SUÍTE DE TESTES AO VIVO NA NUVEM (LIVE CLOUD E2E) 24/7');
console.log(`🌐 Alvo: ${targetUrl}`);
console.log('===============================================================\n');

let failed = false;

function fetchUrl(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(endpoint, targetUrl);
    const isHttps = fullUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
      // rejectUnauthorized: false evita erros com certificados SSL intermediários
      rejectUnauthorized: false,
      timeout: options.timeout || 15000,
    };

    const req = client.request(fullUrl, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout de requisição (${reqOptions.timeout}ms)`));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function testAssert(condition, testName, details = '') {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName} ${details ? `(${details})` : ''}`);
    failed = true;
  }
}

async function runLiveSuite() {
  try {
    // 1. Health Check Obrigatório (/api/health)
    console.log('🔍 1. Verificando Endpoint de Monitoramento (/api/health)...');
    try {
      const healthRes = await fetchUrl('/api/health');
      testAssert(healthRes.statusCode === 200, 'Health check responde HTTP 200', `Status: ${healthRes.statusCode}`);
      const healthData = JSON.parse(healthRes.body);
      testAssert(healthData.status === 'ok', 'Status retornado é "ok"');
      testAssert(healthData.app === 'Copiloto-Rota', 'Nome da aplicação é Copiloto-Rota');
      testAssert(typeof healthData.uptime_seconds === 'number', 'Uptime presente em segundos');
    } catch (err) {
      testAssert(false, 'Health check disponível', err.message);
    }

    // 2. Carregamento da Aplicação Principal (/)
    console.log('\n📱 2. Verificando Carregamento da Aplicação Principal (/)...');
    try {
      const homeRes = await fetchUrl('/');
      testAssert(homeRes.statusCode === 200, 'Página inicial responde HTTP 200', `Status: ${homeRes.statusCode}`);
      testAssert(homeRes.body.includes('Copiloto') || homeRes.body.includes('Rota'), 'Título do Copiloto-Rota presente no HTML');
      testAssert(homeRes.body.includes('manifest.json'), 'PWA manifest.json referenciado no HTML');
    } catch (err) {
      testAssert(false, 'Página principal acessível', err.message);
    }

    // 3. PWA Assets (manifest.json e sw.js)
    console.log('\n📲 3. Verificando PWA e Service Worker (/manifest.json, /sw.js)...');
    try {
      const manifestRes = await fetchUrl('/manifest.json');
      testAssert(manifestRes.statusCode === 200, 'manifest.json responde HTTP 200');
      const manifest = JSON.parse(manifestRes.body);
      testAssert(manifest.display === 'standalone', 'PWA configurado em modo standalone');

      const swRes = await fetchUrl('/sw.js');
      testAssert(swRes.statusCode === 200, 'sw.js (Service Worker) responde HTTP 200');
    } catch (err) {
      testAssert(false, 'Assets PWA disponíveis', err.message);
    }

    // 4. Páginas Legais e LGPD (/termos e /privacidade)
    console.log('\n⚖️ 4. Verificando Conformidade Regulatória (/termos e /privacidade)...');
    try {
      const termosRes = await fetchUrl('/termos');
      testAssert(termosRes.statusCode === 200, 'Página /termos responde HTTP 200');
      testAssert(termosRes.body.includes('Termos'), 'Conteúdo de Termos de Uso presente');

      const privRes = await fetchUrl('/privacidade');
      testAssert(privRes.statusCode === 200, 'Página /privacidade responde HTTP 200');
      testAssert(privRes.body.includes('LGPD'), 'Conformidade LGPD explícita na política');
    } catch (err) {
      testAssert(false, 'Páginas legais disponíveis', err.message);
    }

    // 5. Rota de Processamento Diário (/api/process-day)
    console.log('\n⚙️ 5. Testando API de Fechamento (/api/process-day)...');
    try {
      const payload = {
        text: 'Fiz 150 no iFood, rodei 100 km e gastei 25 de gasolina',
        vehicle: {
          id: 'v-test',
          user_id: 'u-test',
          vehicle_type: 'moto',
          model_name: 'Honda CG 160 Fan',
          fuel_price: 6.00,
          avg_km_per_liter: 35,
          fixed_monthly_cost: 150,
          monthly_km_goal: 3000,
          current_odometer: 15000,
          created_at: new Date().toISOString()
        },
        maintenanceItems: [
          {
            id: 'm-1',
            vehicle_id: 'v-test',
            item_name: 'Óleo Motor 10W30',
            replacement_cost: 45,
            lifespan_km: 1500,
            last_changed_odometer: 14500,
            reserved_balance: 15
          }
        ]
      };

      const procRes = await fetchUrl('/api/process-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload
      });

      testAssert(procRes.statusCode === 200, 'POST /api/process-day responde HTTP 200');
      const procData = JSON.parse(procRes.body);
      testAssert(procData.success === true, 'Fechamento processado com sucesso');
      testAssert(typeof procData.closure?.net_profit === 'number', 'Lucro líquido calculado');
    } catch (err) {
      testAssert(false, 'API de fechamento operacional', err.message);
    }

    // 6. APIs do Agente Despachante & Entregas (/api/dispatcher/optimize e /api/dispatcher/ocr-proof)
    console.log('\n🚚 6. Testando APIs do Agente Despachante (/api/dispatcher/*)...');
    try {
      const optPayload = {
        rawText: '1. Carlos - 11988887777 - Rua Augusta 1000 - Pedido #201\n2. Marina - 11977776666 - Av Paulista 500 - Pedido #202'
      };
      const optRes = await fetchUrl('/api/dispatcher/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: optPayload
      });
      testAssert(optRes.statusCode === 200, 'POST /api/dispatcher/optimize responde HTTP 200');
      const optData = JSON.parse(optRes.body);
      testAssert(optData.success === true, 'Otimização e roteirização bem-sucedida');
      testAssert(Array.isArray(optData.stops) && optData.stops.length === 2, '2 paradas estruturadas retornadas');

      const ocrPayload = {
        imageBase64: 'data:image/jpeg;base64,dGVzdA==',
        expectedStop: { order_id: 'PED-201', customer_name: 'Carlos' }
      };
      const ocrRes = await fetchUrl('/api/dispatcher/ocr-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ocrPayload
      });
      testAssert(ocrRes.statusCode === 200, 'POST /api/dispatcher/ocr-proof responde HTTP 200');
      const ocrData = JSON.parse(ocrRes.body);
      testAssert(ocrData.success === true, 'Auditoria de canhoto OCR executada com sucesso');
      testAssert(ocrData.result?.signature_present === true, 'Assinatura detectada no comprovante');
    } catch (err) {
      testAssert(false, 'APIs do Agente Despachante operacionais', err.message);
    }

    console.log('\n===============================================================');
    if (failed) {
      console.error('❌ ALERTA: Alguns testes ao vivo falharam.');
      process.exit(1);
    } else {
      console.log('🎉 TODOS OS TESTES AO VIVO PASSARAM COM SUCESSO 100%!');
      console.log('✅ A aplicação está pronta e homologada para operação 24/7 na nuvem.');
      process.exit(0);
    }
  } catch (globalErr) {
    console.error('Erro crítico na execução:', globalErr);
    process.exit(1);
  }
}

runLiveSuite();
