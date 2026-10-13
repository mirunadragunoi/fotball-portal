/**
 * Content-coverage core for 604 consumption (varianta b) — football.
 *
 * Measures DISTINCT whole seconds of content actually rendered (a Set of
 * Math.floor(currentTime)), NOT wall-clock time in "play". Robust to seek (only
 * landed seconds count), pause (no growth), re-watch (dedupe).
 *
 * Emission is DELTA, never cumulative: each 604 carries Set.size - lastEmitted,
 * so the dashboard's sum(duration_seconds) equals total distinct content seconds.
 * A single emit path (emitDelta) shared by the 60 s tick AND the final flush,
 * with one lastEmitted, makes double-counting impossible.
 *
 * ESM (package.json "type":"module"): Node runs the unit test directly and Vite
 * imports it from the component.
 */

export function createCoverageTracker(emit) {
  let covered = new Set();
  let lastEmitted = 0;
  return {
    markSecond(t) {
      if (typeof t === 'number' && isFinite(t) && t >= 0) covered.add(Math.floor(t));
    },
    coverageSeconds() { return covered.size; },
    emitDelta() {
      const delta = covered.size - lastEmitted;
      if (delta >= 1) {
        lastEmitted = covered.size;
        if (typeof emit === 'function') emit(delta);
        return delta;
      }
      return 0;
    },
    reset() { covered = new Set(); lastEmitted = 0; },
  };
}

export function createPeriodicEmitter(tick, opts = {}) {
  const intervalMs = opts.intervalMs || 60000;
  const setIntervalFn = opts.setIntervalFn
    || (typeof setInterval !== 'undefined' ? setInterval : null);
  const clearIntervalFn = opts.clearIntervalFn
    || (typeof clearInterval !== 'undefined' ? clearInterval : null);
  let handle = null;
  return {
    start() {
      if (handle == null && setIntervalFn) handle = setIntervalFn(() => { tick(); }, intervalMs);
    },
    stop() {
      if (handle != null && clearIntervalFn) { clearIntervalFn(handle); handle = null; }
    },
  };
}
