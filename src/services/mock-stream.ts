import { STREAM_BATCH_MS } from '@/constants/stream-config';
import type { StreamCallbacks } from '@/services/stream-types';

const RESPONSES = [
  (prompt: string) =>
    `Great question about "${prompt}"! For this trip I'd suggest starting with the highlights on day one, then leaving afternoons open for spontaneous discoveries. The local food scene alone is worth planning around.`,
  (prompt: string) =>
    `I'd love to help you plan around "${prompt}". Based on your bundle, the best value is booking mid-week and adding one curated experience — cooking class or guided hike — rather than packing every day.`,
  (prompt: string) =>
    `For "${prompt}", consider splitting your stay: a few nights in the city core for culture, then moving to a quieter area for the second half. Happy to break down day-by-day if you'd like.`,
];

function pickResponse(prompt: string) {
  const index = prompt.length % RESPONSES.length;
  return RESPONSES[index](prompt);
}

export function streamMockResponse(prompt: string, callbacks: StreamCallbacks): () => void {
  const reply = pickResponse(prompt);
  let index = 0;
  let cancelled = false;
  let rafId: number | null = null;
  let pending = '';
  const unbatched = STREAM_BATCH_MS <= 0;
  const chunkSize = unbatched ? 1 : 8;
  const tickMs = unbatched ? 16 : 50;

  const flush = () => {
    rafId = null;
    if (cancelled || !pending) return;
    callbacks.onToken(pending);
    pending = '';
  };

  const emit = (text: string) => {
    if (unbatched) {
      callbacks.onToken(text);
      return;
    }
    pending += text;
    if (rafId === null) {
      rafId = requestAnimationFrame(flush);
    }
  };

  const intervalId = setInterval(() => {
    if (cancelled) return;

    if (index >= reply.length) {
      clearInterval(intervalId);
      if (!unbatched && pending) flush();
      callbacks.onDone();
      return;
    }

    emit(reply.slice(index, index + chunkSize));
    index += chunkSize;
  }, tickMs);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}
