/**
 * Smoke Test — Invocacao Agentica + 7 Quantum Panels
 * Tests full tRPC pipeline: invocation + dashboard + agents.
 */
const BASE = 'http://127.0.0.1:3000';

async function tRPCQuery(router: string, procedure: string) {
  const url = `${BASE}/api/trpc/${router}.${procedure}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  // Unwrap superjson: result.data.json
  const inner = data?.result?.data;
  if (inner?.json) return inner.json;
  return inner ?? data;
}

async function tRPCMutation(router: string, procedure: string) {
  const url = `${BASE}/api/trpc/${router}.${procedure}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`POST ${url}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const inner = data?.result?.data;
  if (inner?.json) return inner.json;
  return inner ?? data;
}

function log(emoji: string, msg: string) {
  console.log(`${emoji} [SMOKE] ${msg}`);
}

async function main() {
  log('🚀', '=== INVOCACAO AGENTICA SMOKE TEST ===');
  log('⏱️', new Date().toISOString());
  console.log('');

  let passed = 0;
  let failed = 0;

  // ─── TEST 1: Panel States ───
  try {
    log('🔍', 'Test 1: Estados dos 7 paineis quanticos...');
    const states = await tRPCQuery('invocation', 'panelStates');
    const panels = states?.panels ?? [];

    if (panels.length === 7) {
      log('✅', `PASS: 7 paineis carregados`);
      for (const p of panels) {
        const qs = p.quantumState;
        log('  📊', `${p.name}: coh=${(qs.coherence * 100).toFixed(1)}% fid=${(qs.fidelity * 100).toFixed(1)}% gen=${qs.evolution}`);
      }
      passed++;
    } else {
      log('❌', `FAIL: Esperados 7, obtidos ${panels.length}`);
      failed++;
    }
  } catch (err) {
    log('❌', `FAIL: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
  console.log('');

  // ─── TEST 2: Single Invocation ───
  try {
    log('⚡', 'Test 2: Ciclo de invocacao agentica...');
    const start = Date.now();
    const result = await tRPCMutation('invocation', 'invoke');
    const elapsed = Date.now() - start;

    if (result?.results?.length === 7) {
      log('✅', `PASS: 7 paineis em ${elapsed}ms | events: ${result.webhookEvents} | coherence: ${result.crossPanelCoherence} | fidelity: ${result.overallFidelity}`);
      for (const r of result.results) {
        const icon = r.status === 'pass' ? '✅' : r.status === 'warning' ? '⚠️' : '❌';
        log('  ' + icon, `${r.panelName}: ${r.status} ${r.latencyMs}ms skills ${r.skillsPassed}/${r.skillsValidated}`);
      }
      passed++;
    } else {
      log('❌', `FAIL: results length = ${result?.results?.length ?? 'N/A'}`);
      failed++;
    }
  } catch (err) {
    log('❌', `FAIL: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
  console.log('');

  // ─── TEST 3: Full Smoke Test ───
  try {
    log('🛡️', 'Test 3: Smoke test completo...');
    const start = Date.now();
    const result = await tRPCMutation('invocation', 'smokeTest');
    const elapsed = Date.now() - start;

    if (result?.panels === 7) {
      log('✅', `PASS: ${result.passed ? 'ALL PASSED' : 'HAS FAILURES'} in ${elapsed}ms | ${result.panelsPassed}p ${result.panelsWarning}w ${result.panelsFailed}f | fidelity ${result.avgFidelity}`);
      passed++;
    } else {
      log('❌', `FAIL: panels = ${result?.panels}`);
      failed++;
    }
  } catch (err) {
    log('❌', `FAIL: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
  console.log('');

  // ─── TEST 4: Loop Status ───
  try {
    log('📡', 'Test 4: Status do loop...');
    const status = await tRPCQuery('invocation', 'loopStatus');
    log('✅', `PASS: loopRunning=${status?.loopStatus?.running ?? false} | hasLastInv=${!!status?.lastInvocation}`);
    passed++;
  } catch (err) {
    log('❌', `FAIL: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
  console.log('');

  // ─── TEST 5: Dashboard Stats ───
  try {
    log('📊', 'Test 5: Dashboard stats...');
    const stats = await tRPCQuery('dashboard', 'stats');
    log('✅', `PASS: total=${stats.total} authors=${stats.uniqueAuthors} cats=${Object.keys(stats.byCategory || {}).length}`);
    passed++;
  } catch (err) {
    log('❌', `FAIL: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
  console.log('');

  // ─── TEST 6: Agents List ───
  try {
    log('🤖', 'Test 6: Agents list...');
    const agents = await tRPCQuery('agents', 'list');
    log('✅', `PASS: ${agents.agents?.length ?? 0} agentes, ${agents.summary?.totalSkills ?? 0} skills, ${agents.summary?.totalKnowledge ?? 0} knowledge`);
    passed++;
  } catch (err) {
    log('❌', `FAIL: ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
  console.log('');

  // ─── RESULTS ───
  log('📋', '=== RESULTADO FINAL ===');
  log('✅', `Passed: ${passed}/6`);
  if (failed > 0) log('❌', `Failed: ${failed}/6`);
  log('⏱️', new Date().toISOString());

  if (failed > 0) process.exit(1);
}

main().catch(err => {
  log('💥', `Fatal: ${err}`);
  process.exit(1);
});