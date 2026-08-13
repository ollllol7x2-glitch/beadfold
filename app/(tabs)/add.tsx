import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Icon, PageHeader, Screen, Text, type SymbolName } from '@/components/ui';
import { colors, radius, spacing } from '@/design-system/tokens';

const actions: { title: string; body: string; icon: SymbolName; color: string; route: '/add-bean' | '/(tabs)/collection' | '/record-cafe' }[] = [
  { title: '새 원두 추가', body: '이름과 남은 양만으로 빠르게 저장해요', icon: 'leaf.fill', color: colors.warmBeige, route: '/add-bean' },
  { title: '홈 브루 시작', body: '보관함에서 원두를 고르고 바로 내려요', icon: 'waterbottle.fill', color: colors.oat, route: '/(tabs)/collection' },
  { title: '마신 커피 기록', body: '카페나 밖에서 마신 한 잔을 남겨요', icon: 'cup.and.saucer.fill', color: colors.creamDeep, route: '/record-cafe' },
];

export default function AddMenuScreen() {
  return <Screen contentContainerStyle={styles.screen}>
    <PageHeader title="무엇을 할까요?" description="지금 하려는 일을 골라주세요." />
    <View style={styles.list}>{actions.map((action) => <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={`${action.title}. ${action.body}`} onPress={() => router.push(action.route)} style={({ pressed }) => [styles.action, { backgroundColor: action.color }, pressed && styles.pressed]}>
      <View style={styles.icon}><Icon name={action.icon} size={32} color={colors.espresso} /></View><View style={styles.copy}><Text variant="title2">{action.title}</Text><Text color={colors.neutral800}>{action.body}</Text></View><Icon name="chevron.right" size={21} color={colors.espresso} />
    </Pressable>)}</View>
  </Screen>;
}
const styles = StyleSheet.create({ screen: { gap: spacing.section }, list: { gap: spacing.small }, action: { minHeight: 116, flexDirection: 'row', alignItems: 'center', gap: spacing.default, borderRadius: radius.xl, padding: spacing.default }, icon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 4 }, pressed: { opacity: 0.65 } });
