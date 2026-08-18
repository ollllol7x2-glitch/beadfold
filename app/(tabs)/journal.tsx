import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CupSummary } from '@/components/data';
import { BottomActionBar, Button, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { listBeans, listCups, trackEvent } from '@/database/repository';
import type { BeanLot, Cup } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

type KindFilter = 'all' | Cup['kind'];

export default function JournalScreen() {
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();
  const db = useSQLiteContext();
  const [cups, setCups] = useState<Cup[]>([]);
  const [beans, setBeans] = useState<BeanLot[]>([]);
  const [kind, setKind] = useState<KindFilter>('all');
  const [beanId, setBeanId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCupIds, setSelectedCupIds] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    void refresh;
    let active = true;
    void trackEvent(db, 'journal_viewed');
    Promise.all([listCups(db), listBeans(db, true)]).then(([nextCups, nextBeans]) => { if (active) { setCups(nextCups); setBeans(nextBeans); } });
    return () => { active = false; };
  }, [db, refresh]));

  const filtered = cups.filter((cup) => (kind === 'all' || cup.kind === kind) && (!beanId || cup.beanId === beanId));
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const compareAvailable = Object.values(cups.filter((cup) => cup.kind === 'home' && cup.beanId).reduce<Record<string, number>>((counts, cup) => ({ ...counts, [cup.beanId!]: (counts[cup.beanId!] ?? 0) + 1 }), {})).some((count) => count >= 2);
  const toggleCup = (cup: Cup) => {
    if (cup.kind !== 'home' || !cup.beanId) return;
    setSelectedCupIds((current) => {
      if (current.includes(cup.id)) return current.filter((id) => id !== cup.id);
      const first = cups.find((item) => item.id === current[0]);
      if (first?.beanId && first.beanId !== cup.beanId) return current;
      return current.length < 2 ? [...current, cup.id] : current;
    });
  };
  const startCompare = () => { setCompareMode(true); setSelectedCupIds([]); };
  const cancelCompare = () => { setCompareMode(false); setSelectedCupIds([]); };

  return (
    <Screen header={<View style={styles.header}><Text variant="title1" accessibilityRole="header">{compareMode ? '기록 비교' : '기록'}</Text>{compareMode ? <Button label="선택 취소" variant="tertiary" onPress={cancelCompare} /> : compareAvailable ? <Button label="비교할 기록 고르기" variant="tertiary" onPress={startCompare} /> : null}</View>} contentContainerStyle={styles.screen} footer={compareMode ? <BottomActionBar primaryLabel={selectedCupIds.length === 2 ? '선택한 2잔 비교하기' : `2잔 중 ${selectedCupIds.length}잔 선택`} primaryDisabled={selectedCupIds.length !== 2} onPrimaryPress={() => router.push(`/compare?cupIds=${selectedCupIds.join(',')}`)} /> : undefined}>
      <Text variant="bodyLarge" color={colors.neutral800}>{compareMode ? '같은 원두로 내린 집 브루 2잔을 골라주세요.' : cups.length ? `${cups.length}잔의 커피가 쌓였어요.` : '마신 커피를 차곡차곡 모아보세요.'}</Text>
      <View style={styles.filters}><Filter label="전체" selected={kind === 'all'} onPress={() => setKind('all')} /><Filter label="집에서" selected={kind === 'home'} onPress={() => setKind('home')} /><Filter label="카페" selected={kind === 'cafe'} onPress={() => setKind('cafe')} /></View>
      {beans.some((bean) => cups.some((cup) => cup.beanId === bean.id)) ? <Pressable accessibilityRole="button" accessibilityLabel={`원두 필터, ${beanId ? beans.find((bean) => bean.id === beanId)?.name : '모든 원두'}. 누르면 다음 원두로 변경`} onPress={() => { const choices = beans.filter((bean) => cups.some((cup) => cup.beanId === bean.id)); const current = choices.findIndex((bean) => bean.id === beanId); setBeanId(current < 0 ? choices[0]?.id ?? null : choices[current + 1]?.id ?? null); }} style={styles.beanFilter}><Icon name="leaf.fill" size={16} color={colors.espresso} /><Text variant="label" style={styles.flex}>{beanId ? beans.find((bean) => bean.id === beanId)?.name : '모든 원두'}</Text><Icon name="chevron.down" size={15} color={colors.neutral600} /></Pressable> : null}
      {filtered.length ? grouped.map((group) => <View key={group.title} style={styles.group}><View style={styles.date}><Text variant="title3">{group.title}</Text><View style={styles.dateLine} /></View>{group.items.map((cup) => <Pressable key={cup.id} accessibilityRole="button" accessibilityLabel={compareMode ? `${cup.beanName} 기록 ${selectedCupIds.includes(cup.id) ? '선택 해제' : '선택'}${cup.kind !== 'home' || !cup.beanId ? '. 카페 기록은 비교할 수 없어요.' : ''}` : `${cup.beanName} 기록 보기`} accessibilityState={compareMode ? { selected: selectedCupIds.includes(cup.id), disabled: cup.kind !== 'home' || !cup.beanId } : undefined} onPress={() => compareMode ? toggleCup(cup) : router.push(`/cup/${cup.id}`)} style={[compareMode && styles.compareCard, selectedCupIds.includes(cup.id) && styles.compareCardSelected, compareMode && (cup.kind !== 'home' || !cup.beanId) && styles.compareCardDisabled]}><CupSummary cup={cup} />{compareMode && cup.kind === 'home' && cup.beanId ? <View style={styles.selectionMark}><Icon name={selectedCupIds.includes(cup.id) ? 'checkmark.circle.fill' : 'circle'} size={24} color={selectedCupIds.includes(cup.id) ? colors.espresso : colors.neutral600} /></View> : null}</Pressable>)}</View>) : <EmptyState title={cups.length ? '조건에 맞는 기록이 없어요' : beans.length ? '아직 기록이 없어요' : '먼저 원두를 추가해주세요'} body={cups.length ? '필터를 바꾸거나 다른 원두의 기록을 확인해보세요.' : beans.length ? '집에서 내린 커피는 브루잉 뒤에 자동으로 기록돼요. 카페 커피도 바로 남길 수 있어요.' : '원두를 추가하면 안내에 따라 내리고 맛을 기록할 수 있어요.'} icon="book.closed.fill" action={<Button label={beans.length ? '카페 커피 기록' : '첫 원두 추가'} onPress={() => router.push(beans.length ? '/record-cafe' : '/add-bean')} />} />}
    </Screen>
  );
}

