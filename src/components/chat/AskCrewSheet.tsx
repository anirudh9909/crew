import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetView,
  type BottomSheetFlatListMethods,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type RefObject,
} from 'react';
import {
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
import {
  CHAT_LIST_BOTTOM_SPACER,
  SHEET_SNAP_FULL,
  SHEET_SNAP_HALF,
} from '@/constants/chat-layout';
import { CardRadius, Spacing } from '@/constants/theme';
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

/** Delayed retries after sheet snap — list height settles after animation. */
const SCROLL_RETRY_MS = [400] as const;
const SCROLL_RETRY_HALF_MS = [400, 700] as const;
const SCROLL_PIN_THRESHOLD = 48;

const SNAP_POINTS = [SHEET_SNAP_HALF, SHEET_SNAP_FULL];

const renderFooter = (props: BottomSheetFooterProps) => <ChatSheetFooter {...props} />;
const renderListBottomSpacer = () => <View style={styles.listBottomSpacer} />;

function distanceFromBottom(event: NativeScrollEvent) {
  const { contentOffset, contentSize, layoutMeasurement } = event;
  const maxOffset = Math.max(0, contentSize.height - layoutMeasurement.height);
  return maxOffset - contentOffset.y;
}

type ChatMessageListProps = {
  listRef: RefObject<BottomSheetFlatListMethods | null>;
  messages: ChatMessage[];
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const ChatMessageList = memo(function ChatMessageList({
  listRef,
  messages,
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
    <BottomSheetFlatList
      ref={listRef}
      style={styles.list}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListFooterComponent={renderListBottomSpacer}
      contentContainerStyle={styles.listContentMessages}
      enableFooterMarginAdjustment
      nestedScrollEnabled={Platform.OS === 'android'}
      initialNumToRender={12}
      maxToRenderPerBatch={6}
      windowSize={9}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={Platform.OS === 'android'}
      onScrollEndDrag={onScrollEnd}
      onMomentumScrollBegin={onMomentumScrollBegin}
      onMomentumScrollEnd={onMomentumScrollEnd}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
    />
  );
});

type ChatSheetContentProps = {
  listRef: RefObject<BottomSheetFlatListMethods | null>;
  backgroundColor: string;
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

/** Subscribes to messages — only this subtree re-renders during streaming. */
const ChatSheetContent = memo(function ChatSheetContent({
  listRef,
  backgroundColor,
  onScrollEnd,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
}: ChatSheetContentProps) {
  const messages = useChatSheetMessages();

  if (messages.length === 0) {
    return (
      <BottomSheetView style={[styles.emptyShell, { backgroundColor }]}>
        <ChatHeader />
        <View style={styles.emptyBody}>
          <ChatEmpty />
        </View>
      </BottomSheetView>
    );
  }

  return (
    <View style={styles.messageShell}>
      <View style={[styles.headerShell, { backgroundColor }]}>
        <ChatHeader />
      </View>
      <ChatMessageList
        listRef={listRef}
        messages={messages}
        onScrollEnd={onScrollEnd}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </View>
  );
});

type ChatSheetChromeProps = {
  sheetRef: RefObject<BottomSheet | null>;
  listRef: RefObject<BottomSheetFlatListMethods | null>;
  backgroundColor: string;
  handleColor: string;
  onSheetChange: (index: number) => void;
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

/** Bottom sheet shell — memoized so token streaming does not re-render the sheet. */
const ChatSheetChrome = memo(function ChatSheetChrome({
  sheetRef,
  listRef,
  backgroundColor,
  handleColor,
  onSheetChange,
  onScrollEnd,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
}: ChatSheetChromeProps) {
  const backgroundStyle = useMemo(
    () => [styles.sheetBackground, { backgroundColor }],
    [backgroundColor],
  );
  const handleIndicatorStyle = useMemo(() => ({ backgroundColor: handleColor }), [handleColor]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableOverDrag={false}
      animateOnMount={false}
      keyboardBehavior="extend"
      keyboardBlurBehavior="none"
      android_keyboardInputMode="adjustResize"
      footerComponent={renderFooter}
      onChange={onSheetChange}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}>
      <ChatSheetContent
        listRef={listRef}
        backgroundColor={backgroundColor}
        onScrollEnd={onScrollEnd}
        onMomentumScrollBegin={onMomentumScrollBegin}
        onMomentumScrollEnd={onMomentumScrollEnd}
      />
    </BottomSheet>
  );
});

type ChatSheetControllerProps = {
  onOpenChange?: (isOpen: boolean) => void;
};

/**
 * Owns chat state and scroll logic. Context splits limit re-renders:
 * - messages context → list subtree
 * - streaming context → footer only
 * - actions context → stable callbacks
 */
const ChatSheetController = forwardRef<AskCrewSheetRef, ChatSheetControllerProps>(
  function ChatSheetController({ onOpenChange }, ref) {
    const theme = useTheme();
    const sheetRef = useRef<BottomSheet>(null);
    const listRef = useRef<BottomSheetFlatListMethods>(null);
    const sheetIndexRef = useRef(-1);
    const prevSheetIndexRef = useRef(-1);
    const messagesRef = useRef<ChatMessage[]>([]);
    const isPinnedToBottomRef = useRef(true);
    const isUserScrollingRef = useRef(false);
    const scrollRafRef = useRef<number | null>(null);
    const scrollRetryTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const lastStreamScrollKeyRef = useRef('');

    const { messages, sendMessage, isStreaming } = useChat();
    const lastMessage = messages[messages.length - 1];
    const streamScrollKey = lastMessage
      ? `${lastMessage.id}:${lastMessage.content.length}:${lastMessage.status ?? ''}`
      : '';
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
          scrollRafRef.current = null;
          listRef.current?.scrollToEnd({ animated });
        });
      },
      [cancelScheduledScroll],
    );

    /** Layout-settle retries only — never forces scroll when user is reading history. */
    const scheduleScrollRetries = useCallback(
      (snapIndex: number, { immediate = false, force = false } = {}) => {
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
        sheetRef.current?.snapToIndex(0);
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

    const handleMomentumScrollBegin = useCallback(() => {
      isUserScrollingRef.current = true;
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
      },
      [cancelScheduledScroll, clearScrollRetries, sendMessage],
    );

    const handleInputFocus = useCallback(() => {
      sheetRef.current?.snapToIndex(1);
    }, []);

    const handleSheetChange = useCallback(
      (index: number) => {
        const prevIndex = prevSheetIndexRef.current;
        prevSheetIndexRef.current = index;
        sheetIndexRef.current = index;
        onOpenChange?.(index >= 0);
        perf.mark('sheet_position', {
          index,
          snap: SHEET_SNAP_LABELS[index] ?? 'unknown',
        });
        if (index === -1) {
          perf.tagScenario('sheet_close');
          clearScrollRetries();
          cancelScheduledScroll();
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
      [cancelScheduledScroll, clearScrollRetries, onOpenChange, scheduleScrollRetries],
    );

    useEffect(() => {
      if (!isStreaming) {
        lastStreamScrollKeyRef.current = '';
        return;
      }
      if (!streamScrollKey || streamScrollKey === lastStreamScrollKeyRef.current) {
        return;
      }
      lastStreamScrollKeyRef.current = streamScrollKey;
      clearScrollRetries();
      scheduleScrollToBottom(false);
    }, [clearScrollRetries, isStreaming, scheduleScrollToBottom, streamScrollKey]);

    const actionsValue = useMemo(
      () => ({ onSend: handleSend, onInputFocus: handleInputFocus }),
      [handleInputFocus, handleSend],
    );

    return (
      <ChatSheetActionsContext.Provider value={actionsValue}>
        <ChatSheetStreamingContext.Provider value={isStreaming}>
          <ChatSheetMessagesContext.Provider value={messages}>
            <ChatSheetChrome
              sheetRef={sheetRef}
              listRef={listRef}
              backgroundColor={theme.background}
              handleColor={theme.sheetHandle}
              onSheetChange={handleSheetChange}
              onScrollEnd={handleScrollEnd}
              onMomentumScrollBegin={handleMomentumScrollBegin}
              onMomentumScrollEnd={handleScrollEnd}
            />
          </ChatSheetMessagesContext.Provider>
        </ChatSheetStreamingContext.Provider>
      </ChatSheetActionsContext.Provider>
    );
  },
);

export const AskCrewSheet = ChatSheetController;

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: CardRadius * 2,
    borderTopRightRadius: CardRadius * 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.14,
        shadowRadius: 14,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  emptyShell: {
    flex: 1,
  },
  emptyBody: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: CHAT_LIST_BOTTOM_SPACER,
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
