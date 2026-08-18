import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BottomActionBar, Button, Card, EmptyState, Icon, Screen, Text, TopBar } from '@/components/ui';
import { getBean, listCatalogGear, listCups, listUserGear, saveRecipe, startBrew, trackEvent } from '@/database/repository';
import { generateGuidedRecipe } from '@/domain/recipeEngine';
import type { BeanLot, Gear, Recipe } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

export default function GuidedRecipeScreen() {
  const { beanId } = useLocalSearchParams<{ beanId: string }>();
  const db = useSQLiteContext();
  const [bean, setBean] = useState<BeanLot | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [gear, setGear] = useState<Gear[]>([]);
  const [error, setError] = useState('');
  const [showWhy, setShowWhy] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!beanId) return;
    let active = true;
    Promise.all([getBean(db, beanId), listUserGear(db), listCatalogGear(db), listCups(db, { beanId })]).then(([nextBean, owned, catalog, cups]) => {
      if (!active || !nextBean) return;
      const selected = owned.length ? owned : catalog;
      const get = (category: Gear['category']) => selected.find((item) => item.category === category && item.isPrimary) ?? selected.find((item) => item.category === category) ?? null;
      try {
        const generated = generateGuidedRecipe({ bean: nextBean, grinder: get('grinder'), dripper: get('dripper'), filter: get('filter'), water: get('water'), previousCups: cups });
        setBean(nextBean); setGear(selected); setRecipe(generated);
        void trackEvent(db, 'recipe_viewed', { recipe_id: generated.id, type: 'guided' });
        void trackEvent(db, 'recipe_guided_created', { recipe_id: generated.id });
      } catch (caught) { setError(caught instanceof Error ? caught.message : '레시피를 계산하지 못했어요.'); }
    });
    return () => { active = false; };
  }, [beanId, db]));

  const begin = async () => {
    if (!bean || !recipe) return;
    await saveRecipe(db, recipe);
    const session = await startBrew(db, bean, recipe);
    router.replace(`/brew/${session.id}`);
  };

  if (error) return <Screen><EmptyState title="추천을 만들 수 없어요" body={error} action={<Button label="직접 레시피 만들기" onPress={() => router.replace(`/recipe/manual?beanId=${beanId}`)} />} /></Screen>;
  if (!bean || !recipe) return <Screen><View style={styles.loading}><Icon name="cup.and.saucer.fill" size={42} color={colors.taupe} /><Text variant="title3">오늘의 레시피를 준비하고 있어요</Text></View></Screen>;

  const headline = bean.roastLevel === 'unknown' ? '균형 잡힌 시작점으로 내려볼게요.' : bean.roastLevel === 'dark' ? '부드럽고 편안하게 내려볼게요.' : bean.process.toLowerCase().includes('natural') ? '달콤하고 풍성하게 내려볼게요.' : '밝고 향긋하게 내려볼게요.';
  const gearNames = ['grinder', 'dripper'].map((category) => gear.find((item) => item.category === category)?.name).filter(Boolean);

  return (
    <Screen contentContainerStyle={styles.screen} footer={<BottomActionBar primaryLabel="안내 시작하기" onPrimaryPress={() => void begin()} secondaryLabel="직접 조절" onSecondaryPress={() => router.push(`/recipe/manual?beanId=${bean.id}`)} />}>
      <TopBar title="오늘의 레시피" backLabel="원두" />

      <Pressable accessibilityRole="button" accessibilityLabel={`${bean.name} 원두 정보 보기`} onPress={() => router.push(`/bean/${bean.id}`)} style={styles.beanStrip}>
        <Image source={bean.imageUri ? { uri: bean.imageUri } : require('../../assets/visuals/bean-still-life.png')} style={styles.beanImage} resizeMode="cover" />
        <View style={styles.flex}><Text variant="title3" numberOfLines={1}>{bean.name}</Text><Text color={colors.neutral800}>{bean.tastingNotes.slice(0, 3).join(' · ') || [bean.country, bean.process].filter(Boolean).join(' · ')}</Text></View>
        <Icon name="chevron.right" size={17} color={colors.neutral400} />
      </Pressable>

      <View style={styles.intro}><Text variant="title1" accessibilityRole="header">{headline}</Text><Text variant="bodyLarge" color={colors.neutral800}>{recipe.grindTarget}로 갈고, {recipe.steps.filter((step) => step.waterDeltaMl > 0).length}번 나눠 부어요.</Text></View>

      <View style={styles.recipeVisual} accessible accessibilityLabel={`원두 ${recipe.doseG}그램, 물 ${recipe.waterMl}밀리리터, ${recipe.temperatureC}도, 총 ${Math.floor(recipe.totalTimeSec / 60)}분 ${recipe.totalTimeSec % 60}초`}>
        <Image source={require('../../assets/visuals/bloom-top.png')} style={styles.bloom} resizeMode="cover" accessible={false} />
        <Parameter style={styles.paramDose} value={`${recipe.doseG}g`} label="원두" icon="leaf.fill" />
        <Parameter style={styles.paramWater} value={`${recipe.waterMl}ml`} label="물" icon="drop.fill" align="right" />
        <Parameter style={styles.paramTemp} value={`${recipe.temperatureC}℃`} label="온도" icon="thermometer.medium" />
        <Parameter style={styles.paramTime} value={`${Math.floor(recipe.totalTimeSec / 60)}분 ${recipe.totalTimeSec % 60}초`} label="총 시간" icon="clock.fill" align="right" />
        <View style={styles.rings}>{recipe.steps.slice(0, 4).map((step, index) => <View key={step.id} style={[styles.ring, { width: 32 + index * 26, height: 32 + index * 26, borderRadius: 16 + index * 13 }]} />)}</View>
      </View>

      <View style={styles.timeline}>
        {recipe.steps.map((step, index) => <View key={step.id} style={styles.stepRow}>
          <View style={styles.stepRail}><View style={styles.stepNumber}><Text variant="label" color={colors.cream}>{index + 1}</Text></View>{index < recipe.steps.length - 1 ? <View style={styles.line} /> : null}</View>
          <View style={styles.stepCopy}><View style={styles.stepTitle}><Icon name={step.waterDeltaMl ? 'waterbottle.fill' : 'hourglass'} size={18} color={colors.cocoa} /><Text variant="title3" style={styles.flex}>{step.name}</Text><Text variant="label" color={colors.neutral800}>{step.waterDeltaMl ? `${step.waterDeltaMl}ml` : ''}{step.durationSec ? ` · ${step.durationSec}초` : ''}</Text></View><Text color={colors.neutral800}>{friendlyInstruction(step.instruction)}</Text></View>
        </View>)}
      </View>

      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showWhy }} onPress={() => setShowWhy((value) => !value)} style={styles.disclosure}>
        <View style={styles.helpIcon}><Icon name="questionmark" size={16} color={colors.espresso} weight="bold" /></View><Text variant="label" style={styles.flex}>왜 이 레시피인가요?</Text><Icon name={showWhy ? 'chevron.up' : 'chevron.down'} size={16} color={colors.neutral600} />
      </Pressable>
      {showWhy ? <Card tone="tinted"><Text color={colors.neutral800}>{recipe.explanation.join('\n\n')}</Text></Card> : null}

      <Pressable accessibilityRole="button" accessibilityLabel={`오늘 쓸 장비, ${gearNames.join(', ') || '기본 장비'}, 변경하기`} onPress={() => router.push('/gear')} style={styles.gearRow}><Icon name="dial.medium" size={21} color={colors.espresso} /><View style={styles.flex}><Text variant="label">오늘 쓸 장비</Text><Text variant="caption" color={colors.neutral600}>{gearNames.join(' · ') || '기본 장비'}</Text></View><Icon name="chevron.right" size={16} color={colors.neutral400} /></Pressable>

    </Screen>
  );
}

