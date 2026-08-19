import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius, shadows, spacing } from '@/design-system/tokens';
import { Icon, Text } from './ui';

type FeedbackInput = {
  message: string;
  actionLabel?: string;
  onAction?: () => void | Promise<void>;
};

type FeedbackContextValue = {
  showFeedback: (input: string | FeedbackInput) => void;
  dismissFeedback: () => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackInput | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissFeedback = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setFeedback(null);
  }, []);

  const showFeedback = useCallback((input: string | FeedbackInput) => {
    if (timer.current) clearTimeout(timer.current);
    const next = typeof input === 'string' ? { message: input } : input;
    setFeedback(next);
    timer.current = setTimeout(() => setFeedback(null), next.actionLabel ? 9000 : 5500);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ showFeedback, dismissFeedback }), [dismissFeedback, showFeedback]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {feedback ? (
        <View pointerEvents="box-none" style={styles.layer}>
          <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.notice}>
            <Icon name="checkmark.circle.fill" size={21} color={colors.cream} weight="bold" />
            <Text variant="label" color={colors.cream} style={styles.message}>{feedback.message}</Text>
            {feedback.actionLabel && feedback.onAction ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={feedback.actionLabel}
                onPress={() => {
                  const action = feedback.onAction;
                  dismissFeedback();
                  void action?.();
                }}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <Text variant="label" color={colors.cream}>{feedback.actionLabel}</Text>
              </Pressable>
            ) : null}
            <Pressable accessibilityRole="button" accessibilityLabel="알림 닫기" onPress={dismissFeedback} style={styles.close}>
              <Icon name="xmark" size={18} color={colors.cream} weight="bold" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const value = useContext(FeedbackContext);
  if (!value) throw new Error('useFeedback must be used inside FeedbackProvider');
  return value;
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, right: 0, bottom: 92, alignItems: 'center', paddingHorizontal: spacing.default, zIndex: 20 },
  notice: { width: '100%', maxWidth: 480, minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.compact, paddingHorizontal: spacing.small, paddingVertical: 10, borderRadius: radius.medium, backgroundColor: colors.espresso, ...shadows.lifted },
  message: { flex: 1 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: spacing.compact, borderBottomWidth: 1, borderBottomColor: colors.cream },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.62 },
});
