import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetView,
  type BottomSheetFlatListMethods,
  type BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import {
  InteractionManager,
  Platform,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { ChatSheetContext } from '@/components/chat/chat-sheet-context';
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

/** Retries span the sheet open animation so scroll lands after layout. */
const SCROLL_RETRY_MS = [50, 150, 300, 500, 800] as const;
/** Extra retries when sheet settles at half — list height changes after snap. */
const SCROLL_RETRY_HALF_MS = [50, 150, 300, 500, 800, 1200] as const;

const renderFooter = (props: BottomSheetFooterProps) => <ChatSheetFooter {...props} />;

export const AskCrewSheet = forwardRef<AskCrewSheetRef, AskCrewSheetProps>(function AskCrewSheet(
  { onOpenChange },
  ref,
) {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<BottomSheetFlatListMethods>(null);
  const sheetIndexRef = useRef(-1);
  const messagesRef = useRef<ChatMessage[]>([]);
  const isStreamingRef = useRef(false);
  const messageCountRef = useRef(0);
  const scrollRetryTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const { messages, sendMessage, isStreaming } = useChat();
  const isEmpty = messages.length === 0;
  /** Inverted list renders index 0 at the visual bottom — show newest first. */
  const displayMessages = useMemo(() => [...messages].reverse(), [messages]);
  const lastMessage = messages[messages.length - 1];
  const streamAnchorKey = `${lastMessage?.id ?? ''}:${lastMessage?.content ?? ''}:${lastMessage?.status ?? ''}`;
  messagesRef.current = messages;
  isStreamingRef.current = isStreaming;

  const snapPoints = useMemo(() => [SHEET_SNAP_HALF, SHEET_SNAP_FULL], []);

  const clearScrollRetries = useCallback(() => {
    for (const timer of scrollRetryTimersRef.current) {
      clearTimeout(timer);
    }
    scrollRetryTimersRef.current = [];
  }, []);

  /** Reversed + inverted: index 0 is newest — pin it to the bottom of the viewport. */
  const scrollToLatest = useCallback(
    (animated: boolean, withRetries = false, snapIndex?: number) => {
      if (messagesRef.current.length === 0) return;

      const performScroll = () => {
        const list = listRef.current;
        if (!list) return;
        list.scrollToOffset({ offset: 0, animated });
        list.scrollToIndex({ index: 0, animated, viewPosition: 1 });
      };

      performScroll();
      requestAnimationFrame(performScroll);

      const activeIndex = snapIndex ?? sheetIndexRef.current;
      if (!withRetries || activeIndex < 0) return;

      clearScrollRetries();
      const delays = activeIndex === 0 ? SCROLL_RETRY_HALF_MS : SCROLL_RETRY_MS;

      InteractionManager.runAfterInteractions(() => {
        performScroll();
        for (const delay of delays) {
          scrollRetryTimersRef.current.push(setTimeout(performScroll, delay));
        }
      });
    },
    [clearScrollRetries],
  );

  useImperativeHandle(ref, () => ({
    open: () => {
      sheetRef.current?.snapToIndex(0);
      scrollToLatest(false, true);
    },
    close: () => {
      sheetRef.current?.close();
    },
  }));

  useEffect(() => clearScrollRetries, [clearScrollRetries]);

  const handleContentSizeChange = useCallback(() => {
    if (messagesRef.current.length === 0 || sheetIndexRef.current < 0) return;
    if (isStreamingRef.current || sheetIndexRef.current === 0) {
      scrollToLatest(false, sheetIndexRef.current === 0);
    }
  }, [scrollToLatest]);

  const handleScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      scrollToLatest(false, sheetIndexRef.current === 0);
    },
    [scrollToLatest],
  );

  const handleSend = useCallback(
    (text: string) => {
      sendMessage(text);
      scrollToLatest(true, true);
    },
    [scrollToLatest, sendMessage],
  );

  const handleInputFocus = useCallback(() => {
    sheetRef.current?.snapToIndex(1);
  }, []);

  const handleSheetChange = useCallback(
    (index: number) => {
      sheetIndexRef.current = index;
      onOpenChange?.(index >= 0);
      perf.mark('sheet_position', {
        index,
        snap: SHEET_SNAP_LABELS[index] ?? 'unknown',
      });
      if (index === -1) {
        perf.tagScenario('sheet_close');
        clearScrollRetries();
      } else if (index === 0) {
        perf.tagScenario('sheet_half');
      } else if (index === 1) {
        perf.tagScenario('sheet_full');
      }
      if (index >= 0 && messagesRef.current.length > 0) {
        scrollToLatest(false, true);
      }
    },
    [clearScrollRetries, onOpenChange, scrollToLatest],
  );

  const handleSheetAnimate = useCallback(
    (_fromIndex: number, toIndex: number) => {
      if (toIndex >= 0 && messagesRef.current.length > 0) {
        scrollToLatest(false, true, toIndex);
      }
    },
    [scrollToLatest],
  );

  useEffect(() => {
    if (messages.length === messageCountRef.current) return;
    messageCountRef.current = messages.length;
    scrollToLatest(true, true);
  }, [messages.length, scrollToLatest]);

  useEffect(() => {
    if (!isStreaming || messages.length === 0) return;
    scrollToLatest(false);
  }, [streamAnchorKey, isStreaming, messages.length, scrollToLatest]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <ChatBubble message={item} inverted />,
    [],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  /** Inverted: ListHeaderComponent renders at the visual bottom (clearance above input). */
  const renderListBottomSpacer = useCallback(
    () => <View style={styles.listBottomSpacer} />,
    [],
  );

  const handleListLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      if (sheetIndexRef.current >= 0 && messagesRef.current.length > 0) {
        scrollToLatest(false, sheetIndexRef.current === 0);
      }
    },
    [scrollToLatest],
  );

  const chatContextValue = useMemo(
    () => ({ onSend: handleSend, isStreaming, onInputFocus: handleInputFocus }),
    [handleInputFocus, handleSend, isStreaming],
  );

  return (
    <ChatSheetContext.Provider value={chatContextValue}>
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        enableOverDrag={false}
        animateOnMount={false}
        keyboardBehavior="extend"
        keyboardBlurBehavior="none"
        android_keyboardInputMode="adjustResize"
        footerComponent={renderFooter}
        onChange={handleSheetChange}
        onAnimate={handleSheetAnimate}
        backgroundStyle={[styles.sheetBackground, { backgroundColor: theme.background }]}
        handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}>
        {isEmpty ? (
          <BottomSheetView style={[styles.emptyShell, { backgroundColor: theme.background }]}>
            <ChatHeader />
            <View style={styles.emptyBody}>
              <ChatEmpty />
            </View>
          </BottomSheetView>
        ) : (
          <>
            <BottomSheetView style={[styles.headerShell, { backgroundColor: theme.background }]}>
              <ChatHeader />
            </BottomSheetView>
            <BottomSheetFlatList
            ref={listRef}
            style={styles.list}
            inverted
            data={displayMessages}
            extraData={streamAnchorKey}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            ListHeaderComponent={renderListBottomSpacer}
            contentContainerStyle={styles.listContentMessages}
            onLayout={handleListLayout}
            onContentSizeChange={handleContentSizeChange}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
          />
          </>
        )}
      </BottomSheet>
    </ChatSheetContext.Provider>
  );
});

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
  headerShell: {
    zIndex: 2,
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
  list: {
    flex: 1,
  },
  listContentMessages: {
    paddingTop: Spacing.one,
  },
  listBottomSpacer: {
    height: CHAT_LIST_BOTTOM_SPACER,
  },
});
