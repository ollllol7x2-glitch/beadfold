import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CupSummary } from '@/components/data';
import { Button, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { listBeans, listCups, trackEvent } from '@/database/repository';
import type { BeanLot, Cup } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

type KindFilter = 'all' | Cup['kind'];

export default function JournalScreen() {
  const db = useSQLiteContext();
  const [cups, setCups] = useState<Cup[]>([]);
  const [beans, setBeans] = useState<BeanLot[]>([]);
  const [kind, setKind] = useState<KindFilter>('all');
  const [beanId, setBeanId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    void trackEvent(db, 'journal_viewed');
    Promise.all([listCups(db), listBeans(db, true)]).then(([nextCups, nextBeans]) => { if (active) { setCups(nextCups); setBeans(nextBeans); } });
    return () => { active = false; };
  }, [db]));

  const filtered = cups.filter((cup) => (kind === 'all' || cup.kind === kind) && (!beanId || cup.beanId === beanId));
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const compareAvailable = beanId ? filtered.filter((cup) => cup.kind === 'home').length >= 2 : cups.some((cup, index) => cup.beanId && cups.findIndex((other) => other.beanId === cup.beanId) !== index);

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}><View><Text variant="title1" accessibilityRole="header">기록</Text><Text color={colors.neutral800}>{cups.length ? `${cups.length}잔의 커피가 쌓였어요.` : '마신 커피를 차곡차곡 모아보세요.'}</Text></View><Button label="비교" variant="secondary" icon="arrow.left.arrow.right" disabled={!compareAvailable} onPress={() => router.push(beanId ? `/compare?beanId=${beanId}` : '/compare')} /></View>
      <View style={styles.filters}><Filter label="전체" selected={kind === 'all'} onPress={() => setKind('all')} /><Filter label="집에서" selected={kind === 'home'} onPress={() => setKind('home')} /><Filter label="카페" selected={kind === 'cafe'} onPress={() => setKind('cafe')} /></View>
      {beans.some((bean) => cups.some((cup) => cup.beanId === bean.id)) ? <Pressable accessibilityRole="button" accessibilityLabel={`원두 필터, ${beanId ? beans.find((bean) => bean.id === beanId)?.name : '모든 원두'}. 누르면 다음 원두로 변경`} onPress={() => { const choices = beans.filter((bean) => cups.some((cup) => cup.beanId === bean.id)); const current = choices.findIndex((bean) => bean.id === beanId); setBeanId(current < 0 ? choices[0]?.id ?? null : choices[current + 1]?.id ?? null); }} style={styles.beanFilter}><Icon name="leaf.fill" size={16} color={colors.espresso} /><Text variant="label" style={styles.flex}>{beanId ? beans.find((bean) => bean.id === beanId)?.name : '모든 원두'}</Text><Icon name="chevron.down" size={15} color={colors.neutral600} /></Pressable> : null}
      {filtered.length ? grouped.map((group) => <View key={group.title} style={styles.group}><View style={styles.date}><Text variant="title3">{group.title}</Text><View style={styles.dateLine} /></View>{group.items.map((cup) => <Pressable key={cup.id} accessibilityRole="button" accessibilityLabel={`${cup.beanName} 기록 보기`} onPress={() => router.push(`/cup/${cup.id}`)}><CupSummary cup={cup} /></Pressable>)}</View>) : <EmptyState title="조건에 맞는 기록이 없어요" body="필터를 바꾸거나 오늘의 커피를 한 잔 내려보세요." icon="book.closed.fill" action={<Button label="커피 기록하기" onPress={() => router.push('/(tabs)/add')} />} />}
    </Screen>
  );
}

function Filter({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={[styles.filter, selected && styles.filterSelected]}><Text variant="label" color={selected ? colors.cream : colors.neutral800}>{label}</Text></Pressable>; }
function groupByDate(cups: Cup[]) { const groups = new Map<string, Cup[]>(); cups.forEach((cup) => { const date = new Date(cup.createdAt); const key = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }); groups.set(key, [...(groups.get(key) ?? []), cup]); }); return [...groups].map(([title, items]) => ({ title, items })); }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, flex: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.small }, filters: { flexDirection: 'row', padding: 4, backgroundColor: colors.creamDeep, borderRadius: radius.medium }, filter: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small }, filterSelected: { backgroundColor: colors.espresso }, beanFilter: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.compact, paddingHorizontal: spacing.small, borderRadius: radius.medium, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 }, group: { gap: spacing.small }, date: { flexDirection: 'row', alignItems: 'center', gap: spacing.small }, dateLine: { height: StyleSheet.hairlineWidth, flex: 1, backgroundColor: colors.neutral200 } });
