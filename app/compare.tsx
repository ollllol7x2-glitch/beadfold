import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, Chip, EmptyState, Icon, PageHeader, Screen, Text } from '@/components/ui';
import { listCups, trackEvent } from '@/database/repository';
import { localizedFlavor, satisfactionLabel, satisfactionScore, type Cup, type TasteValues } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

const tasteLabels: Record<keyof TasteValues, string> = { acidity: '산미', sweetness: '단맛', body: '질감', bitterness: '쓴맛', aroma: '향', aftertaste: '여운', balance: '균형' };

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
      if (active) { setCups(target); setSelected(requestedIds.length ? target.map((cup) => cup.id).slice(0, 2) : target.slice(0, 2).map((cup) => cup.id)); }
    });
    return () => { active = false; };
  }, [beanId, cupIds, db]));
  const chosen = selected.map((id) => cups.find((cup) => cup.id === id)).filter(Boolean) as Cup[];
  useEffect(() => { if (chosen.length === 2) void trackEvent(db, 'compare_completed', { bean_id: beanId ?? null }); }, [beanId, chosen.length, db]);
  if (cups.length < 2) return <Screen><PageHeader title="두 잔 비교" description="같은 원두로 내린 커피를 나란히 살펴봐요." backLabel="기록" /><EmptyState title="한 잔이 더 필요해요" body="같은 원두로 두 번 내리면 추출값과 맛의 차이를 볼 수 있어요." icon="arrow.left.arrow.right" /></Screen>;

  const scores = chosen.map((cup) => cup.satisfaction ? satisfactionScore[cup.satisfaction] : null);
  const winner = scores[0] != null && scores[1] != null && scores[0] !== scores[1] ? (scores[0]! > scores[1]! ? 0 : 1) : null;
  const insight = winner == null ? '두 기록의 만족도는 같거나 아직 평가하지 않았어요.' : `${winner + 1}번째 커피가 더 잘 맞았어요. 달랐던 조건을 확인해보세요.`;
  return <Screen contentContainerStyle={styles.screen}>
    <PageHeader title="두 잔 비교" description="결론을 단정하지 않고 달랐던 조건부터 살펴봐요." backLabel="기록" />
    <View style={styles.chips}>{cups.map((cup, index) => <Chip key={cup.id} label={`${index + 1}번째, ${new Date(cup.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}`} selected={selected.includes(cup.id)} onPress={() => setSelected((current) => current.includes(cup.id) ? current.filter((id) => id !== cup.id) : current.length < 2 ? [...current, cup.id] : [current[1]!, cup.id])} />)}</View>
    {chosen.length < 2 ? <Text accessibilityRole="alert" color={colors.error}>비교할 기록 두 개를 골라주세요.</Text> : <>
      <Card tone="tinted"><View style={styles.insightTitle}><Icon name="sparkles" size={20} /><Text variant="label">비교 결과</Text></View><Text variant="title2">{insight}</Text></Card>
      <ComparisonSection title="달랐던 추출값" rows={variableRows(chosen)} />
      <ComparisonSection title="맛의 차이" rows={tasteRows(chosen)} />
      <View style={styles.columns}>{chosen.map((cup, index) => <View key={cup.id} style={styles.column}><Text variant="caption" color={colors.neutral600}>{index + 1}번째 커피</Text><Text variant="title3">{cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '평가 전'}</Text><Text color={colors.neutral800}>{cup.flavorTags.map(localizedFlavor).join(' · ') || '느낀 맛 기록 없음'}</Text></View>)}</View>
    </>}
  </Screen>;
}

function variableRows(cups: Cup[]) {
  const first = cups[0]?.recipeSnapshot; const second = cups[1]?.recipeSnapshot;
  return [
    ['원두량', first ? `${first.doseG}g` : '기록 없음', second ? `${second.doseG}g` : '기록 없음'],
    ['물', first ? `${first.waterMl}ml` : '기록 없음', second ? `${second.waterMl}ml` : '기록 없음'],
    ['온도', first ? `${first.temperatureC}℃` : '기록 없음', second ? `${second.temperatureC}℃` : '기록 없음'],
    ['추출 시간', first ? `${first.totalTimeSec}초` : '기록 없음', second ? `${second.totalTimeSec}초` : '기록 없음'],
    ['분쇄도', first?.grindTarget ?? '기록 없음', second?.grindTarget ?? '기록 없음'],
  ] as [string, string, string][];
}
function tasteRows(cups: Cup[]) { return (Object.keys(tasteLabels) as (keyof TasteValues)[]).map((key) => [tasteLabels[key], cups[0]?.taste[key] == null ? '기록 없음' : `${cups[0]!.taste[key]} / 5`, cups[1]?.taste[key] == null ? '기록 없음' : `${cups[1]!.taste[key]} / 5`] as [string, string, string]); }
function ComparisonSection({ title, rows }: { title: string; rows: [string, string, string][] }) { return <Card><Text variant="title2">{title}</Text><View style={styles.tableHeader}><Text variant="caption" style={styles.rowLabel}>항목</Text><Text variant="caption" style={styles.cell}>1번째</Text><Text variant="caption" style={styles.cell}>2번째</Text></View>{rows.map(([label, first, second]) => <View key={label} style={[styles.tableRow, first !== second && styles.changed]}><Text variant="label" style={styles.rowLabel}>{label}</Text><Text style={styles.cell}>{first}</Text><Text style={styles.cell}>{second}</Text></View>)}</Card>; }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, insightTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact }, columns: { flexDirection: 'row', gap: spacing.small }, column: { flex: 1, gap: spacing.compact, padding: spacing.small, borderRadius: radius.large, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 }, tableHeader: { flexDirection: 'row', paddingBottom: spacing.compact }, tableRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.compact }, changed: { backgroundColor: colors.creamDeep, marginHorizontal: -spacing.compact, paddingHorizontal: spacing.compact, borderRadius: radius.small }, rowLabel: { width: 92 }, cell: { flex: 1, textAlign: 'center' } });
