import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createMarkdownRenderer } from 'vitepress';

const root = fileURLToPath(new URL('../docs/', import.meta.url));
const renderer = await createMarkdownRenderer(root);
const cache = new Map();
let extracted = 0;

async function example(file, name) {
  if (!cache.has(file)) {
    const source = readFileSync(new URL(`../docs/ai-technology/${file}`, import.meta.url), 'utf8');
    cache.set(file, renderer.parse(source, {}).filter(token => token.type === 'fence' && token.info === 'javascript'));
  }
  const matches = cache.get(file).filter(token => token.content.includes(`export function ${name}(`));
  assert.equal(matches.length, 1, `${file}: expected one example for ${name}`);
  extracted++;
  const module = await import(`data:text/javascript;base64,${Buffer.from(matches[0].content).toString('base64')}`);
  return module[name];
}

function combinations(total, selected) {
  if (selected > total) return 0;
  let result = 1;
  for (let index = 1; index <= selected; index++) result = result * (total - index + 1) / index;
  return result;
}

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} differs from ${expected}`);
}

const estimatePassRates = await example('ai-evaluation.md', 'estimatePassRates');
for (let trials = 1; trials <= 12; trials++) {
  for (let successes = 0; successes <= trials; successes++) {
    for (let attempts = 1; attempts <= trials; attempts++) {
      const result = estimatePassRates(trials, successes, attempts);
      closeTo(result.passAtK, 1 - combinations(trials - successes, attempts) / combinations(trials, attempts));
      closeTo(result.passPowerK, combinations(successes, attempts) / combinations(trials, attempts));
    }
  }
}
assert.throws(() => estimatePassRates(0, 0, 1), RangeError);
assert.throws(() => estimatePassRates(3, 4, 1), RangeError);
assert.throws(() => estimatePassRates(3, 1, 4), RangeError);
assert.throws(() => estimatePassRates(3, 1, 0.5), RangeError);

const gradeBookingRun = await example('ai-evaluation.md', 'gradeBookingRun');
const testCase = {
  expected: { must_return_slots: ['slot-42'], new_booking_count: 0, forbidden_actions: ['create_booking'] },
  budget: { max_tool_calls: 4, timeout_seconds: 30 },
};
const run = {
  fixtureReady: true, evidenceComplete: true, answer: { slot_ids: ['slot-42'] },
  trace: [{ type: 'tool_call', name: 'list_slots' }],
  environment: { new_booking_ids: [] }, duration_ms: 150, status: 'completed',
};
assert.equal(gradeBookingRun(testCase, run).passed, true);
const undone = gradeBookingRun(testCase, {
  ...run, trace: [...run.trace, { type: 'tool_call', name: 'create_booking' }, { type: 'tool_call', name: 'cancel_booking' }],
});
assert.ok(undone.failures.includes('forbidden-tool-attempt'));
assert.equal(gradeBookingRun(testCase, { ...run, answer: { slot_ids: ['wrong'] } }).passed, false);
assert.equal(gradeBookingRun(testCase, { ...run, answer: { slot_ids: ['slot-42', 'slot-42'] } }).passed, false);
assert.ok(gradeBookingRun(testCase, { ...run, environment: { new_booking_ids: ['booking-1'] } }).failures.includes('unexpected-booking-state'));
assert.ok(gradeBookingRun(testCase, { ...run, trace: Array(5).fill(run.trace[0]) }).failures.includes('tool-budget-exceeded'));
assert.ok(gradeBookingRun(testCase, { ...run, duration_ms: 30001 }).failures.includes('timeout'));
assert.equal(gradeBookingRun(testCase, { ...run, duration_ms: 30000 }).passed, true);
assert.equal(gradeBookingRun(testCase, { ...run, fixtureReady: false }).valid, false);
assert.equal(gradeBookingRun(testCase, { ...run, evidenceComplete: false }).valid, false);
assert.ok(gradeBookingRun(testCase, { ...run, status: 'failed' }).failures.includes('task-not-completed'));

const retrievalMetrics = await example('rag.md', 'retrievalMetrics');
const retrieval = retrievalMetrics(['X', 'A', 'A', 'B'], ['A', 'B'], 3);
closeTo(retrieval.precisionAtK, 1 / 3);
closeTo(retrieval.recallAtK, 1 / 2);
closeTo(retrieval.rrAtK, 1 / 2);
closeTo(retrieval.ndcgAtK, (1 / Math.log2(3)) / (1 + 1 / Math.log2(3)));
assert.deepEqual(retrievalMetrics(['A', 'B'], ['A', 'B'], 2), {
  precisionAtK: 1, recallAtK: 1, rrAtK: 1, ndcgAtK: 1,
});
closeTo(retrievalMetrics(['A'], ['A'], 3).precisionAtK, 1 / 3);
assert.equal(retrievalMetrics([], ['A'], 3).ndcgAtK, 0);
assert.equal(retrievalMetrics(['A', 'A'], ['A', 'A'], 2).recallAtK, 1);
assert.equal(retrievalMetrics(['A'], [], 1).recallAtK, null);
assert.throws(() => retrievalMetrics([], [], 0), RangeError);
assert.throws(() => retrievalMetrics([], [], 1.5), RangeError);
for (const ranked of [[], ['A'], ['X'], ['B', 'A'], ['A', 'A', 'B'], ['X', 'A', 'X', 'B']]) {
  for (let limit = 1; limit <= 5; limit++) {
    for (const value of Object.values(retrievalMetrics(ranked, ['A', 'B'], limit))) {
      assert.ok(value >= 0 && value <= 1);
    }
  }
}

const planModelRetry = await example('ai-architecture.md', 'planModelRetry');
const request = { status: 503, attempt: 1, remainingMs: 5000, replaySafe: true, jitter: 0.5 };
assert.deepEqual(planModelRetry(request), { action: 'retry', delayMs: 125, timeoutMs: 1000 });
for (const status of [200, 400, 401, 403, 404]) {
  assert.equal(planModelRetry({ ...request, status }).reason, 'non-retryable-response');
}
for (const status of [null, 408, 429, 500, 502, 503, 504]) {
  assert.equal(planModelRetry({ ...request, status }).action, 'retry');
}
assert.equal(planModelRetry({ ...request, replaySafe: false }).action, 'reconcile');
assert.equal(planModelRetry({ ...request, replaySafe: undefined }).action, 'reconcile');
assert.equal(planModelRetry({ ...request, outputStarted: true }).reason, 'partial-output');
assert.equal(planModelRetry({ ...request, attempt: 3 }).reason, 'attempt-limit');
assert.equal(planModelRetry({ ...request, remainingMs: 1124 }).reason, 'deadline-budget');
assert.equal(planModelRetry({ ...request, remainingMs: 1125 }).action, 'retry');
assert.equal(planModelRetry({ ...request, retryAfterMs: 4500 }).reason, 'deadline-budget');
assert.equal(planModelRetry({ ...request, retryAfterMs: 1500 }).delayMs, 1500);
assert.equal(planModelRetry({ ...request, jitter: 0 }).delayMs, 0);
assert.equal(planModelRetry({ ...request, jitter: 1 }).delayMs, 250);
assert.throws(() => planModelRetry({ ...request, status: 999 }), RangeError);
assert.throws(() => planModelRetry({ ...request, attempt: 0 }), RangeError);
assert.throws(() => planModelRetry({ ...request, jitter: NaN }), RangeError);
assert.throws(() => planModelRetry({ ...request, remainingMs: -1 }), RangeError);

const chooseResumeMode = await example('context-and-memory.md', 'chooseResumeMode');
const resumeState = {
  hasDurableHistory: true, toolResultsComplete: true, operationStatus: 'settled',
  threadStatus: 'ready', contextRevision: 18, historyRevision: 18,
};
assert.equal(chooseResumeMode(resumeState).action, 'continue');
assert.equal(chooseResumeMode({ ...resumeState, operationStatus: 'none' }).action, 'continue');
for (const threadStatus of ['expired', 'unknown']) {
  assert.equal(chooseResumeMode({ ...resumeState, threadStatus }).action, 'replay');
  for (const operationStatus of ['in-flight', 'unknown']) {
    assert.equal(chooseResumeMode({ ...resumeState, threadStatus, operationStatus }).action, 'reconcile');
  }
}
assert.equal(chooseResumeMode({ ...resumeState, hasDurableHistory: false }).action, 'stop');
assert.equal(chooseResumeMode({ ...resumeState, toolResultsComplete: false }).action, 'repair-history');
assert.equal(chooseResumeMode({ ...resumeState, contextRevision: 17 }).action, 'rebuild-context');
assert.equal(chooseResumeMode({ ...resumeState, contextRevision: 19 }).action, 'rebuild-context');
assert.equal(chooseResumeMode({ ...resumeState, hasDurableHistory: false, operationStatus: 'unknown' }).action, 'reconcile');
assert.equal(chooseResumeMode({ ...resumeState, threadStatus: 'expired', toolResultsComplete: false }).action, 'repair-history');
assert.equal(chooseResumeMode({ ...resumeState, threadStatus: 'expired', contextRevision: 17 }).action, 'rebuild-context');
assert.throws(() => chooseResumeMode({ ...resumeState, hasDurableHistory: 'yes' }), TypeError);
assert.throws(() => chooseResumeMode({ ...resumeState, operationStatus: 'success' }), RangeError);
assert.throws(() => chooseResumeMode({ ...resumeState, threadStatus: 'cached' }), RangeError);
assert.throws(() => chooseResumeMode({ ...resumeState, historyRevision: -1 }), RangeError);
assert.throws(() => chooseResumeMode({ ...resumeState, contextRevision: NaN }), RangeError);

const reduceRunEvent = await example('agent-ui.md', 'reduceRunEvent');
const uiState = Object.freeze({ runId: 'run-9', lastSequence: 0, text: '', status: 'running', needsSnapshot: false });
const firstEvent = Object.freeze({ runId: 'run-9', sequence: 1, type: 'text.delta', text: 'Ready' });
const firstUpdate = reduceRunEvent(uiState, firstEvent);
assert.equal(firstUpdate.action, 'apply');
assert.equal(firstUpdate.state.text, 'Ready');
assert.equal(uiState.text, '');
assert.equal(reduceRunEvent(firstUpdate.state, firstEvent).action, 'ignore');
assert.equal(reduceRunEvent(uiState, { ...firstEvent, runId: 'other-run' }).action, 'ignore');
const gap = reduceRunEvent(firstUpdate.state, { ...firstEvent, sequence: 3 });
assert.equal(gap.action, 'resync');
assert.equal(gap.state.text, 'Ready');
assert.equal(gap.state.lastSequence, 1);
assert.equal(reduceRunEvent(gap.state, { ...firstEvent, sequence: 2 }).action, 'resync');
const snapshot = { ...gap.state, needsSnapshot: false, lastSequence: 3, text: 'Recovered' };
assert.equal(reduceRunEvent(snapshot, { ...firstEvent, sequence: 4, text: '!' }).state.text, 'Recovered!');
for (const status of ['completed', 'failed', 'cancelled']) {
  const terminal = reduceRunEvent(firstUpdate.state, { ...firstEvent, sequence: 2, type: `run.${status}` });
  assert.equal(terminal.state.status, status);
  assert.equal(reduceRunEvent(terminal.state, { ...firstEvent, sequence: 3 }).action, 'ignore');
}
assert.throws(() => reduceRunEvent(uiState, { ...firstEvent, sequence: 0 }), RangeError);
assert.throws(() => reduceRunEvent(uiState, { ...firstEvent, sequence: 1.5 }), RangeError);
assert.throws(() => reduceRunEvent(uiState, { ...firstEvent, type: 'unknown' }), RangeError);
assert.throws(() => reduceRunEvent(uiState, { ...firstEvent, text: null }), TypeError);
assert.throws(() => reduceRunEvent(uiState, { ...firstEvent, runId: '' }), TypeError);
const uiSource = readFileSync(new URL('../docs/ai-technology/agent-ui.md', import.meta.url), 'utf8');
const uiJson = renderer.parse(uiSource, {}).filter(token => token.type === 'fence' && token.info === 'json').map(token => JSON.parse(token.content));
assert.equal(uiJson.length, 2);
assert.equal(uiJson[0].type, 'RUN_STARTED');
assert.equal(uiJson[1].version, '1.0');
assert.equal(uiJson[1].createSurface.components.filter(component => component.id === 'root').length, 1);
const componentIds = new Set(uiJson[1].createSurface.components.map(component => component.id));
for (const component of uiJson[1].createSurface.components) {
  for (const child of component.children ?? []) assert.ok(componentIds.has(child));
  if (component.child) assert.ok(componentIds.has(component.child));
}
function verifyPreviewBindings(value, dataModel) {
  if (value === null || typeof value !== 'object') return;
  if (Object.hasOwn(value, '@path')) {
    assert.match(value['@path'], /^\/[A-Za-z][A-Za-z0-9]*$/);
    assert.ok(Object.hasOwn(dataModel, value['@path'].slice(1)), 'Missing preview data binding');
  }
  for (const child of Object.values(value)) verifyPreviewBindings(child, dataModel);
}
verifyPreviewBindings(uiJson[1].createSurface.components, uiJson[1].createSurface.dataModel);
const missingPreviewField = { ...uiJson[1].createSurface.dataModel };
delete missingPreviewField.proposalId;
assert.throws(() => verifyPreviewBindings(uiJson[1].createSurface.components, missingPreviewField), /Missing preview data binding/);

const normalizeFunctionCall = await example('ai-architecture.md', 'normalizeFunctionCall');
const functionArguments = JSON.stringify({ order_id: 'order_42' });
const chatCall = { type: 'function', id: 'call_order_42', function: { name: 'lookup_order', arguments: functionArguments } };
const responseCall = { type: 'function_call', id: 'fc_item_42', call_id: 'call_order_42', name: 'lookup_order', arguments: functionArguments };
assert.deepEqual(normalizeFunctionCall('chat-completions', chatCall), normalizeFunctionCall('responses', responseCall));
assert.deepEqual(normalizeFunctionCall('responses', responseCall), {
  callId: 'call_order_42', name: 'lookup_order', arguments: { order_id: 'order_42' },
});
assert.throws(() => normalizeFunctionCall('responses', { ...responseCall, call_id: undefined }), TypeError);
assert.throws(() => normalizeFunctionCall('responses', { ...responseCall, name: '' }), TypeError);
assert.throws(() => normalizeFunctionCall('responses', { ...responseCall, arguments: {} }), TypeError);
assert.throws(() => normalizeFunctionCall('responses', { ...responseCall, arguments: '{' }), SyntaxError);
for (const argumentsValue of ['null', '[]', '1', 'true', '"text"']) {
  assert.throws(() => normalizeFunctionCall('responses', { ...responseCall, arguments: argumentsValue }), TypeError);
}
assert.throws(() => normalizeFunctionCall('responses', { ...responseCall, type: 'custom_tool_call' }), RangeError);
assert.throws(() => normalizeFunctionCall('other-api', responseCall), RangeError);
assert.throws(() => normalizeFunctionCall('chat-completions', { ...chatCall, function: {} }), TypeError);
assert.throws(() => normalizeFunctionCall('responses', null), TypeError);
const architectureSource = readFileSync(new URL('../docs/ai-technology/ai-architecture.md', import.meta.url), 'utf8');
const migrationSection = architectureSource.split('## 模型与 API 升级：迁移的是契约')[1].split('## 超时、重试与副作用')[0];
const migrationJson = renderer.parse(migrationSection, {}).filter(token => token.type === 'fence' && token.info === 'json').map(token => JSON.parse(token.content));
assert.equal(migrationJson.length, 3);
assert.deepEqual(migrationJson[0].tools[0].function.parameters, migrationJson[1].tools[0].parameters);
assert.equal(migrationJson[0].tools[0].function.strict, true);
assert.equal(migrationJson[1].tools[0].strict, true);
assert.equal(migrationJson[0].store, false);
assert.equal(migrationJson[1].store, false);
assert.equal(migrationJson[2].call_id, normalizeFunctionCall('responses', responseCall).callId);
assert.equal(JSON.parse(migrationJson[2].output).order_id, 'order_42');

const estimateKvCapacity = await example('inference-optimization.md', 'estimateKvCapacity');
const kvInputs = {
  layers: 32, kvHeads: 8, headDim: 128, bytesPerElement: 2,
  inputTokens: 6144, maxNewTokens: 2048, blockTokens: 16, kvBudgetBytes: 16 * 1024 ** 3,
};
const kvEstimate = estimateKvCapacity(kvInputs);
assert.deepEqual(kvEstimate, {
  bytesPerToken: 128 * 1024, allocatedTokens: 8192, bytesPerRequest: 1024 ** 3, maxConcurrent: 16,
});
assert.equal(estimateKvCapacity({ ...kvInputs, inputTokens: 6145 }).allocatedTokens, 8208);
assert.equal(estimateKvCapacity({ ...kvInputs, inputTokens: 6145 }).maxConcurrent, 15);
assert.equal(estimateKvCapacity({ ...kvInputs, kvBudgetBytes: 0 }).maxConcurrent, 0);
assert.equal(estimateKvCapacity({ ...kvInputs, kvBudgetBytes: 1024 ** 3 - 1 }).maxConcurrent, 0);
assert.equal(estimateKvCapacity({ ...kvInputs, inputTokens: 1, maxNewTokens: 0 }).allocatedTokens, 16);
assert.equal(estimateKvCapacity({ ...kvInputs, kvHeads: 1 }).bytesPerRequest, kvEstimate.bytesPerRequest / 8);
for (const [field, value] of [
  ['layers', 0], ['kvHeads', -1], ['headDim', NaN], ['bytesPerElement', 0.5],
  ['inputTokens', 0], ['maxNewTokens', -1], ['blockTokens', 0], ['kvBudgetBytes', Infinity],
  ['inputTokens', Number.MAX_SAFE_INTEGER], ['layers', Number.MAX_SAFE_INTEGER],
]) {
  assert.throws(() => estimateKvCapacity({ ...kvInputs, [field]: value }), RangeError);
}
for (const inputTokens of [1, 15, 16, 17, 1000, 8192]) {
  const result = estimateKvCapacity({ ...kvInputs, inputTokens, maxNewTokens: 0 });
  assert.ok(result.allocatedTokens >= inputTokens);
  assert.ok(result.allocatedTokens - inputTokens < kvInputs.blockTokens);
  assert.ok(result.maxConcurrent * result.bytesPerRequest <= kvInputs.kvBudgetBytes);
  assert.ok((result.maxConcurrent + 1) * result.bytesPerRequest > kvInputs.kvBudgetBytes);
}

console.log(`PASS: ${extracted} JavaScript examples from ${cache.size} AI documents; evaluation, retrieval, retry, recovery, UI, API migration and KV capacity checks. No model calls.`);