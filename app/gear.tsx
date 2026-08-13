import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Chip, Field, PageHeader, Screen, Text } from '@/components/ui';
import { addUserGear, listCatalogGear, listUserGear, setPrimaryGear } from '@/database/repository';
import type { Gear } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';

const categories: Gear['category'][] = ['grinder', 'dripper', 'filter', 'kettle', 'scale', 'water'];
const labels: Record<Gear['category'], string> = { grinder: '그라인더', dripper: '드리퍼', filter: '필터', kettle: '주전자', scale: '저울', water: '물' };

export default function GearScreen() {
  const db = useSQLiteContext();
  const [category, setCategory] = useState<Gear['category']>('grinder');
  const [catalog, setCatalog] = useState<Gear[]>([]);
  const [owned, setOwned] = useState<Gear[]>([]);
  const [customName, setCustomName] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => { const [nextCatalog, nextOwned] = await Promise.all([listCatalogGear(db), listUserGear(db)]); setCatalog(nextCatalog); setOwned(nextOwned); }, [db]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const add = async (gear: Gear, custom = false) => { await addUserGear(db, { category: gear.category, name: gear.name, brand: gear.brand, isPrimary: !owned.some((item) => item.category === gear.category), isCustom: custom, metadata: gear.metadata }); setMessage(`${gear.name}을(를) 내 장비에 추가했어요.`); await load(); };
  const filtered = catalog.filter((item) => item.category === category);
  const mine = owned.filter((item) => item.category === category);
  return <Screen>
    <PageHeader title="내 장비" description="주로 쓰는 장비는 추천 레시피에 반영돼요." backLabel="보관함" />
    {message ? <Text accessibilityRole="alert" color={colors.success}>{message}</Text> : null}
    <View style={styles.row}>{categories.map((item) => <Chip key={item} label={labels[item]} selected={category === item} onPress={() => setCategory(item)} />)}</View>
    <Text variant="title2">내가 쓰는 장비</Text>
    {mine.length ? mine.map((item) => <Card key={item.id}><Text variant="title3">{item.name}</Text><Text color={colors.neutral800}>{item.brand || '직접 등록'}{item.isPrimary ? ' · 주로 사용' : ''}</Text>{!item.isPrimary ? <Button label="주로 쓰는 장비로 지정" variant="secondary" onPress={async () => { await setPrimaryGear(db, item.id, item.category); setMessage(`${item.name}을(를) 주로 쓰는 장비로 지정했어요.`); await load(); }} /> : null}</Card>) : <Text color={colors.neutral800}>아직 등록한 {labels[category]}가 없어요.</Text>}
    <Text variant="title2">장비 목록</Text>
    {filtered.map((item) => <Card key={item.id}><Text variant="title3">{item.name}</Text><Text color={colors.neutral800}>{item.brand}</Text><Button label="내 장비에 추가" variant="secondary" disabled={owned.some((ownedItem) => ownedItem.name === item.name)} onPress={() => void add(item)} /></Card>)}
    <Card><Text variant="title3">목록에 없나요?</Text><Field label="장비 이름" value={customName} onChangeText={setCustomName} placeholder="직접 입력해주세요" /><Button label="직접 추가" onPress={() => { if (!customName.trim()) return setMessage('장비 이름을 입력해주세요.'); void add({ id: '', category, name: customName.trim(), brand: '', isPrimary: false, isCustom: true, metadata: {} }, true); setCustomName(''); }} /></Card>
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact } });
