import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { CupSummary, RecipeSummary } from '@/components/data';
import { Button, Card, EmptyState, PageHeader, Screen, Text } from '@/components/ui';
import { archiveBean, deleteBean, getBean, listCups, listRecipes } from '@/database/repository';
import type { BeanLot, Cup, Recipe } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';
import { ConfirmDialog } from '@/components/confirmDialog';

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [bean, setBean] = useState<BeanLot | null>(null);
  const [cups, setCups] = useState<Cup[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [confirmation, setConfirmation] = useState<'archive' | 'delete' | null>(null);

  useFocusEffect(useCallback(() => {
    if (!id) return;
    let active = true;
    Promise.all([getBean(db, id), listCups(db, { beanId: id }), listRecipes(db, id)]).then(([b, c, r]) => { if (active) { setBean(b); setCups(c); setRecipes(r); } });
    return () => { active = false; };
  }, [db, id]));

  if (!bean) return <Screen><EmptyState title="원두를 찾지 못했어요" body="이미 보관했거나 삭제한 원두일 수 있어요." action={<Button label="보관함으로 돌아가기" onPress={() => router.replace('/(tabs)/collection')} />} /></Screen>;

  const confirm = async () => { if (confirmation === 'archive') await archiveBean(db, bean.id); else if (confirmation === 'delete') await deleteBean(db, bean.id); else return; setConfirmation(null); router.replace('/(tabs)/collection'); };

  return (
    <Screen>
      <PageHeader title={bean.name} description={[bean.roaster, bean.country, bean.region].filter(Boolean).join(' · ') || '직접 등록한 원두'} backLabel="보관함" />
      <Card style={styles.hero}>
        <Text variant="label">{bean.process || '가공 방식 미입력'} · {roastLabel(bean.roastLevel)}</Text>
        <Text variant="title1">{bean.remainingWeightG}g</Text>
        <Text color={colors.neutral800}>처음 {bean.initialWeightG}g · {bean.state === 'finished' ? '다 마신 원두' : '마시는 중'}</Text>
        {bean.remainingWeightG < 30 && bean.state !== 'finished' ? <Text accessibilityRole="alert" color={colors.error}>원두가 약 2회분 이하로 남았어요.</Text> : null}
      </Card>
      <View style={styles.actions}><Button label="추천대로 내리기" onPress={() => router.push(`/recipe/guided?beanId=${bean.id}`)} style={styles.flex} /><Button label="직접 조절" variant="secondary" onPress={() => router.push(`/recipe/manual?beanId=${bean.id}`)} style={styles.flex} /></View>
      <Button label="원두 정보 수정" variant="secondary" onPress={() => router.push(`/add-bean?editId=${bean.id}`)} />
      <Card>
        <Text variant="title2">원두 정보</Text>
        <Detail label="산지" value={[bean.country, bean.region].filter(Boolean).join(', ')} />
        <Detail label="품종" value={bean.variety} /><Detail label="가공 방식" value={bean.process} /><Detail label="로스팅 날짜" value={bean.roastDate ?? ''} />
        <Detail label="봉투에 적힌 맛" value={bean.tastingNotes.join(', ')} /><Detail label="메모" value={bean.description} />
      </Card>
      <Text variant="title2">저장한 레시피</Text>
      {recipes.length ? recipes.map((recipe) => <RecipeSummary key={recipe.id} recipe={recipe} />) : <Text color={colors.neutral800}>아직 저장한 레시피가 없어요.</Text>}
      <View style={styles.section}><Text variant="title2">이 원두로 마신 커피</Text>{cups.length >= 2 ? <Button label="맛 비교" variant="secondary" onPress={() => router.push(`/compare?beanId=${bean.id}`)} /> : null}</View>
      {cups.length ? cups.slice(0, 4).map((cup) => <CupSummary key={cup.id} cup={cup} />) : <Text color={colors.neutral800}>첫 브루잉을 완료하면 경험이 여기에 남아요.</Text>}
      <Button label="원두 보관" variant="danger" onPress={() => setConfirmation('archive')} />
      <Button label="원두 영구 삭제" variant="tertiary" onPress={() => setConfirmation('delete')} />
      <ConfirmDialog visible={confirmation != null} title={confirmation === 'delete' ? '이 원두를 삭제할까요?' : '이 원두를 보관할까요?'} body={confirmation === 'delete' ? '원두 정보는 삭제하지만 이미 마신 커피 기록은 그대로 남아요.' : '지금 보관함 목록에서는 숨기지만, 이미 마신 커피 기록은 그대로 남아요.'} confirmLabel={confirmation === 'delete' ? '삭제' : '보관'} destructive onCancel={() => setConfirmation(null)} onConfirm={() => void confirm()} />
    </Screen>
  );
}

function Detail({ label, value }: { label: string; value: string }) { if (!value) return null; return <View style={styles.detail}><Text variant="label" style={styles.label}>{label}</Text><Text style={styles.flex}>{value}</Text></View>; }
function roastLabel(value: BeanLot['roastLevel']) { return ({ light: '약배전', 'medium-light': '중약배전', medium: '중배전', 'medium-dark': '중강배전', dark: '강배전' } as const)[value]; }
const styles = StyleSheet.create({ hero: { backgroundColor: colors.warmBeige }, actions: { flexDirection: 'row', gap: spacing.small }, flex: { flex: 1 }, detail: { flexDirection: 'row', gap: spacing.default, paddingVertical: spacing.compact, borderBottomWidth: 1, borderBottomColor: colors.neutral200 }, label: { width: 104 }, section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.small } });
