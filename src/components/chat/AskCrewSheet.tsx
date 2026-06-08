import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import {
  ChatSheetActionsContext,
  ChatSheetMessagesContext,
  ChatSheetStreamingContext,
  useChatSheetMessages,
} from '@/components/chat/chat-sheet-context';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatEmpty } from '@/components/chat/ChatEmpty';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatSheetFooter } from '@/components/chat/ChatSheetFooter';
import { CrewSheet, type CrewSheetRef, type CrewSheetSnapIndex } from '@/components/chat/CrewSheet';
import {
  CHAT_LIST_BOTTOM_SPACER,
  CHAT_STREAM_SCROLL_ANIMATED,
} from '@/constants/chat-layout';
import { Spacing } from '@/constants/theme';
import { useChat, type ChatMessage } from '@/hooks/use-chat';
import { useTheme } from '@/hooks/use-theme';
import { perf, SHEET_SNAP_LABELS } from '@/utils/perf';

export type AskCrewSheetRef = {
  open: () => void;
  close: () => void;
};

type AskCrewSheetProps = {
  onOpenChange?: (isOpen: boolean) => void;
};

const SCROLL_RETRY_MS = [400] as const;
const SCROLL_RETRY_HALF_MS = [400, 700] as const;
const SCROLL_PIN_THRESHOLD = 48;

const renderListBottomSpacer = () => <View style={styles.listBottomSpacer} />;

function distanceFromBottom(event: NativeScrollEvent) {
  const { contentOffset, contentSize, layoutMeasurement } = event;
  const maxOffset = Math.max(0, contentSize.height - layoutMeasurement.height);
  return maxOffset - contentOffset.y;
}

type MessageFlatList = FlatList<ChatMessage>;

type ChatMessageListProps = {
  listRef: RefObject<MessageFlatList | null>;
  messages: ChatMessage[];
  onContentSizeChange: () => void;
  onScrollBeginDrag: () => void;
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ChatMessageList = memo(function ChatMessageList({
  listRef,
  messages,
  onContentSizeChange,
  onScrollBeginDrag,
  onScrollEnd,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
}: ChatMessageListProps) {
  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} />,
    [],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  return (
    <FlatList
      // @ts-expect-error React 19 passes ref as a prop; RN types omit it.
      ref={listRef}
      style={styles.list}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListFooterComponent={renderListBottomSpacer}
      contentContainerStyle={styles.listContentMessages}
      initialNumToRender={8}
      maxToRenderPerBatch={6}
      windowSize={7}
      updateCellsBatchingPeriod={16}
      removeClippedSubviews={false}
      onContentSizeChange={onContentSizeChange}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onMomentumScrollEnd={onMomentumScrollEnd}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
    />
  );
});

type ChatSheetBodyProps = {
  listRef: RefObject<MessageFlatList | null>;
  backgroundColor: string;
  onContentSizeChange: () => void;
  onScrollBeginDrag: () => void;
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ChatSheetBody = memo(function ChatSheetBody({
  listRef,
  backgroundColor,
  onContentSizeChange,
  onScrollBeginDrag,
  onScrollEnd,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
}: ChatSheetBodyProps) {
  const messages = useChatSheetMessages();

  return (
    <View style={styles.bodyRoot}>
      <View style={styles.contentRegion}>
        {messages.length === 0 ? (
          <View style={[styles.emptyShell, { backgroundColor }]}>
            <ChatHeader />
            <View style={styles.emptyBody}>
              <ChatEmpty />
            </View>
          </View>
        ) : (
          <View style={styles.messageShell}>
            <View style={[styles.headerShell, { backgroundColor }]}>
              <ChatHeader />
            </View>
            <ChatMessageList
              listRef={listRef}
              messages={messages}
              onContentSizeChange={onContentSizeChange}
              onScrollBeginDrag={onScrollBeginDrag}
              onScrollEnd={onScrollEnd}
              onMomentumScrollBegin={onMomentumScrollBegin}
              onMomentumScrollEnd={onMomentumScrollEnd}
            />
          </View>
        )}
      </View>
      <View style={styles.footerShell}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}>
          <ChatSheetFooter />
        </KeyboardAvoidingView>
      </View>
    </View>
  );
});

