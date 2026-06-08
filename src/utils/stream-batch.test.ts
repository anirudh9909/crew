import { createStreamBatcher } from '@/utils/stream-batch';

describe('createStreamBatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('flushes each push immediately when intervalMs <= 0', () => {
    const onFlush = jest.fn();
    const batcher = createStreamBatcher(onFlush, 0);

    batcher.push('a');
    batcher.push('b');

    expect(onFlush).toHaveBeenCalledTimes(2);
    expect(onFlush).toHaveBeenNthCalledWith(1, 'a');
    expect(onFlush).toHaveBeenNthCalledWith(2, 'b');
  });

  it('batches pushes within the interval window', () => {
    const onFlush = jest.fn();
    const batcher = createStreamBatcher(onFlush, 100);

    batcher.push('hel');
    batcher.push('lo');

    expect(onFlush).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith('hello');
  });

  it('flushNow emits pending buffer before the timer fires', () => {
    const onFlush = jest.fn();
    const batcher = createStreamBatcher(onFlush, 100);

    batcher.push('wait');
    batcher.flushNow();

    expect(onFlush).toHaveBeenCalledTimes(1);
    expect(onFlush).toHaveBeenCalledWith('wait');

    jest.advanceTimersByTime(100);
    expect(onFlush).toHaveBeenCalledTimes(1);
  });

  it('cancel clears buffer and prevents flush', () => {
    const onFlush = jest.fn();
    const batcher = createStreamBatcher(onFlush, 100);

    batcher.push('drop');
    batcher.cancel();

    jest.advanceTimersByTime(100);
    expect(onFlush).not.toHaveBeenCalled();
  });
});
