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

console.log(`PASS: ${extracted} JavaScript examples from ${cache.size} AI documents; pass metrics, business grading, retrieval and retry policies. No model calls.`);