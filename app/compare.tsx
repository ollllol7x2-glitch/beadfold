import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { EmptyState, Icon, PageHeader, Screen, Text } from '@/components/ui';
import { listCups, trackEvent } from '@/database/repository';
import { localizedFlavor, satisfactionLabel, satisfactionScore, type Cup, type TasteValues } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

const tasteLabels: Record<keyof TasteValues, string> = { acidity: '산미', sweetness: '단맛', body: '질감', bitterness: '쓴맛', aroma: '향', aftertaste: '여운', balance: '균형' };
type Difference = { label: string; before: string; after: string };

export default function CompareScreen() {
  const { beanId, cupIds } = useLocalSearchParams<{ beanId?: string; cupIds?: string }>();
  const db = useSQLiteContext();
  const [cups, setCups] = useState<Cup[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  useFocusEffect(useCallback(() => {
    let active = true;
    const requestedIds = cupIds?.split(',').filter(Boolean) ?? [];
    void trackEvent(db, 'compare_started', { bean_id: beanId ?? null, selected_count: requestedIds.length });
    void listCups(db, beanId ? { beanId } : undefined).then((all) => {
      const home = all.filter((cup) => cup.kind === 'home' && cup.beanId);
      const target = requestedIds.length ? home.filter((cup) => requestedIds.includes(cup.id)) : beanId ? home : home.filter((cup) => home.filter((other) => other.beanId === cup.beanId).length >= 2);
      if (active) {
        setCups(target);
        setSelected(requestedIds.length ? target.map((cup) => cup.id).slice(0, 2) : target.slice(0, 2).map((cup) => cup.id));
      }
    });
    return () => { active = false; };
  }, [beanId, cupIds, db]));

  const chosen = useMemo(() => selected.map((id) => cups.find((cup) => cup.id === id)).filter(Boolean).sort((first, second) => new Date(first!.createdAt).getTime() - new Date(second!.createdAt).getTime()) as Cup[], [cups, selected]);
  useEffect(() => { if (chosen.length === 2) void trackEvent(db, 'compare_completed', { bean_id: beanId ?? null }); }, [beanId, chosen.length, db]);
  if (cups.length < 2) return <Screen header={<PageHeader title="두 잔 비교" backLabel="기록" backHref="/(tabs)/journal" />}><EmptyState title="한 잔이 더 필요해요" body="같은 원두로 두 번 내리면 추출값과 맛의 차이를 볼 수 있어요." icon="arrow.left.arrow.right" /></Screen>;

  const variables = chosen.length === 2 ? variableDifferences(chosen) : [];
  const tastes = chosen.length === 2 ? tasteDifferences(chosen) : [];
  const scores = chosen.map((cup) => cup.satisfaction ? satisfactionScore[cup.satisfaction] : null);
  const winner = scores[0] != null && scores[1] != null && scores[0] !== scores[1] ? (scores[0]! > scores[1]! ? 0 : 1) : null;
  const beanName = chosen[0]?.beanName ?? cups[0]!.beanName;
  return <Screen header={<PageHeader title="두 잔 비교" backLabel="기록" backHref="/(tabs)/journal" />} contentContainerStyle={styles.screen}>
    <View style={styles.intro}><Text variant="title1">{beanName}</Text><Text color={colors.neutral800}>달라진 조건과 맛만 비교해요.</Text></View>
    <View style={styles.selector}>
      <Text variant="label">비교할 두 잔</Text>
      <View style={styles.cupSelectors}>{cups.map((cup) => <CompareCupOption key={cup.id} cup={cup} selected={selected.includes(cup.id)} onPress={() => setSelected((current) => current.includes(cup.id) ? current.filter((id) => id !== cup.id) : current.length < 2 ? [...current, cup.id] : [current[1]!, cup.id])} />)}</View>
    </View>
    {chosen.length < 2 ? <Text accessibilityRole="alert" color={colors.error}>비교할 기록 두 개를 골라주세요.</Text> : <>
      <ResultSummary cups={chosen} winner={winner} />
      <DifferenceSection title="달라진 추출값" differences={variables} empty="두 잔의 추출 조건이 같아요." />
      <DifferenceSection title="맛의 차이" differences={tastes} empty="세부 맛 점수는 같거나 아직 기록하지 않았어요." />
    </>}
  </Screen>;
}

function ResultSummary({ cups, winner }: { cups: Cup[]; winner: number | null }) {
  const message = winner == null ? '두 잔의 만족도는 같거나 아직 평가하지 않았어요.' : `${winner === 0 ? '이전' : '최근'} 기록이 더 좋았어요.`;
  return <View style={styles.result}><View style={styles.resultHeading}><Icon name="sparkles" size={19} color={colors.espresso} /><Text variant="label">비교 결과</Text></View><Text variant="title2">{message}</Text><View style={styles.cupOverview}>{cups.map((cup, index) => <View key={cup.id} style={styles.cupOverviewItem}><Text variant="caption" color={colors.neutral600}>{index === 0 ? '이전 기록' : '최근 기록'}</Text><Text variant="label">{cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '평가 전'}</Text></View>)}</View></View>;
}

function DifferenceSection({ title, differences, empty }: { title: string; differences: Difference[]; empty: string }) {
  return <View style={styles.section}><Text variant="title2">{title}</Text>{differences.length ? <View style={styles.differenceList}>{differences.map((difference) => <DifferenceRow key={difference.label} difference={difference} />)}</View> : <Text color={colors.neutral800}>{empty}</Text>}</View>;
}

function DifferenceRow({ difference }: { difference: Difference }) {
  return <View style={styles.differenceRow}><Text variant="label" style={styles.differenceLabel}>{difference.label}</Text><View style={styles.differenceValues}><Text style={styles.before} numberOfLines={1}>{difference.before}</Text><Icon name="arrow.right" size={15} color={colors.neutral600} /><Text variant="label" style={styles.after} numberOfLines={1}>{difference.after}</Text></View></View>;
}

function CompareCupOption({ cup, selected, onPress }: { cup: Cup; selected: boolean; onPress: () => void }) {
  const recipe = cup.recipeSnapshot;
  const conditions = recipe ? `${recipe.temperatureC}℃ · ${formatDuration(recipe.totalTimeSec)}` : '추출 조건 없음';
  const feedback = [cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '평가 전', cup.flavorTags[0] ? localizedFlavor(cup.flavorTags[0]) : '맛 태그 없음'].join(' · ');
  return <Pressable accessibilityRole="button" accessibilityLabel={`${formatCupDate(cup)} 기록. ${conditions}. ${feedback}`} accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.cupSelector, selected && styles.cupSelectorSelected, pressed && styles.pressed]}>
    <View style={styles.selectorTitle}><Text variant="label" color={selected ? colors.cream : colors.charcoal}>{conditions}</Text>{selected ? <Icon name="checkmark" size={16} color={colors.cream} weight="bold" /> : null}</View>
    <Text variant="caption" color={selected ? colors.creamDeep : colors.neutral800} numberOfLines={1}>{feedback}</Text>
    <Text variant="caption" color={selected ? colors.creamDeep : colors.neutral600}>{formatCupDate(cup)}</Text>
  </Pressable>;
}

