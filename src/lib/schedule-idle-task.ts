/** Run work when the browser is idle; falls back to timeout where rIC is missing (older WebViews). */
export function scheduleIdleTask(fn: () => void, timeoutMs = 2500): () => void {
  if (typeof window === "undefined") return () => {};
  const requestIdle = window.requestIdleCallback;
  if (requestIdle) {
    const id = requestIdle.call(window, fn, { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(fn, Math.min(timeoutMs, 800));
  return () => clearTimeout(id);
}
