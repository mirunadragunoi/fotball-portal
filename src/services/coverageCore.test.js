/* eslint-disable */
// Node-runnable unit test (no vitest here): `node src/services/coverageCore.test.js`.
// ESM (package.json "type":"module"); Vite imports the same module in the component.
//
// Val 4 (investigatie 604/602) — dovada mecanismului de coverage (varianta b) pt. football:
// coverage = secunde DISTINCTE de continut (seek-safe, rewatch nu adauga), emitere DELTA.

import assert from 'node:assert';
import { createCoverageTracker, createPeriodicEmitter } from './coverageCore.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log('  ok  -', name); }
  catch (e) { console.error('  FAIL-', name, '\n     ', e.message); process.exitCode = 1; }
}

test('vizionare continua 10 min -> ~10 min coverage, nu wall-clock', () => {
  const t = createCoverageTracker();
  for (let s = 0; s <= 600; s += 1) t.markSecond(s + 0.25);
  assert.strictEqual(t.coverageSeconds(), 601);
});

test('seek la final -> doar secundele distincte atinse', () => {
  const t = createCoverageTracker();
  for (let s = 0; s <= 3; s += 1) t.markSecond(s);
  for (let s = 596; s <= 600; s += 1) t.markSecond(s);
  assert.strictEqual(t.coverageSeconds(), 9);
});

test('re-vizionare acelasi pasaj nu adauga', () => {
  const t = createCoverageTracker();
  for (let s = 10; s <= 20; s += 1) t.markSecond(s);
  for (let s = 10; s <= 20; s += 1) t.markSecond(s);
  assert.strictEqual(t.coverageSeconds(), 11);
});

test('ignora valori invalide', () => {
  const t = createCoverageTracker();
  t.markSecond(NaN); t.markSecond(-1); t.markSecond(undefined); t.markSecond(Infinity);
  assert.strictEqual(t.coverageSeconds(), 0);
});

test('emitDelta: DELTA, nu cumulativ; sum(delta) == coverage finala', () => {
  const emitted = [];
  const t = createCoverageTracker((d) => emitted.push(d));
  for (let s = 0; s < 60; s += 1) t.markSecond(s);
  assert.strictEqual(t.emitDelta(), 60);
  for (let s = 60; s < 95; s += 1) t.markSecond(s);
  assert.strictEqual(t.emitDelta(), 35);
  assert.strictEqual(t.emitDelta(), 0);
  assert.strictEqual(emitted.reduce((a, b) => a + b, 0), t.coverageSeconds());
});

test('periodic emitter: scheduler injectabil', () => {
  let cb = null; let cleared = false; let n = 0;
  const p = createPeriodicEmitter(() => { n += 1; },
    { intervalMs: 60000, setIntervalFn: (fn) => { cb = fn; return 9; },
      clearIntervalFn: (h) => { cleared = (h === 9); } });
  p.start(); cb(); cb(); assert.strictEqual(n, 2); p.stop(); assert.ok(cleared);
});

console.log(passed + ' coverageCore tests passed');
