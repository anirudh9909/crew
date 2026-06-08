import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SHEET_ANIMATION_MS } from '@/constants/chat-layout';
import { CardRadius } from '@/constants/theme';

const SNAP_HALF_RATIO = 0.5;
const SNAP_FULL_RATIO = 0.9;
const HANDLE_ZONE_HEIGHT = 36;
const CLOSE_DRAG_THRESHOLD = 48;
const CLOSE_FLING_VELOCITY = 650;
const TIMING_CONFIG = {
  duration: SHEET_ANIMATION_MS,
  easing: Easing.out(Easing.cubic),
};

export type CrewSheetSnapIndex = -1 | 0 | 1;

export type CrewSheetRef = {
  open: () => void;
  close: () => void;
  snapToIndex: (index: 0 | 1) => void;
};

type CrewSheetProps = {
  children: ReactNode;
  backgroundColor: string;
  handleColor: string;
  onSnapChange?: (index: CrewSheetSnapIndex) => void;
  onCloseStart?: () => void;
};

function heightForIndex(
  index: CrewSheetSnapIndex,
  panelHeight: number,
  halfVisible: number,
): number {
  'worklet';
  if (index === -1) return 0;
  if (index === 1) return panelHeight;
  return halfVisible;
}

function snapIndexFromHeight(
  height: number,
  panelHeight: number,
  halfVisible: number,
  velocityY: number,
): CrewSheetSnapIndex {
  'worklet';
  if (velocityY > CLOSE_FLING_VELOCITY && height < halfVisible) {
    return -1;
  }
  if (height <= CLOSE_DRAG_THRESHOLD) {
    return -1;
  }
  const mid = (halfVisible + panelHeight) / 2;
  if (height >= mid) {
    return 1;
  }
  return 0;
}

export const CrewSheet = forwardRef<CrewSheetRef, CrewSheetProps>(function CrewSheet(
  { children, backgroundColor, handleColor, onSnapChange, onCloseStart },
  ref,
) {
  const { height: windowHeight } = useWindowDimensions();
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const containerHeight = measuredHeight > 0 ? measuredHeight : windowHeight;
  const panelHeight = containerHeight * SNAP_FULL_RATIO;
  const halfVisible = containerHeight * SNAP_HALF_RATIO;

  const containerHeightSv = useSharedValue(containerHeight);
  const animatedHeight = useSharedValue(0);
  const dragStartHeight = useSharedValue(0);
  const panelHeightSv = useSharedValue(panelHeight);
  const halfVisibleSv = useSharedValue(halfVisible);
  const [blocksTouches, setBlocksTouches] = useState(false);

  useEffect(() => {
    containerHeightSv.value = containerHeight;
    panelHeightSv.value = panelHeight;
    halfVisibleSv.value = halfVisible;
  }, [containerHeight, containerHeightSv, halfVisible, halfVisibleSv, panelHeight, panelHeightSv]);

  const handleLayout = useCallback(
    (height: number) => {
      setMeasuredHeight(height);
      containerHeightSv.value = height;
      panelHeightSv.value = height * SNAP_FULL_RATIO;
      halfVisibleSv.value = height * SNAP_HALF_RATIO;
    },
    [containerHeightSv, halfVisibleSv, panelHeightSv],
  );

  const notifySnapChange = useCallback(
    (index: CrewSheetSnapIndex) => {
      setBlocksTouches(index >= 0);
      onSnapChange?.(index);
    },
    [onSnapChange],
  );

  const notifyCloseStart = useCallback(() => {
    Keyboard.dismiss();
    onCloseStart?.();
  }, [onCloseStart]);

  const animateTo = useCallback(
    (index: CrewSheetSnapIndex) => {
      const full = panelHeightSv.value;
      const half = halfVisibleSv.value;
      const target = heightForIndex(index, full, half);
      if (index >= 0) {
        setBlocksTouches(true);
      }
      if (index === -1) {
        notifyCloseStart();
      }
      animatedHeight.value = withTiming(target, TIMING_CONFIG, (finished) => {
        if (finished) {
          runOnJS(notifySnapChange)(index);
        }
      });
    },
    [animatedHeight, notifyCloseStart, notifySnapChange, halfVisibleSv, panelHeightSv],
  );

  useImperativeHandle(
    ref,
    () => ({
      open: () => animateTo(0),
      close: () => animateTo(-1),
      snapToIndex: (index: 0 | 1) => animateTo(index),
    }),
    [animateTo],
  );

  const handlePan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-8, 8])
        .onStart(() => {
          dragStartHeight.value = animatedHeight.value;
        })
        .onUpdate((event) => {
          const next = dragStartHeight.value - event.translationY;
          animatedHeight.value = Math.max(0, Math.min(panelHeightSv.value, next));
        })
        .onEnd((event) => {
          const index = snapIndexFromHeight(
            animatedHeight.value,
            panelHeightSv.value,
            halfVisibleSv.value,
            event.velocityY,
          );
          runOnJS(animateTo)(index);
        }),
    [animateTo, animatedHeight, dragStartHeight, halfVisibleSv, panelHeightSv],
  );

  const panelStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
  }));

  const backdropStyle = useAnimatedStyle(() => {
    const half = halfVisibleSv.value;
    const opacity = half <= 0 ? 0 : Math.max(0, Math.min(1, animatedHeight.value / half));
    return { opacity };
  });

  const tapStripStyle = useAnimatedStyle(() => ({
    height: Math.max(0, containerHeightSv.value - animatedHeight.value),
  }));

  return (
    <View
      style={styles.overlay}
      pointerEvents={blocksTouches ? 'auto' : 'none'}
      accessibilityViewIsModal={blocksTouches}
      onLayout={(event) => handleLayout(event.nativeEvent.layout.height)}>
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, backdropStyle]}
      />
      <View style={styles.sheetStack} pointerEvents="box-none">
        <Animated.View style={[styles.tapStrip, tapStripStyle]}>
          <Pressable
            style={styles.tapStripPressable}
            onPress={() => animateTo(-1)}
            accessibilityLabel="Close sheet"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.panel,
            { backgroundColor },
            panelStyle,
          ]}>
          <GestureDetector gesture={handlePan}>
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: handleColor }]} />
            </View>
          </GestureDetector>
          <View style={styles.body}>
            {children}
          </View>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetStack: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tapStrip: {
    width: '100%',
  },
  tapStripPressable: {
    flex: 1,
  },
  panel: {
    width: '100%',
    borderTopLeftRadius: CardRadius * 2,
    borderTopRightRadius: CardRadius * 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  handleRow: {
    height: HANDLE_ZONE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
});