const ChatSheetController = forwardRef<AskCrewSheetRef, AskCrewSheetProps>(
  function ChatSheetController({ onOpenChange }, ref) {
    const theme = useTheme();
    const sheetRef = useRef<CrewSheetRef>(null);
    const listRef = useRef<MessageFlatList>(null);
    const sheetIndexRef = useRef<CrewSheetSnapIndex>(-1);
    const prevSheetIndexRef = useRef<CrewSheetSnapIndex>(-1);
    const messagesRef = useRef<ChatMessage[]>([]);
    const isPinnedToBottomRef = useRef(true);
    const isUserScrollingRef = useRef(false);
    const scrollRafRef = useRef<number | null>(null);
    const scrollRetryTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const isStreamingRef = useRef(false);
    const [sheetUiMounted, setSheetUiMounted] = useState(false);

    const { messages, sendMessage, isStreaming, cancelStream } = useChat();
    isStreamingRef.current = isStreaming;
    messagesRef.current = messages;

    const clearScrollRetries = useCallback(() => {
      for (const timer of scrollRetryTimersRef.current) {
        clearTimeout(timer);
      }
      scrollRetryTimersRef.current = [];
    }, []);

    const cancelScheduledScroll = useCallback(() => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    }, []);

    const scheduleScrollToBottom = useCallback(
      (animated: boolean, force = false) => {
        if (messagesRef.current.length === 0) return;
        if (isUserScrollingRef.current) return;
        if (!force && !isPinnedToBottomRef.current) return;

        cancelScheduledScroll();
        scrollRafRef.current = requestAnimationFrame(() => {
          scrollRafRef.current = requestAnimationFrame(() => {
            scrollRafRef.current = null;
            listRef.current?.scrollToEnd({ animated });
          });
        });
      },
      [cancelScheduledScroll],
    );

    const handleContentSizeChange = useCallback(() => {
      if (messagesRef.current.length === 0) return;
      if (isUserScrollingRef.current) return;
      if (!isPinnedToBottomRef.current) return;

      const animated = isStreamingRef.current && CHAT_STREAM_SCROLL_ANIMATED;
      scheduleScrollToBottom(animated);
    }, [scheduleScrollToBottom]);

    const scheduleScrollRetries = useCallback(
      (snapIndex: CrewSheetSnapIndex, { immediate = false, force = false } = {}) => {
        clearScrollRetries();
        if (immediate) {
          scheduleScrollToBottom(false, force);
        }
        const delays = snapIndex === 0 ? SCROLL_RETRY_HALF_MS : SCROLL_RETRY_MS;
        for (const delay of delays) {
          scrollRetryTimersRef.current.push(
            setTimeout(() => scheduleScrollToBottom(false, false), delay),
          );
        }
      },
      [clearScrollRetries, scheduleScrollToBottom],
    );

    useImperativeHandle(ref, () => ({
      open: () => {
        isPinnedToBottomRef.current = true;
        isUserScrollingRef.current = false;
        clearScrollRetries();
        setSheetUiMounted(true);
        onOpenChange?.(true);
        sheetRef.current?.open();
      },
      close: () => {
        sheetRef.current?.close();
      },
    }));

    useEffect(() => {
      return () => {
        clearScrollRetries();
        cancelScheduledScroll();
      };
    }, [cancelScheduledScroll, clearScrollRetries]);

    const updatePinnedFromOffset = useCallback((event: NativeScrollEvent) => {
      isPinnedToBottomRef.current = distanceFromBottom(event) <= SCROLL_PIN_THRESHOLD;
    }, []);

    const handleScrollBeginDrag = useCallback(() => {
      isUserScrollingRef.current = true;
      perf.tagScenario('chat_scroll');
    }, []);

    const handleMomentumScrollBegin = useCallback(() => {
      isUserScrollingRef.current = true;
      perf.tagScenario('chat_scroll');
    }, []);

    const handleScrollEnd = useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        isUserScrollingRef.current = false;
        updatePinnedFromOffset(event.nativeEvent);
      },
      [updatePinnedFromOffset],
    );

    const handleSend = useCallback(
      (text: string) => {
        clearScrollRetries();
        cancelScheduledScroll();
        isPinnedToBottomRef.current = true;
        isUserScrollingRef.current = false;
        sendMessage(text);
        scheduleScrollToBottom(true, true);
      },
      [cancelScheduledScroll, clearScrollRetries, scheduleScrollToBottom, sendMessage],
    );

    const stopSheetWork = useCallback(() => {
      cancelStream();
      Keyboard.dismiss();
      clearScrollRetries();
      cancelScheduledScroll();
    }, [cancelScheduledScroll, cancelStream, clearScrollRetries]);

    const handleSnapChange = useCallback(
      (index: CrewSheetSnapIndex) => {
        const prevIndex = prevSheetIndexRef.current;
        prevSheetIndexRef.current = index;
        sheetIndexRef.current = index;
        setSheetUiMounted(index >= 0);
        onOpenChange?.(index >= 0);
        perf.mark('sheet_position', {
          index,
          snap: SHEET_SNAP_LABELS[index] ?? 'unknown',
        });
        if (index === -1) {
          perf.tagScenario('sheet_close');
        } else if (index === 0) {
          perf.tagScenario('sheet_half');
        } else if (index === 1) {
          perf.tagScenario('sheet_full');
        }

        if (index < 0 || messagesRef.current.length === 0) return;

        const openedFromClosed = prevIndex === -1;
        if (openedFromClosed) {
          isPinnedToBottomRef.current = true;
          isUserScrollingRef.current = false;
          scheduleScrollRetries(index, { immediate: true, force: true });
          return;
        }

        if (isPinnedToBottomRef.current && !isUserScrollingRef.current) {
          scheduleScrollRetries(index);
        }
      },
      [onOpenChange, scheduleScrollRetries],
    );

    const actionsValue = useMemo(
      () => ({ onSend: handleSend }),
      [handleSend],
    );

    return (
      <ChatSheetActionsContext.Provider value={actionsValue}>
        <ChatSheetStreamingContext.Provider value={isStreaming}>
          <ChatSheetMessagesContext.Provider value={messages}>
            <CrewSheet
              ref={sheetRef}
              backgroundColor={theme.background}
              handleColor={theme.sheetHandle}
              onSnapChange={handleSnapChange}
              onCloseStart={stopSheetWork}>
              {sheetUiMounted ? (
                <ChatSheetBody
                  listRef={listRef}
                  backgroundColor={theme.background}
                  onContentSizeChange={handleContentSizeChange}
                  onScrollBeginDrag={handleScrollBeginDrag}
                  onScrollEnd={handleScrollEnd}
                  onMomentumScrollBegin={handleMomentumScrollBegin}
                  onMomentumScrollEnd={handleScrollEnd}
                />
              ) : null}
            </CrewSheet>
          </ChatSheetMessagesContext.Provider>
        </ChatSheetStreamingContext.Provider>
      </ChatSheetActionsContext.Provider>
    );
  },
);

export const AskCrewSheet = ChatSheetController;

const styles = StyleSheet.create({
  bodyRoot: {
    flex: 1,
    minHeight: 0,
  },
  contentRegion: {
    flex: 1,
    flexShrink: 1,
    minHeight: 0,
  },
  footerShell: {
    flexShrink: 0,
  },
  emptyShell: {
    flex: 1,
    minHeight: 0,
  },
  emptyBody: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  messageShell: {
    flex: 1,
    minHeight: 0,
  },
  headerShell: {
    zIndex: 2,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContentMessages: {
    paddingTop: Spacing.one,
  },
  listBottomSpacer: {
    height: CHAT_LIST_BOTTOM_SPACER,
  },
});