function Filter({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={[styles.filter, selected && styles.filterSelected]}><Text variant="label" color={selected ? colors.cream : colors.neutral800}>{label}</Text></Pressable>; }
function groupByDate(cups: Cup[]) { const groups = new Map<string, Cup[]>(); cups.forEach((cup) => { const date = new Date(cup.createdAt); const key = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }); groups.set(key, [...(groups.get(key) ?? []), cup]); }); return [...groups].map(([title, items]) => ({ title, items })); }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, flex: { flex: 1 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.small }, filters: { flexDirection: 'row', padding: 4, backgroundColor: colors.creamDeep, borderRadius: radius.medium }, filter: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small }, filterSelected: { backgroundColor: colors.espresso }, beanFilter: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.compact, paddingHorizontal: spacing.small, borderRadius: radius.medium, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 }, group: { gap: spacing.small }, date: { flexDirection: 'row', alignItems: 'center', gap: spacing.small }, dateLine: { height: StyleSheet.hairlineWidth, flex: 1, backgroundColor: colors.neutral200 }, compareCard: { position: 'relative', borderWidth: 2, borderColor: 'transparent', borderRadius: radius.large }, compareCardSelected: { borderColor: colors.espresso }, compareCardDisabled: { opacity: 0.5 }, selectionMark: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' } });
