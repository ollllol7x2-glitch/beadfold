import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

  const beanChoices = beans.filter((bean) => cups.some((cup) => cup.beanId === bean.id));
  const activeBeanId = kind === 'cafe' ? null : beanId;
  const filtered = cups.filter((cup) => (kind === 'all' || cup.kind === kind) && (!activeBeanId || cup.beanId === activeBeanId));
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const compareAvailable = cups.filter((cup) => cup.kind === 'home' && cup.beanId).length >= 2;
  const toggleCup = (cup: Cup) => {
    if (cup.kind !== 'home' || !cup.beanId) return;
    setSelectedCupIds((current) => {
      if (current.includes(cup.id)) return current.filter((id) => id !== cup.id);
      return current.length < 2 ? [...current, cup.id] : current;
    });
  };
  const startCompare = () => { setCompareMode(true); setKind('home'); setSelectedCupIds([]); };
  const cancelCompare = () => { setCompareMode(false); setSelectedCupIds([]); };
  const selectBean = (nextBeanId: string | null) => { setBeanId(nextBeanId); setSelectedCupIds([]); };

  return (
    <Screen header={<View style={styles.header}><Text variant="title1" accessibilityRole="header">{compareMode ? '기록 비교' : '기록'}</Text>{compareMode ? <Button label="선택 취소" variant="tertiary" onPress={cancelCompare} /> : compareAvailable ? <Button label="비교할 기록 고르기" variant="tertiary" onPress={startCompare} /> : null}</View>} contentContainerStyle={styles.screen} footer={compareMode ? <BottomActionBar primaryLabel={selectedCupIds.length === 2 ? '선택한 2잔 비교하기' : `2잔 중 ${selectedCupIds.length}잔 선택`} primaryDisabled={selectedCupIds.length !== 2} onPrimaryPress={() => router.push(`/compare?cupIds=${selectedCupIds.join(',')}`)} /> : undefined}>
      <View style={styles.filters}><Filter label="전체" selected={kind === 'all'} onPress={() => setKind('all')} /><Filter label="집에서" selected={kind === 'home'} onPress={() => setKind('home')} /><Filter label="카페" selected={kind === 'cafe'} onPress={() => setKind('cafe')} /></View>
      {kind !== 'cafe' && beanChoices.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.beanChipScroll} contentContainerStyle={styles.beanChips} accessibilityRole="tablist" accessibilityLabel="원두별 기록 필터"><BeanChip label="전체" count={cups.length} selected={!activeBeanId} onPress={() => selectBean(null)} />{beanChoices.map((bean) => <BeanChip key={bean.id} label={bean.name} count={cups.filter((cup) => cup.beanId === bean.id).length} selected={activeBeanId === bean.id} onPress={() => selectBean(bean.id)} />)}</ScrollView> : null}
      {compareMode ? <Text variant="caption" color={colors.neutral800}>{selectedCupIds.length ? '다른 한 잔을 골라 비교해보세요.' : '비교할 두 잔을 골라주세요. 원두가 달라도 비교할 수 있어요.'}</Text> : null}
      {filtered.length ? grouped.map((group) => <View key={group.title} style={styles.group}><View style={styles.date}><Text variant="title3">{group.title}</Text><View style={styles.dateLine} /></View>{group.items.map((cup) => <Pressable key={cup.id} accessibilityRole="button" accessibilityLabel={compareMode ? `${cup.beanName} 기록 ${selectedCupIds.includes(cup.id) ? '선택 해제' : '선택'}${cup.kind !== 'home' || !cup.beanId ? '. 카페 기록은 비교할 수 없어요.' : ''}` : `${cup.beanName} 기록 보기`} accessibilityState={compareMode ? { selected: selectedCupIds.includes(cup.id), disabled: cup.kind !== 'home' || !cup.beanId } : undefined} onPress={() => compareMode ? toggleCup(cup) : router.push(`/cup/${cup.id}`)} style={[compareMode && styles.compareCard, selectedCupIds.includes(cup.id) && styles.compareCardSelected, compareMode && (cup.kind !== 'home' || !cup.beanId) && styles.compareCardDisabled]}><CupSummary cup={cup} />{compareMode && cup.kind === 'home' && cup.beanId ? <View style={styles.selectionMark}><Icon name={selectedCupIds.includes(cup.id) ? 'checkmark.circle.fill' : 'circle'} size={24} color={selectedCupIds.includes(cup.id) ? colors.espresso : colors.neutral600} /></View> : null}</Pressable>)}</View>) : <EmptyState title={kind === 'cafe' ? '아직 카페 기록이 없어요' : cups.length ? '조건에 맞는 기록이 없어요' : beans.length ? '아직 기록이 없어요' : '먼저 원두를 추가해주세요'} body={kind === 'cafe' ? '카페에서 마신 커피를 남기면 여기에 모아볼 수 있어요.' : cups.length ? '필터를 바꾸거나 다른 원두의 기록을 확인해보세요.' : beans.length ? '집에서 내린 커피는 브루잉 뒤에 자동으로 기록돼요. 카페 커피도 바로 남길 수 있어요.' : '원두를 추가하면 안내에 따라 내리고 맛을 기록할 수 있어요.'} icon="book.closed.fill" action={<Button label={kind === 'cafe' || beans.length ? '카페 커피 기록' : '첫 원두 추가'} onPress={() => router.push(kind === 'cafe' || beans.length ? '/record-cafe' : '/add-bean')} />} />}
    </Screen>
  );
}

function Filter({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={[styles.filter, selected && styles.filterSelected]}><Text variant="label" color={selected ? colors.cream : colors.neutral800}>{label}</Text></Pressable>; }
function BeanChip({ label, count, selected, onPress }: { label: string; count: number; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={`${label} ${count}개 기록`} onPress={onPress} style={({ pressed }) => [styles.beanChip, selected && styles.beanChipSelected, pressed && styles.pressed]}><Text variant="label" color={selected ? colors.cream : colors.neutral800}>{label}</Text><Text variant="caption" color={selected ? colors.creamDeep : colors.neutral600}>{count}</Text></Pressable>; }
function groupByDate(cups: Cup[]) { const groups = new Map<string, Cup[]>(); cups.forEach((cup) => { const date = new Date(cup.createdAt); const key = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }); groups.set(key, [...(groups.get(key) ?? []), cup]); }); return [...groups].map(([title, items]) => ({ title, items })); }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, header: { minHeight: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.small }, filters: { flexDirection: 'row', padding: 4, backgroundColor: colors.creamDeep, borderRadius: radius.medium }, filter: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small }, filterSelected: { backgroundColor: colors.espresso }, beanChipScroll: { flexGrow: 0, height: 38, maxHeight: 38 }, beanChips: { height: 38, alignItems: 'center', gap: spacing.compact, paddingRight: spacing.section }, beanChip: { alignSelf: 'flex-start', height: 38, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.small, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 }, beanChipSelected: { backgroundColor: colors.espresso, borderColor: colors.espresso }, pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] }, group: { gap: spacing.small }, date: { flexDirection: 'row', alignItems: 'center', gap: spacing.small }, dateLine: { height: StyleSheet.hairlineWidth, flex: 1, backgroundColor: colors.neutral200 }, compareCard: { position: 'relative', borderWidth: 2, borderColor: 'transparent', borderRadius: radius.large }, compareCardSelected: { borderColor: colors.espresso }, compareCardDisabled: { opacity: 0.5 }, selectionMark: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' } });