function Parameter({ value, label, icon, align = 'left', style }: { value: string; label: string; icon: Parameters<typeof Icon>[0]['name']; align?: 'left' | 'right'; style: object }) {
  return <View style={[styles.parameter, align === 'right' && styles.parameterRight, style]}><View style={styles.parameterLabel}><Icon name={icon} size={13} color={colors.neutral600} /><Text variant="caption" color={colors.neutral600}>{label}</Text></View><Text variant="title2">{value}</Text></View>;
}

function friendlyInstruction(value: string) {
  return value.replace(/pour/gi, '부어').replace(/bloom/gi, '뜸을 들여');
}

const styles = StyleSheet.create({
  screen: { gap: spacing.section },
  flex: { flex: 1 },
  loading: { flex: 1, minHeight: 500, alignItems: 'center', justifyContent: 'center', gap: spacing.default },
  beanStrip: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.compact, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, borderRadius: radius.large },
  beanImage: { width: 66, height: 66, borderRadius: radius.medium },
  intro: { alignItems: 'center', gap: spacing.compact },
  recipeVisual: { height: 330, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  bloom: { width: 218, height: 218, borderRadius: 109 },
  rings: { position: 'absolute', width: 126, height: 126, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,253,249,0.72)' },
  parameter: { position: 'absolute', minWidth: 82, gap: 2 },
  parameterRight: { alignItems: 'flex-end' },
  parameterLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paramDose: { left: 0, top: 26 },
  paramWater: { right: 0, top: 26 },
  paramTemp: { left: 0, bottom: 20 },
  paramTime: { right: 0, bottom: 20 },
  timeline: { gap: 0 },
  stepRow: { minHeight: 92, flexDirection: 'row', gap: spacing.small },
  stepRail: { width: 34, alignItems: 'center' },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.espresso, alignItems: 'center', justifyContent: 'center' },
  line: { width: 1.5, flex: 1, backgroundColor: colors.oat },
  stepCopy: { flex: 1, gap: 4, paddingBottom: spacing.default },
  stepTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  disclosure: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingHorizontal: spacing.small, borderRadius: radius.medium, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  helpIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  gearRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingVertical: spacing.compact, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
});
