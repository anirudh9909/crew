import { streamMockResponse } from '@/services/mock-stream';

describe('streamMockResponse', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('emits non-empty tokens and completes', () => {
    const onToken = jest.fn();
    const onDone = jest.fn();

    streamMockResponse('Bali trip', { onToken, onDone });

    jest.runAllTimers();

    expect(onToken).toHaveBeenCalled();
    onToken.mock.calls.forEach(([token]) => {
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('routes the same prompt length to the same response template', () => {
    const tokensA: string[] = [];
    const tokensB: string[] = [];
    const prompt = 'abc';

    streamMockResponse(prompt, {
      onToken: (t) => tokensA.push(t),
      onDone: () => {},
    });
    jest.runAllTimers();

    streamMockResponse(prompt, {
      onToken: (t) => tokensB.push(t),
      onDone: () => {},
    });
    jest.runAllTimers();

    expect(tokensA.join('')).toBe(tokensB.join(''));
  });

  it('stops emitting after cancel', () => {
    const onToken = jest.fn();
    const onDone = jest.fn();

    const cancel = streamMockResponse('cancel me', { onToken, onDone });
    jest.advanceTimersByTime(50);
    cancel();
    jest.runAllTimers();

    const tokenCountAfterCancel = onToken.mock.calls.length;
    jest.advanceTimersByTime(5000);
    expect(onToken.mock.calls.length).toBe(tokenCountAfterCancel);
    expect(onDone).not.toHaveBeenCalled();
  });
});
