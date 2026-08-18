import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { ConfirmDialog } from '@/components/confirmDialog';

/**
 * Guards both explicit close controls and navigator-driven exits from a task
 * that contains unsaved input. The browser fallback protects a hard refresh
 * or a closed web tab as well.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const navigation = useNavigation();
  const pendingExit = useRef<(() => void) | null>(null);
  const dirtyRef = useRef(isDirty);
  const [visible, setVisible] = useState(false);

  const requestExit = useCallback((exit: () => void = () => router.back()) => {
    if (!dirtyRef.current) {
      exit();
      return;
    }
    pendingExit.current = exit;
    setVisible(true);
  }, []);

  useEffect(() => { dirtyRef.current = isDirty; }, [isDirty]);

  const dismiss = useCallback(() => {
    pendingExit.current = null;
    setVisible(false);
  }, []);

  const discard = useCallback(() => {
    const exit = pendingExit.current;
    pendingExit.current = null;
    dirtyRef.current = false;
    setVisible(false);
    exit?.();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event: any) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      pendingExit.current = () => navigation.dispatch(event.data.action);
      setVisible(true);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  return {
    requestExit,
    allowExit: () => { dirtyRef.current = false; },
    exitConfirmation: <ConfirmDialog visible={visible} title="작성 중인 내용이 있어요" body="지금 나가면 저장하지 않은 내용은 사라집니다." confirmLabel="나가기" destructive onCancel={dismiss} onConfirm={discard} />,
  };
}