function variableDifferences(cups: Cup[]): Difference[] {
  const first = cups[0]?.recipeSnapshot;
  const second = cups[1]?.recipeSnapshot;
  const rows: Difference[] = [
    { label: '원두량', before: first ? `${first.doseG}g` : '기록 없음', after: second ? `${second.doseG}g` : '기록 없음' },
    { label: '물', before: first ? `${first.waterMl}ml` : '기록 없음', after: second ? `${second.waterMl}ml` : '기록 없음' },
    { label: '온도', before: first ? `${first.temperatureC}℃` : '기록 없음', after: second ? `${second.temperatureC}℃` : '기록 없음' },
    { label: '추출 시간', before: first ? formatDuration(first.totalTimeSec) : '기록 없음', after: second ? formatDuration(second.totalTimeSec) : '기록 없음' },
    { label: '분쇄도', before: first?.grindTarget ?? '기록 없음', after: second?.grindTarget ?? '기록 없음' },
  ];
  return rows.filter((row) => row.before !== row.after);
}

function tasteDifferences(cups: Cup[]): Difference[] {
  return (Object.keys(tasteLabels) as (keyof TasteValues)[]).flatMap((key) => {
    const before = cups[0]?.taste[key];
    const after = cups[1]?.taste[key];
    return before != null && after != null && before !== after ? [{ label: tasteLabels[key], before: `${before} / 5`, after: `${after} / 5` }] : [];
  });
}

function formatCupDate(cup: Cup) {
  const date = new Date(cup.createdAt);
  return `${date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} ${date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })}`;
}
function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`; }

const styles = StyleSheet.create({
  screen: { gap: spacing.section },
  intro: { gap: spacing.xs },
  selector: { gap: spacing.small },
  cupSelectors: { flexDirection: 'row', gap: spacing.compact },
  cupSelector: { flex: 1, minHeight: 104, justifyContent: 'center', gap: 4, padding: spacing.small, borderWidth: 1, borderColor: colors.neutral200, borderRadius: radius.medium, backgroundColor: colors.white },
  cupSelectorSelected: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  selectorTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  result: { gap: spacing.small, padding: spacing.default, borderRadius: radius.large, backgroundColor: colors.creamDeep, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.warmBeige },
  resultHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  cupOverview: { flexDirection: 'row', gap: spacing.small, paddingTop: spacing.small, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.warmBeige },
  cupOverviewItem: { flex: 1, gap: 2 },
  section: { gap: spacing.small },
  differenceList: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  differenceRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.small, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral200 },
  differenceLabel: { width: 72 },
  differenceValues: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  before: { flex: 1, color: colors.neutral800, textAlign: 'right' },
  after: { flex: 1, textAlign: 'left' },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
});
