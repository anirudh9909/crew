/** Batches rapid stream tokens into fewer React updates to reduce sheet jank. */
export function createStreamBatcher(onFlush: (text: string) => void, intervalMs = 100) {
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    if (!buffer) return;
    const chunk = buffer;
    buffer = '';
    onFlush(chunk);
  };

  return {
    push(chunk: string) {
      if (intervalMs <= 0) {
        onFlush(chunk);
        return;
      }
      buffer += chunk;
      if (timer === null) {
        timer = setTimeout(flush, intervalMs);
      }
    },
    flushNow() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      flush();
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      buffer = '';
    },
  };
}
