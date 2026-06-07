export type StreamCallbacks = {
  onToken: (text: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
};

export type StreamChatFn = (prompt: string, callbacks: StreamCallbacks) => () => void;
