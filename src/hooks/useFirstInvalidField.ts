import { useCallback, useRef } from 'react';
import type { TextInput } from 'react-native';

/** Focus moves the browser viewport to the field as well as opening the keyboard on native. */
export function useFirstInvalidField() {
  const fields = useRef<Record<string, TextInput | null>>({});

  const fieldRef = useCallback((name: string) => (node: TextInput | null) => {
    fields.current[name] = node;
  }, []);

  const focusField = useCallback((name: string) => {
    setTimeout(() => fields.current[name]?.focus(), 0);
  }, []);

  return { fieldRef, focusField };
}
