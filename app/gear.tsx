import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Chip, Field, Icon, PageHeader, Screen, Text } from '@/components/ui';
import { addUserGear, deleteUserGear, listCatalogGear, listUserGear, renameUserGear, setPrimaryGear } from '@/database/repository';
import type { Gear } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';
import { ConfirmDialog } from '@/components/confirmDialog';
import { useFeedback } from '@/components/feedback';

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
  const [removeTarget, setRemoveTarget] = useState<Gear | null>(null);

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
  const filtered = catalog.filter((item) => item.category === category);

  return (
    <Screen header={<PageHeader title="내 장비" backLabel="보관함" backHref="/(tabs)/collection" />}>
      <View style={styles.row}>{categories.map((item) => <Chip key={item} label={labels[item]} selected={category === item} onPress={() => setCategory(item)} />)}</View>

      <Text variant="title2">내가 쓰는 장비</Text>
      {mine.length ? mine.map((item) => (
        <Card key={item.id}>
          {editingId === item.id ? (
            <>
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
            </>
          ) : (
            <>
              <View style={styles.gearHeading}>
                <View style={styles.flex}>
                  <Text variant="title3">{item.name}</Text>
                  <Text color={colors.neutral800}>{item.brand || '직접 등록'}</Text>
                </View>
                {item.isPrimary ? <View style={styles.primary}><Icon name="checkmark.circle.fill" size={18} color={colors.success} /><Text variant="label" color={colors.success}>주로 사용</Text></View> : null}
              </View>
              <View style={styles.actions}>
                {!item.isPrimary ? <Button label="주로 사용" variant="secondary" onPress={() => {
                  void setPrimaryGear(db, item.id, item.category).then(async () => {
                    showFeedback(`${labels[item.category]} 대표 장비를 바꿨어요.`);
                    await load();
                  });
                }} style={styles.flex} /> : null}
                {item.isCustom ? <Button label="이름 수정" variant="secondary" onPress={() => { setEditingId(item.id); setEditingName(item.name); }} style={styles.flex} /> : null}
                <Button label="제거" variant="tertiary" onPress={() => setRemoveTarget(item)} style={styles.flex} />
              </View>
            </>
          )}
        </Card>
      )) : <Text color={colors.neutral800}>아직 등록한 {labels[category]}가 없어요.</Text>}

      <Text variant="title2">장비 목록</Text>
      {filtered.map((item) => (
        <Card key={item.id}>
          <Text variant="title3">{item.name}</Text>
          <Text color={colors.neutral800}>{item.brand}</Text>
          <Button label="내 장비에 추가" variant="secondary" disabled={owned.some((ownedItem) => ownedItem.name === item.name)} onPress={() => void add(item)} />
        </Card>
      ))}

      <Card>
        <Text variant="title3">목록에 없나요?</Text>
        <Field label="장비 이름" value={customName} onChangeText={(value) => { setCustomName(value); setCustomError(''); }} placeholder="직접 입력해주세요" error={customError} />
        <Button label="직접 추가" onPress={() => {
          if (!customName.trim()) return setCustomError('장비 이름을 입력해주세요.');
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
  flex: { flex: 1 },
  gearHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.small },
  primary: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
});
