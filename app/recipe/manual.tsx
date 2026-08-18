import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomActionBar, BottomSheet, Button, Card, Chip, Field, goBackOrReplace, Icon, Screen, TaskHeader, Text } from '@/components/ui';
import { createManualRecipe, validateRecipe } from '@/domain/recipeEngine';
import type { BeanLot, Gear, Recipe } from '@/domain/types';
import { deleteRecipe, duplicateRecipe, getBean, getRecipe, listBeans, listUserGear, saveRecipe, startBrew } from '@/database/repository';
import { colors, spacing } from '@/design-system/tokens';
import { ConfirmDialog } from '@/components/confirmDialog';
import { useFeedback } from '@/components/feedback';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

type EquipmentField = 'grinder' | 'dripper' | 'filter' | 'waterProfile';
const equipmentFields: { key: EquipmentField; label: string; category: Gear['category'] }[] = [
  { key: 'grinder', label: '그라인더', category: 'grinder' },
  { key: 'dripper', label: '드리퍼', category: 'dripper' },
  { key: 'filter', label: '필터', category: 'filter' },
  { key: 'waterProfile', label: '물', category: 'water' },
];

export default function ManualRecipeScreen() {
  const { beanId, recipeId } = useLocalSearchParams<{ beanId?: string; recipeId?: string }>();
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [bean, setBean] = useState<BeanLot | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [baseline, setBaseline] = useState('');
  const [ownedGear, setOwnedGear] = useState<Gear[]>([]);
  const [pickerField, setPickerField] = useState<EquipmentField | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const [stored, beans, gear] = await Promise.all([recipeId ? getRecipe(db, recipeId) : null, listBeans(db), listUserGear(db)]);
      const targetBean = await getBean(db, beanId ?? stored?.beanId ?? '') ?? beans[0] ?? null;
      if (!active || !targetBean) return;
      const targetRecipe = stored ?? createManualRecipe(targetBean);
      setBean(targetBean); setRecipe(targetRecipe); setOwnedGear(gear); setBaseline(JSON.stringify(targetRecipe));
    })();
    return () => { active = false; };
  }, [beanId, db, recipeId]));

  const recipeSnapshot = recipe ? JSON.stringify(recipe) : '';
  const isDirty = Boolean(baseline && recipeSnapshot && baseline !== recipeSnapshot);
  const { requestExit, allowExit, exitConfirmation } = useUnsavedChangesGuard(isDirty);

  const recalc = (next: Recipe): Recipe => {
    const ratio = next.doseG > 0 ? Number((next.waterMl / next.doseG).toFixed(1)) : 0;
    const bloomWater = Math.min(next.waterMl, Math.max(30, Math.round((next.waterMl * 0.17) / 5) * 5));
    const remaining = next.waterMl - bloomWater;
    const first = Math.round((remaining * 0.48) / 5) * 5;
    const second = remaining - first;
    const durations = [next.bloomSec, Math.max(20, Math.round(next.totalTimeSec * 0.19)), Math.max(15, Math.round(next.totalTimeSec * 0.17)), Math.max(20, Math.round(next.totalTimeSec * 0.2))];
    const last = Math.max(1, next.totalTimeSec - durations.reduce((sum, duration) => sum + duration, 0));
    const waterDeltas = [bloomWater, first, 0, second, 0];
    let cumulative = 0;
    const names = ['뜸 들이기', '첫 번째 붓기', '잠시 기다리기', '마지막 붓기', '마무리 기다리기'];
    const actions = ['bloom', 'pour', 'wait', 'pour', 'wait'] as const;
    return { ...next, ratio, steps: names.map((name, index) => { cumulative += waterDeltas[index]!; return { id: `step-${index}`, order: index, action: actions[index]!, name, durationSec: [...durations, last][index]!, waterDeltaMl: waterDeltas[index]!, waterTotalMl: cumulative, instruction: waterDeltas[index] ? `${cumulative}ml까지 부어주세요.` : '물이 고르게 내려가도록 기다려주세요.' }; }) };
  };

  const updateNumber = (key: 'doseG' | 'waterMl' | 'temperatureC' | 'bloomSec' | 'totalTimeSec', value: string) => {
    if (!recipe) return;
    const number = Number(value);
    setRecipe(recalc({ ...recipe, [key]: Number.isFinite(number) ? number : 0, updatedAt: new Date().toISOString() }));
  };
  const updateText = (key: keyof Pick<Recipe, 'name' | 'grindTarget' | 'grinder' | 'dripper' | 'filter' | 'waterProfile'>, value: string) => recipe && setRecipe({ ...recipe, [key]: value, updatedAt: new Date().toISOString() });
  const updateStep = (index: number, key: 'durationSec' | 'waterDeltaMl', value: string) => {
    if (!recipe) return;
    const number = Math.max(0, Math.round(Number(value) || 0));
    const steps = recipe.steps.map((step, stepIndex) => stepIndex === index ? { ...step, [key]: number } : { ...step });
    let cumulative = 0;
    for (const step of steps) {
      cumulative += step.waterDeltaMl;
      step.waterTotalMl = cumulative;
      step.instruction = step.waterDeltaMl ? `${cumulative}ml까지 부어주세요.` : '물이 고르게 내려가도록 기다려주세요.';
    }
    setRecipe({
      ...recipe,
      steps,
      waterMl: steps.reduce((sum, step) => sum + step.waterDeltaMl, 0),
      totalTimeSec: steps.reduce((sum, step) => sum + step.durationSec, 0),
      bloomSec: steps[0]?.durationSec ?? recipe.bloomSec,
      updatedAt: new Date().toISOString(),
    });
  };
  const validation = useMemo(() => recipe ? validateRecipe(recipe) : [], [recipe]);
  const selectedEquipment = equipmentFields.find((field) => field.key === pickerField);
  const pickerOptions = selectedEquipment ? [...new Set(ownedGear.filter((item) => item.category === selectedEquipment.category).map((item) => item.name))] : [];

  const save = async () => { if (!recipe) return; if (validation.length) return setErrors(validation); await saveRecipe(db, recipe); setErrors([]); setBaseline(JSON.stringify(recipe)); setSaved(true); };
  const brew = async () => { if (!recipe || !bean) return; if (validation.length) return setErrors(validation); await saveRecipe(db, recipe); allowExit(); const session = await startBrew(db, bean, recipe); router.replace(`/brew/${session.id}`); };
  const remove = async () => { if (!recipe) return; await deleteRecipe(db, recipe.id); setConfirmDelete(false); showFeedback('레시피를 삭제했어요.'); allowExit(); goBackOrReplace(bean ? `/bean/${bean.id}` : '/(tabs)/collection'); };

  if (!bean || !recipe) return <Screen><Text>직접 레시피를 만들려면 먼저 원두를 골라주세요.</Text><Button label="원두 추가" onPress={() => router.replace('/add-bean')} /></Screen>;

  return (
    <Screen showNavigation={false} header={<TaskHeader title="내 방식으로 내리기" onClose={() => requestExit(() => goBackOrReplace(`/bean/${bean.id}`))} />} footer={<BottomActionBar primaryLabel="이 레시피로 브루잉" primaryDisabled={Boolean(validation.length)} onPrimaryPress={() => void brew()} secondaryLabel="저장" onSecondaryPress={() => void save()} />}>
      {errors.length ? <Card style={styles.error}>{errors.map((error) => <Text key={error} accessibilityRole="alert" color={colors.error}>오류: {error}</Text>)}</Card> : null}
      {saved ? <Text accessibilityRole="alert" color={colors.neutral800}>저장했어요. 다음에도 이 레시피를 사용할 수 있어요.</Text> : null}
      <Field label="레시피 이름" value={recipe.name} onChangeText={(value) => updateText('name', value)} />
      <Text variant="label">추출 방식</Text><View style={styles.chips}><Chip label="따뜻하게" selected={recipe.hotIce === 'hot'} onPress={() => setRecipe({ ...recipe, hotIce: 'hot' })} /><Chip label="차갑게" selected={recipe.hotIce === 'ice'} onPress={() => setRecipe({ ...recipe, hotIce: 'ice' })} /></View>
      <View style={styles.grid}><View style={styles.flex}><Field label="원두 (g)" value={String(recipe.doseG)} onChangeText={(value) => updateNumber('doseG', value)} keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="물 (ml)" value={String(recipe.waterMl)} onChangeText={(value) => updateNumber('waterMl', value)} keyboardType="decimal-pad" /></View></View>
      <View style={styles.grid}><View style={styles.flex}><Field label="온도 (℃)" value={String(recipe.temperatureC)} onChangeText={(value) => updateNumber('temperatureC', value)} keyboardType="decimal-pad" /></View><View style={styles.flex}><Field label="총 시간 (초)" value={String(recipe.totalTimeSec)} onChangeText={(value) => updateNumber('totalTimeSec', value)} keyboardType="number-pad" /></View></View>
      <Field label="뜸 시간 (초)" value={String(recipe.bloomSec)} onChangeText={(value) => updateNumber('bloomSec', value)} keyboardType="number-pad" />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((value) => !value)} style={styles.disclosure}><View style={styles.flex}><Text variant="title3">장비와 세부 단계 조절</Text><Text color={colors.neutral800}>분쇄도, 장비, 붓는 순서를 직접 바꿀 수 있어요.</Text></View><Icon name={detailsOpen ? 'chevron.up' : 'chevron.down'} /></Pressable>
      {detailsOpen ? <View style={styles.details}><Field label="분쇄도" value={recipe.grindTarget} onChangeText={(value) => updateText('grindTarget', value)} />{equipmentFields.map((field) => <EquipmentSelect key={field.key} label={field.label} value={recipe[field.key]} options={[...new Set(ownedGear.filter((item) => item.category === field.category).map((item) => item.name))]} onOpen={() => setPickerField(field.key)} onChange={(value) => updateText(field.key, value)} />)}<Card><Text variant="title3">붓는 순서 직접 편집</Text><Text color={colors.neutral800}>시간과 물양을 바꾸면 총 시간과 전체 물량도 함께 갱신돼요.</Text>{recipe.steps.map((step, index) => <View key={step.id} style={styles.step}><Text variant="label">{step.order + 1}. {step.name} · 누적 {step.waterTotalMl}ml</Text><View style={styles.grid}><View style={styles.flex}><Field label="시간 (초)" value={String(step.durationSec)} onChangeText={(value) => updateStep(index, 'durationSec', value)} keyboardType="number-pad" /></View><View style={styles.flex}><Field label="물양 (ml)" value={String(step.waterDeltaMl)} onChangeText={(value) => updateStep(index, 'waterDeltaMl', value)} keyboardType="number-pad" /></View></View></View>)}</Card>{recipeId ? <Button label="복제" variant="secondary" onPress={async () => { const copy = await duplicateRecipe(db, recipe); allowExit(); showFeedback('레시피 복사본을 만들었어요.'); router.replace(`/recipe/manual?recipeId=${copy.id}`); }} /> : null}{recipeId ? <Button label="삭제" variant="danger" onPress={() => setConfirmDelete(true)} /> : null}</View> : null}
      <ConfirmDialog visible={confirmDelete} title="레시피를 삭제할까요?" body="이미 기록한 커피는 그대로 남아요." confirmLabel="삭제" destructive onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove()} />
      <BottomSheet visible={pickerField != null} title={selectedEquipment ? `${selectedEquipment.label} 선택` : '장비 선택'} onClose={() => setPickerField(null)}><View style={styles.optionList}>{pickerOptions.map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: recipe[selectedEquipment!.key] === option }} onPress={() => { updateText(selectedEquipment!.key, option); setPickerField(null); }} style={styles.option}><Text variant="title3">{option}</Text>{recipe[selectedEquipment!.key] === option ? <Icon name="checkmark" size={19} color={colors.espresso} /> : null}</Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel="기타 직접 입력" onPress={() => { updateText(selectedEquipment!.key, ''); setPickerField(null); }} style={styles.option}><Text variant="title3">기타</Text><Text variant="caption" color={colors.neutral600}>직접 입력</Text></Pressable></View></BottomSheet>
      {exitConfirmation}
    </Screen>
  );
}

