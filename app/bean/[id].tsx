import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CupSummary, RecipeSummary } from '@/components/data';
import { BottomActionBar, Button, Card, EmptyState, Icon, IconButton, InfoNote, PageHeader, Screen, Text, type SymbolName } from '@/components/ui';
import { archiveBean, deleteBean, getBean, listCatalogGear, listCups, listInventoryEvents, listRecipes, listUserGear, type InventoryEvent } from '@/database/repository';
import { getInventoryStatus } from '@/domain/inventory';
import { generateGuidedRecipe } from '@/domain/recipeEngine';
import type { BeanLot, Cup, Gear, Recipe } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';
import { ConfirmDialog } from '@/components/confirmDialog';
import { beanStateLabel, roastLevelLabel } from '@/domain/types';
import { useFeedback } from '@/components/feedback';

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [bean, setBean] = useState<BeanLot | null>(null);
  const [cups, setCups] = useState<Cup[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventoryEvents, setInventoryEvents] = useState<InventoryEvent[]>([]);
  const [recommendedDoseG, setRecommendedDoseG] = useState(15);
  const [confirmation, setConfirmation] = useState<'archive' | 'delete' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    let active = true;
    Promise.all([getBean(db, id), listCups(db, { beanId: id }), listRecipes(db, id), listUserGear(db), listCatalogGear(db), listInventoryEvents(db, id)]).then(([b, c, r, ownedGear, catalogGear, events]) => {
      if (!active) return;
      setBean(b); setCups(c); setRecipes(r); setInventoryEvents(events);
      if (!b) return;
      const availableGear = ownedGear.length ? ownedGear : catalogGear;
      const primaryGear = (category: Gear['category']) => availableGear.find((item) => item.category === category && item.isPrimary) ?? availableGear.find((item) => item.category === category) ?? null;
      try {
        const recommendation = generateGuidedRecipe({ bean: b, grinder: primaryGear('grinder'), dripper: primaryGear('dripper'), filter: primaryGear('filter'), water: primaryGear('water'), previousCups: c });
        setRecommendedDoseG(recommendation.doseG);
      } catch {
        setRecommendedDoseG(15);
      }
    });
    return () => { active = false; };
  }, [db, id]));

  if (!bean) return <Screen><EmptyState title="원두를 찾지 못했어요" body="이미 보관했거나 삭제한 원두일 수 있어요." action={<Button label="보관함으로 돌아가기" onPress={() => router.replace('/(tabs)/collection')} />} /></Screen>;

  const confirm = async () => {
    if (confirmation === 'archive') {
      await archiveBean(db, bean.id);
      showFeedback('원두를 보관했어요. 보관함에서 언제든 복구할 수 있어요.');
    } else if (confirmation === 'delete') {
      await deleteBean(db, bean.id);
      showFeedback('원두 정보를 삭제했어요.');
    } else return;
    setConfirmation(null);
    router.replace('/(tabs)/collection');
  };

  const hasDetails = Boolean(bean.country || bean.region || bean.variety || bean.process || bean.roastDate || bean.tastingNotes.length || bean.description);
  const preparation = [bean.process, bean.roastLevel === 'unknown' ? '' : roastLevelLabel[bean.roastLevel]].filter(Boolean).join(' · ');
  const inventory = getInventoryStatus(bean.remainingWeightG, recommendedDoseG);

  return (
    <Screen header={<PageHeader title={bean.name} backLabel="보관함" backHref="/(tabs)/collection" action={<IconButton name="ellipsis" label="원두 메뉴 열기" onPress={() => setMenuOpen(true)} />} />} footer={<BottomActionBar primaryLabel="추천대로 내리기" onPrimaryPress={() => router.push(`/recipe/guided?beanId=${bean.id}`)} secondaryLabel="직접 레시피" onSecondaryPress={() => router.push(`/recipe/manual?beanId=${bean.id}`)} />}>
      <Card style={styles.hero}>
        <Text variant="label">{preparation || '가공·로스팅 정보 미입력'}</Text>
        <Text variant="title1">{bean.remainingWeightG}g</Text>
        <Text color={colors.neutral600}>처음 {bean.initialWeightG}g · {beanStateLabel[bean.state]}</Text>
        {bean.state !== 'finished' ? <InventorySummary inventory={inventory} /> : null}
      </Card>
      <View style={styles.sectionGroup}>
        <View style={styles.section}><Text variant="title2">재고 이력</Text><Button label="재고 맞추기" variant="secondary" onPress={() => router.push(`/bean/${bean.id}/inventory`)} style={styles.sectionButton} /></View>
        <InventoryHistory cups={cups} events={inventoryEvents} />
      </View>
      {hasDetails ? <Card>
        <Text variant="title2">원두 정보</Text>
        <Detail label="국가" value={bean.country} /><Detail label="산지" value={bean.region} />
        <Detail label="품종" value={bean.variety} /><Detail label="가공 방식" value={bean.process} /><Detail label="로스팅 날짜" value={bean.roastDate ?? ''} />
        <Detail label="봉투에 적힌 맛" value={bean.tastingNotes.join(', ')} /><Detail label="메모" value={bean.description} />
      </Card> : null}
      <View style={styles.sectionGroup}>
        <Text variant="title2">저장한 레시피</Text>
        {recipes.length ? recipes.map((recipe) => <RecipeSummary key={recipe.id} recipe={recipe} />) : <InfoNote body="아직 저장한 레시피가 없어요." />}
      </View>
      <View style={styles.sectionGroup}>
        <View style={styles.section}><Text variant="title2">이 원두로 마신 커피</Text>{cups.length >= 2 ? <Button label="맛 비교" variant="secondary" onPress={() => router.push(`/compare?beanId=${bean.id}`)} style={styles.sectionButton} /> : null}</View>
        {cups.length ? cups.slice(0, 4).map((cup) => <CupSummary key={cup.id} cup={cup} />) : <InfoNote body="첫 브루잉을 완료하면 경험이 여기에 남아요." />}
      </View>
      <BeanMenu visible={menuOpen} bean={bean} hasDetails={hasDetails} onClose={() => setMenuOpen(false)} onEdit={() => { setMenuOpen(false); router.push(`/add-bean?editId=${bean.id}`); }} onDuplicate={() => { setMenuOpen(false); router.push(`/add-bean?copyFromId=${bean.id}`); }} onArchive={() => { setMenuOpen(false); setConfirmation('archive'); }} onDelete={() => { setMenuOpen(false); setConfirmation('delete'); }} />
      <ConfirmDialog visible={confirmation != null} title={confirmation === 'delete' ? '이 원두를 삭제할까요?' : '다 마신 원두를 보관할까요?'} body={confirmation === 'delete' ? '원두 정보는 삭제하지만 이미 마신 커피 기록은 그대로 남아요.' : '기본 목록에서만 숨겨요. 이 원두로 남긴 커피 기록은 계속 볼 수 있어요.'} confirmLabel={confirmation === 'delete' ? '삭제' : '보관'} destructive={confirmation === 'delete'} onCancel={() => setConfirmation(null)} onConfirm={() => void confirm()} />
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) { if (!value) return null; return <View style={styles.detail}><Text variant="label" style={styles.label}>{label}</Text><Text style={styles.flex}>{value}</Text></View>; }
function InventorySummary({ inventory }: { inventory: ReturnType<typeof getInventoryStatus> }) {
  const color = inventory.tone === 'critical' ? colors.error : inventory.tone === 'caution' ? colors.cocoa : colors.neutral800;
  return (
    <View accessible accessibilityLabel={`현재 추천 레시피 기준 ${inventory.doseG}그램. ${inventory.message}`} style={styles.inventory}>
      <View style={styles.inventoryHeader}><Text variant="caption" color={colors.neutral600}>현재 추천 레시피 기준</Text><Text variant="label">1잔 {inventory.doseG}g</Text></View>
      <View style={styles.inventoryResult}><Text variant="title3" color={color}>{inventory.servings}잔 가능</Text><Text variant="caption" color={color}>{inventory.message}</Text></View>
    </View>
  );
}
function InventoryHistory({ cups, events }: { cups: Cup[]; events: InventoryEvent[] }) {
  const eventByCup = new Map(events.filter((event) => event.cupId).map((event) => [event.cupId!, event]));
  const brewEntries = cups.filter((cup) => cup.kind === 'home' && cup.recipeSnapshot).map((cup) => {
    const event = eventByCup.get(cup.id);
    return { id: cup.id, label: '추출 완료', detail: `${cup.recipeSnapshot!.name} · ${cup.recipeSnapshot!.doseG}g 사용`, deltaG: event?.deltaG ?? -cup.recipeSnapshot!.doseG, remainingWeightG: event?.remainingWeightG ?? null, createdAt: cup.createdAt };
  });
  const adjustmentEntries = events.filter((event) => !event.cupId).map((event) => ({ id: event.id, label: '재고 맞춤', detail: event.deltaG > 0 ? '남은 양을 더했어요' : '실제 남은 양으로 조정했어요', deltaG: event.deltaG, remainingWeightG: event.remainingWeightG, createdAt: event.createdAt }));
  const entries = [...brewEntries, ...adjustmentEntries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!entries.length) return <InfoNote body="추출을 완료하거나 재고를 맞추면 여기에 남아요." />;
  return <Card style={styles.history}>{entries.slice(0, 5).map((entry, index) => <View key={entry.id} style={[styles.historyRow, index > 0 && styles.historyRowDivided]}><View style={styles.flex}><Text variant="label">{entry.label}</Text><Text variant="caption" color={colors.neutral600}>{new Date(entry.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {entry.detail}</Text></View><View style={styles.historyAmount}><Text variant="label" color={entry.deltaG < 0 ? colors.neutral800 : colors.success}>{entry.deltaG > 0 ? '+' : ''}{entry.deltaG}g</Text>{entry.remainingWeightG != null ? <Text variant="caption" color={colors.neutral600}>{entry.remainingWeightG}g 남음</Text> : null}</View></View>)}</Card>;
}
function BeanMenu({ visible, bean, hasDetails, onClose, onEdit, onDuplicate, onArchive, onDelete }: { visible: boolean; bean: BeanLot; hasDetails: boolean; onClose: () => void; onEdit: () => void; onDuplicate: () => void; onArchive: () => void; onDelete: () => void }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}><View style={styles.menuLayer}><Pressable accessibilityRole="button" accessibilityLabel="원두 메뉴 닫기" style={StyleSheet.absoluteFill} onPress={onClose} /><View accessibilityViewIsModal style={styles.menu}><MenuAction icon="pencil" label={hasDetails ? '원두 정보 수정' : '원두 정보 추가'} onPress={onEdit} /><MenuAction icon="doc.on.doc" label="새 구매로 복제" onPress={onDuplicate} />{bean.state === 'finished' ? <MenuAction icon="archivebox.fill" label="다 마신 원두 보관" onPress={onArchive} /> : null}<MenuAction icon="trash" label="원두 영구 삭제" destructive onPress={onDelete} /></View></View></Modal>;
}
function MenuAction({ icon, label, destructive, onPress }: { icon: SymbolName; label: string; destructive?: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}><Icon name={icon} size={20} color={destructive ? colors.error : colors.espresso} /><Text variant="label" color={destructive ? colors.error : colors.charcoal}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({ hero: { backgroundColor: colors.warmBeige }, flex: { flex: 1 }, detail: { flexDirection: 'row', gap: spacing.default, paddingVertical: spacing.compact, borderBottomWidth: 1, borderBottomColor: colors.neutral200 }, label: { width: 104 }, sectionGroup: { gap: spacing.small }, section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.small }, sectionButton: { minHeight: 36, minWidth: 0, paddingHorizontal: 12, paddingVertical: 7 }, inventory: { gap: spacing.compact, marginTop: spacing.compact, padding: spacing.small, borderRadius: radius.medium, backgroundColor: colors.white }, inventoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.small }, inventoryResult: { gap: 2 }, history: { gap: 0 }, historyRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingVertical: spacing.compact }, historyRowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 }, historyAmount: { alignItems: 'flex-end', gap: 2 }, menuLayer: { flex: 1 }, menu: { position: 'absolute', top: 76, right: 18, width: 224, overflow: 'hidden', borderRadius: radius.large, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8 }, menuAction: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: spacing.small }, pressed: { opacity: 0.62 } });
