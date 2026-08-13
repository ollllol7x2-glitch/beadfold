import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from './ui';
import { colors, radius, spacing } from '@/design-system/tokens';

export function ConfirmDialog({ visible, title, body, confirmLabel, destructive, onCancel, onConfirm }: { visible: boolean; title: string; body: string; confirmLabel: string; destructive?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}><Pressable accessibilityLabel="확인창 닫기" style={StyleSheet.absoluteFill} onPress={onCancel} /><View accessibilityViewIsModal style={styles.dialog}><Text variant="title2" accessibilityRole="header">{title}</Text><Text color={colors.neutral800}>{body}</Text><View style={styles.actions}><Button label="취소" variant="secondary" onPress={onCancel} style={styles.button} /><Button label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={styles.button} /></View></View></View>
  </Modal>;
}
const styles = StyleSheet.create({ overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.section, backgroundColor: colors.overlay }, dialog: { width: '100%', maxWidth: 420, gap: spacing.default, padding: spacing.section, borderRadius: radius.xl, backgroundColor: colors.white }, actions: { flexDirection: 'row', gap: spacing.compact }, button: { flex: 1 } });