function EquipmentSelect({ label, value, options, onOpen, onChange }: { label: string; value: string; options: string[]; onOpen: () => void; onChange: (value: string) => void }) {
  const custom = !options.includes(value);
  return <View style={styles.equipmentField}><Text variant="label">{label}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${label} 선택. ${custom ? '기타' : value}`} onPress={onOpen} style={styles.equipmentSelect}><Text style={styles.flex} numberOfLines={1}>{custom ? '기타' : value}</Text><Icon name="chevron.down" size={18} color={colors.neutral600} /></Pressable>{custom ? <Field label={`${label} 직접 입력`} value={value} onChangeText={onChange} placeholder={`${label} 이름을 입력해주세요`} /> : null}</View>;
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', gap: spacing.small }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, flex: { flex: 1 }, error: { borderColor: colors.error }, disclosure: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderRadius: 16, borderWidth: 1, borderColor: colors.neutral200, backgroundColor: colors.white }, details: { gap: spacing.default }, equipmentField: { gap: spacing.compact }, equipmentSelect: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: 15, paddingVertical: 13, borderWidth: 1, borderColor: colors.neutral200, borderRadius: 16, backgroundColor: colors.white }, optionList: { gap: spacing.compact, paddingBottom: spacing.small }, option: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small, paddingHorizontal: spacing.small, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 }, step: { borderTopWidth: 1, borderTopColor: colors.neutral200, paddingTop: spacing.small, gap: spacing.compact } });
