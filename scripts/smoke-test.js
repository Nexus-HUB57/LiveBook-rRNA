const http = require('http');
const BASE = 'http://127.0.0.1:3000';

function tRPC(method, router, procedure) {
  return new Promise((resolve, reject) => {
    const url = `${BASE}/api/trpc/${router}.${procedure}`;
    const opts = {
      method: method === 'mutation' ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      family: 4,
      timeout: 15000,
    };
    const req = http.request(url, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode >= 300) return reject(new Error(`${res.statusCode} ${data.slice(0, 200)}`));
        try {
          const json = JSON.parse(data);
          const inner = json?.result?.data;
          resolve(inner?.json ?? inner ?? json);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (method === 'mutation') req.write(JSON.stringify({}));
    req.end();
  });
}

const log = (e, m) => console.log(`${e} [SMOKE] ${m}`);

async function main() {
  log('🚀', '=== INVOCACAO AGENTICA SMOKE TEST ===');
  log('⏱️', new Date().toISOString());
  console.log('');
  let p = 0, f = 0;

  // Test 1
  try {
    log('🔍', 'Test 1: 7 paineis quanticos...');
    const s = await tRPC('query', 'invocation', 'panelStates');
    const panels = s?.panels ?? [];
    if (panels.length === 7) {
      log('✅', `PASS: 7 paineis`);
      for (const pn of panels) { log('  📊', `${pn.name}: fid=${(pn.quantumState.fidelity*100).toFixed(1)}% gen=${pn.quantumState.evolution}`); }
      p++;
    } else { log('❌', `FAIL: ${panels.length}`); f++; }
  } catch (e) { log('❌', `FAIL: ${e.message}`); f++; }
  console.log('');

  // Test 2
  try {
    log('⚡', 'Test 2: Ciclo invocacao...');
    const t0 = Date.now();
    const r = await tRPC('mutation', 'invocation', 'invoke');
    const ms = Date.now() - t0;
    if (r?.results?.length === 7) {
      log('✅', `PASS: 7 paineis ${ms}ms | events=${r.webhookEvents} coherence=${r.crossPanelCoherence} fidelity=${r.overallFidelity}`);
      for (const x of r.results) { log(`  ${x.status==='pass'?'✅':'⚠️'}`, `${x.panelName}: ${x.status} ${x.latencyMs}ms skills ${x.skillsPassed}/${x.skillsValidated}`); }
      p++;
    } else { log('❌', `FAIL: results=${r?.results?.length}`); f++; }
  } catch (e) { log('❌', `FAIL: ${e.message}`); f++; }
  console.log('');

  // Test 3
  try {
    log('🛡️', 'Test 3: Smoke test completo...');
    const t0 = Date.now();
    const r = await tRPC('mutation', 'invocation', 'smokeTest');
    const ms = Date.now() - t0;
    if (r?.panels === 7) {
      log('✅', `PASS: ${r.passed?'ALL PASSED':'FAILURES'} ${ms}ms | ${r.panelsPassed}p ${r.panelsWarning}w ${r.panelsFailed}f | fidelity=${r.avgFidelity}`);
      p++;
    } else { log('❌', `FAIL: panels=${r?.panels}`); f++; }
  } catch (e) { log('❌', `FAIL: ${e.message}`); f++; }
  console.log('');

  // Test 4
  try {
    log('📡', 'Test 4: Loop status...');
    const s = await tRPC('query', 'invocation', 'loopStatus');
    log('✅', `PASS: running=${s?.loopStatus?.running??false} hasInv=${!!s?.lastInvocation}`);
    p++;
  } catch (e) { log('❌', `FAIL: ${e.message}`); f++; }
  console.log('');

  // Test 5
  try {
    log('📊', 'Test 5: Dashboard stats...');
    const s = await tRPC('query', 'dashboard', 'stats');
    log('✅', `PASS: total=${s.total} authors=${s.uniqueAuthors} cats=${Object.keys(s.byCategory||{}).length}`);
    p++;
  } catch (e) { log('❌', `FAIL: ${e.message}`); f++; }
  console.log('');

  // Test 6
  try {
    log('🤖', 'Test 6: Agents list...');
    const s = await tRPC('query', 'agents', 'list');
    log('✅', `PASS: ${s.agents?.length??0} agentes ${s.summary?.totalSkills??0} skills ${s.summary?.totalKnowledge??0} knowledge`);
    p++;
  } catch (e) { log('❌', `FAIL: ${e.message}`); f++; }
  console.log('');

  log('📋', `=== RESULTADO: ${p}/6 passed, ${f}/6 failed ===`);
  if (f > 0) process.exit(1);
}

main().catch(e => { log('💥', `Fatal: ${e.message}`); process.exit(1); });