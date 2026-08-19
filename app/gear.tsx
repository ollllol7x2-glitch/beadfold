import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomSheet, Button, Card, Chip, Field, Icon, IconButton, InfoNote, PageHeader, Screen, Text } from '@/components/ui';
import { addUserGear, deleteUserGear, listCatalogGear, listUserGear, renameUserGear, setPrimaryGear } from '@/database/repository';
import type { Gear } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';
import { ConfirmDialog } from '@/components/confirmDialog';
import { useFeedback } from '@/components/feedback';
import { useFirstInvalidField } from '@/hooks/useFirstInvalidField';

const categories: Gear['category'][] = ['grinder', 'dripper', 'filter', 'kettle', 'scale', 'water'];
const labels: Record<Gear['category'], string> = { grinder: '그라인더', dripper: '드리퍼', filter: '필터', kettle: '주전자', scale: '저울', water: '물' };

export default function GearScreen() {
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [category, setCategory] = useState<Gear['category']>('grinder');
  const [catalog, setCatalog] = useState<Gear[]>([]);
  const [owned, setOwned] = useState<Gear[]>([]);
  const [customName, setCustomName] = useState('');
  const [customError, setCustomError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [manageTarget, setManageTarget] = useState<Gear | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Gear | null>(null);
  const { fieldRef, focusField } = useFirstInvalidField();

  const load = useCallback(async () => {
    const [nextCatalog, nextOwned] = await Promise.all([listCatalogGear(db), listUserGear(db)]);
    setCatalog(nextCatalog);
    setOwned(nextOwned);
  }, [db]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const add = async (gear: Gear, custom = false) => {
    await addUserGear(db, {
      category: gear.category,
      name: gear.name,
      brand: gear.brand,
      isPrimary: !owned.some((item) => item.category === gear.category),
      isCustom: custom,
      metadata: gear.metadata,
    });
    showFeedback(`${labels[gear.category]}를 내 장비에 추가했어요.`);
    await load();
  };

  const mine = owned.filter((item) => item.category === category);
  const filtered = catalog.filter((item) => item.category === category && !owned.some((ownedItem) => ownedItem.category === item.category && ownedItem.name === item.name));

  return (
    <Screen header={<PageHeader title="내 장비" backLabel="보관함" backHref="/(tabs)/collection" />}>
      <View style={styles.row}>{categories.map((item) => <Chip key={item} label={labels[item]} selected={category === item} onPress={() => setCategory(item)} />)}</View>

      <View style={styles.sectionGroup}>
        <Text variant="title2">내가 쓰는 장비</Text>
        {mine.length ? <View style={styles.gearList}>{mine.map((item, index) => (
          <View key={item.id} style={[styles.gearRow, index > 0 && styles.gearRowDivided]}>
            {editingId === item.id ? (
              <View style={styles.editingRow}>
                <Field label="장비 이름" value={editingName} onChangeText={setEditingName} autoFocus />
                <View style={styles.actions}>
                  <Button label="취소" variant="secondary" onPress={() => setEditingId(null)} style={styles.flex} />
                  <Button label="이름 저장" onPress={() => {
                    void renameUserGear(db, item.id, editingName).then(async () => {
                      setEditingId(null);
                      showFeedback('장비 이름을 수정했어요.');
                      await load();
                    });
                  }} style={styles.flex} />
                </View>
              </View>
            ) : (
              <><View style={styles.gearCopy}><Text variant="title3">{item.name}</Text><Text variant="caption" color={colors.neutral600}>{gearDescription(item)}</Text></View>{item.isPrimary ? <View style={styles.primary}><Icon name="checkmark.circle.fill" size={18} color={colors.success} weight="semibold" /><Text variant="caption" color={colors.success}>주로 사용</Text></View> : null}<IconButton name="ellipsis" label={`${item.name} 관리`} onPress={() => setManageTarget(item)} /></>
            )}
          </View>
        ))}</View> : <InfoNote body={`아직 등록한 ${labels[category]}가 없어요.`} />}
      </View>

      <View style={styles.sectionGroup}>
        <Text variant="title2">장비 목록</Text>
        {filtered.length ? <View style={styles.gearList}>{filtered.map((item, index) => <View key={item.id} style={[styles.gearRow, index > 0 && styles.gearRowDivided]}><View style={styles.gearCopy}><Text variant="title3">{item.name}</Text><Text variant="caption" color={colors.neutral600}>{gearDescription(item)}</Text></View><AddGearButton item={item} onPress={() => void add(item)} /></View>)}</View> : <InfoNote body="이 분류의 기본 장비는 모두 추가했어요." />}
      </View>

      <Card>
        <Text variant="title3">목록에 없나요?</Text>
        <Field ref={fieldRef('customName')} label="장비 이름" value={customName} onChangeText={(value) => { setCustomName(value); setCustomError(''); }} placeholder="직접 입력해주세요" error={customError} />
        <Button label="직접 추가" onPress={() => {
          if (!customName.trim()) { setCustomError('장비 이름을 입력해주세요.'); focusField('customName'); return; }
          const name = customName.trim();
          setCustomName('');
          void add({ id: '', category, name, brand: '', isPrimary: false, isCustom: true, metadata: {} }, true);
        }} />
      </Card>

      <ConfirmDialog
        visible={removeTarget != null}
        title="내 장비에서 제거할까요?"
        body="저장된 과거 커피 기록은 그대로 두고, 다음 추천에서만 이 장비를 제외해요."
        confirmLabel="제거"
        destructive
        onCancel={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (!removeTarget) return;
          const target = removeTarget;
          setRemoveTarget(null);
          void deleteUserGear(db, target.id).then(async () => {
            showFeedback(`${labels[target.category]}를 내 장비에서 제거했어요.`);
            await load();
          });
        }}
      />
      <BottomSheet visible={manageTarget != null} title={manageTarget?.name ?? '장비 관리'} onClose={() => setManageTarget(null)}>
        <View style={styles.sheetActions}>
          {manageTarget && !manageTarget.isPrimary ? <Button label="주로 사용하는 장비로 설정" onPress={() => { const target = manageTarget; setManageTarget(null); void setPrimaryGear(db, target.id, target.category).then(async () => { showFeedback(`${labels[target.category]} 대표 장비를 바꿨어요.`); await load(); }); }} /> : null}
          {manageTarget?.isCustom ? <Button label="이름 수정" variant="secondary" onPress={() => { setEditingId(manageTarget.id); setEditingName(manageTarget.name); setManageTarget(null); }} /> : null}
          {manageTarget ? <Button label="내 장비에서 제거" variant="danger" onPress={() => { setRemoveTarget(manageTarget); setManageTarget(null); }} /> : null}
        </View>
      </BottomSheet>
    </Screen>
  );
}

function AddGearButton({ item, onPress }: { item: Gear; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${item.name}을 내 장비에 추가`} onPress={onPress} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><Icon name="plus" size={21} color={colors.espresso} weight="bold" /></Pressable>;
}

function gearDescription(item: Gear) {
  return item.brand || (item.isCustom ? '직접 등록한 장비' : '브랜드 정보 없음');
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
  flex: { flex: 1 },
  sectionGroup: { gap: spacing.small },
  gearList: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, borderRadius: 18, backgroundColor: colors.white },
  gearRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: spacing.small, paddingVertical: spacing.compact },
  gearRowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  gearCopy: { flex: 1, gap: 2 },
  editingRow: { flex: 1, gap: spacing.small },
  primary: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.neutral200, borderRadius: 12, backgroundColor: colors.white },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
  sheetActions: { gap: spacing.compact, paddingBottom: spacing.small },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
});
