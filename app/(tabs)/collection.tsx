import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BeanSummary, RecipeSummary } from '@/components/data';
import { Button, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { listBeans, listRecipes, listUserGear, restoreBean } from '@/database/repository';
import type { BeanLot, Gear, Recipe } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';
import { useFeedback } from '@/components/feedback';

type Section = 'beans' | 'recipes' | 'gear';

export default function CollectionScreen() {
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [section, setSection] = useState<Section>('beans');
  const [beans, setBeans] = useState<BeanLot[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [gear, setGear] = useState<Gear[]>([]);
  const load = useCallback(async () => { const [b, r, g] = await Promise.all([listBeans(db, true), listRecipes(db), listUserGear(db)]); setBeans(b); setRecipes(r); setGear(g); }, [db]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const activeBeans = beans.filter((bean) => bean.state !== 'archived');
  const archivedBeans = beans.filter((bean) => bean.state === 'archived');
  return <Screen header={<View style={styles.header}><View><Text variant="title1" accessibilityRole="header">보관함</Text><Text color={colors.neutral800}>원두와 레시피, 장비를 한곳에서 관리해요.</Text></View></View>} contentContainerStyle={styles.screen}>
    <View accessibilityRole="tablist" style={styles.segment}><Segment label="원두" count={activeBeans.length} selected={section === 'beans'} onPress={() => setSection('beans')} /><Segment label="레시피" count={recipes.length} selected={section === 'recipes'} onPress={() => setSection('recipes')} /><Segment label="장비" count={gear.length} selected={section === 'gear'} onPress={() => setSection('gear')} /></View>
    {section === 'beans' ? <>{activeBeans.length ? <View style={styles.list}>{activeBeans.map((bean) => <Pressable key={bean.id} accessibilityRole="button" accessibilityLabel={`${bean.name} 원두 보기`} onPress={() => router.push(`/bean/${bean.id}`)}><BeanSummary bean={bean} /></Pressable>)}</View> : <EmptyState title="원두를 하나 담아볼까요?" body="이름과 남은 양만 알면 시작할 수 있어요." icon="leaf.fill" action={<Button label="원두 추가하기" onPress={() => router.push('/add-bean')} />} />}{archivedBeans.length ? <View style={styles.archivedSection}><Text variant="title2">보관한 원두</Text>{archivedBeans.map((bean) => <View key={bean.id} style={styles.archivedRow}><View style={styles.copy}><Text variant="title3">{bean.name}</Text><Text color={colors.neutral800}>기본 목록에서 숨긴 원두</Text></View><Button label="복구" variant="secondary" onPress={async () => { await restoreBean(db, bean.id); await load(); showFeedback('원두를 원래 상태로 복구했어요.'); }} /></View>)}</View> : null}</> : null}
    {section === 'recipes' && (recipes.length ? <View style={styles.list}>{recipes.map((recipe) => <Pressable key={recipe.id} accessibilityRole="button" accessibilityLabel={`${recipe.name} 레시피 보기`} onPress={() => router.push(`/recipe/manual?recipeId=${recipe.id}`)}><RecipeSummary recipe={recipe} /></Pressable>)}</View> : <EmptyState title="저장한 레시피가 없어요" body="원두를 고르면 추천 레시피부터 시작할 수 있어요." icon="book.pages.fill" />)}
    {section === 'gear' && <>{gear.length ? <View style={styles.gearList}>{gear.map((item) => <View key={item.id} style={styles.gear}><View style={styles.gearIcon}><Icon name={gearIcon(item.category)} size={24} /></View><View style={styles.copy}><Text variant="title3">{item.name}</Text><Text color={colors.neutral800}>{gearLabel(item.category)}{item.isPrimary ? ' · 주로 사용' : ''}</Text></View></View>)}</View> : <EmptyState title="사용하는 장비를 알려주세요" body="등록하지 않아도 기본값으로 추천받을 수 있어요." icon="dial.medium" />}<Button label="장비 관리" variant="secondary" onPress={() => router.push('/gear')} /></>}
  </Screen>;
}
function Segment({ label, count, selected, onPress }: { label: string; count: number; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={[styles.segmentItem, selected && styles.segmentSelected]}><Text variant="caption" color={selected ? colors.cream : colors.neutral800}>{label} {count}</Text></Pressable>; }
function gearLabel(value: Gear['category']) { return ({ grinder: '그라인더', dripper: '드리퍼', filter: '필터', kettle: '주전자', scale: '저울', water: '물' } as const)[value]; }
function gearIcon(value: Gear['category']): Parameters<typeof Icon>[0]['name'] { return ({ grinder: 'dial.medium', dripper: 'cup.and.heat.waves.fill', filter: 'line.3.horizontal.decrease', kettle: 'waterbottle.fill', scale: 'dial.medium', water: 'drop.fill' } as const)[value]; }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, segment: { flexDirection: 'row', padding: 4, backgroundColor: colors.creamDeep, borderRadius: radius.medium }, segmentItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.small }, segmentSelected: { backgroundColor: colors.espresso }, list: { gap: spacing.small }, archivedSection: { gap: spacing.small, paddingTop: spacing.small }, archivedRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderRadius: radius.large, backgroundColor: colors.white }, gearList: { backgroundColor: colors.white, borderRadius: radius.large, overflow: 'hidden' }, gear: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small }, gearIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1 } });
