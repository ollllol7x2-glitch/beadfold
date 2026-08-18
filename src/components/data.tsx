import { Image, StyleSheet, View } from 'react-native';
import type { BeanLot, Cup, Recipe } from '@/domain/types';
import { beanStateLabel, localizedFlavor, roastLevelLabel, satisfactionLabel } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';
import { Card, Icon, Text } from './ui';

const fallbackImage = require('../../assets/visuals/bean-still-life.png');

export function BeanSummary({ bean }: { bean: BeanLot }) {
  const remainingRatio = Math.max(0, Math.min(1, bean.initialWeightG ? bean.remainingWeightG / bean.initialWeightG : 0));
  const detail = [bean.process, bean.roastLevel === 'unknown' ? '' : roastLevelLabel[bean.roastLevel]].filter(Boolean).join(' · ');
  return (
    <Card accessibilityLabel={`${bean.name}. ${[bean.country, bean.region, detail].filter(Boolean).join(', ')}. 남은 원두 ${bean.remainingWeightG}그램. ${beanStateLabel[bean.state]}.`} style={styles.beanCard}>
      <View style={styles.beanRow}>
        <Image source={bean.imageUri ? { uri: bean.imageUri } : fallbackImage} resizeMode="cover" style={styles.beanImage} accessible={false} />
        <View style={styles.flex}>
          <View style={styles.row}><Text variant="title3" style={styles.flex}>{bean.name}</Text><Icon name="chevron.right" size={16} color={colors.neutral400} /></View>
          <Text variant="caption" color={colors.neutral600}>{[bean.country, bean.region].filter(Boolean).join(' · ') || bean.roaster || '직접 등록한 원두'}</Text>
          {detail ? <Text variant="label">{detail}</Text> : <Text variant="caption" color={colors.neutral600}>가공·로스팅 정보 미입력</Text>}
          <View style={styles.weightRow}><View style={styles.weightTrack}><View style={[styles.weightFill, { width: `${remainingRatio * 100}%` }]} /></View><Text variant="caption" color={colors.neutral600}>{bean.remainingWeightG}g</Text></View>
        </View>
      </View>
      {bean.tastingNotes.length ? <View style={styles.notes}><Icon name="sparkles" size={14} color={colors.cocoa} /><Text variant="caption" color={colors.cocoa}>{bean.tastingNotes.slice(0, 4).join(' · ')}</Text></View> : null}
    </Card>
  );
}

export function RecipeSummary({ recipe }: { recipe: Recipe }) {
  return (
    <Card accessibilityLabel={`${recipe.name}. 원두 ${recipe.doseG}그램, 물 ${recipe.waterMl}밀리리터, ${recipe.temperatureC}도, ${recipe.totalTimeSec}초.`} style={styles.recipeCard}>
      <View style={styles.recipeIcon}><Icon name={recipe.type === 'guided' ? 'wand.and.stars' : 'slider.horizontal.3'} size={26} color={colors.espresso} /></View>
      <View style={styles.flex}><View style={styles.row}><Text variant="title3" style={styles.flex}>{recipe.name}</Text><Icon name="chevron.right" size={16} color={colors.neutral400} /></View><Text variant="caption" color={colors.neutral600}>{recipe.type === 'guided' ? '추천 레시피' : '직접 만든 레시피'}</Text><View style={styles.recipeMetrics}><Metric icon="leaf.fill" value={`${recipe.doseG}g`} /><Metric icon="drop.fill" value={`${recipe.waterMl}ml`} /><Metric icon="thermometer.medium" value={`${recipe.temperatureC}°`} /><Metric icon="clock.fill" value={`${Math.floor(recipe.totalTimeSec / 60)}:${String(recipe.totalTimeSec % 60).padStart(2, '0')}`} /></View></View>
    </Card>
  );
}

export function CupSummary({ cup }: { cup: Cup }) {
  return (
    <Card accessibilityLabel={`${cup.beanName}. ${cup.kind === 'home' ? '홈 브루' : '카페'}. ${cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '평가 대기 중'}.`} style={styles.cupCard}>
      <Image source={cup.imageUri ? { uri: cup.imageUri } : fallbackImage} resizeMode="cover" style={styles.cupImage} accessible={false} />
      <View style={styles.flex}>
        <View style={styles.row}><Text variant="title3" style={styles.flex}>{cup.beanName}</Text><Icon name={cup.satisfaction === 'loved' ? 'heart.fill' : cup.satisfaction === 'good' ? 'face.smiling' : 'circle'} size={20} color={cup.satisfaction === 'loved' ? colors.action : colors.espresso} /></View>
        <Text variant="caption" color={colors.neutral600}>{new Date(cup.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {cup.kind === 'home' ? '홈 브루' : cup.cafeName || '카페'}</Text>
        {cup.recipeSnapshot ? <Text variant="caption">{cup.recipeSnapshot.doseG}g · {cup.recipeSnapshot.waterMl}ml · {cup.recipeSnapshot.temperatureC}℃</Text> : null}
        {cup.flavorTags.length ? <Text variant="caption" color={colors.cocoa}>{cup.flavorTags.slice(0, 3).map(localizedFlavor).join(' · ')}</Text> : null}
      </View>
    </Card>
  );
}

function Metric({ icon, value }: { icon: Parameters<typeof Icon>[0]['name']; value: string }) {
  return <View style={styles.metric}><Icon name={icon} size={13} color={colors.neutral600} /><Text variant="caption" color={colors.neutral600}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  beanCard: { padding: spacing.small },
  beanRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.small },
  beanImage: { width: 94, height: 112, borderRadius: radius.medium, backgroundColor: colors.creamDeep },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact, marginTop: spacing.compact },
  weightTrack: { height: 5, flex: 1, borderRadius: 3, backgroundColor: colors.neutral100, overflow: 'hidden' },
  weightFill: { height: 5, borderRadius: 3, backgroundColor: colors.espresso },
  notes: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: spacing.compact, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  recipeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  recipeIcon: { width: 58, height: 72, borderRadius: radius.medium, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  recipeMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact, marginTop: spacing.compact },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cupCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small },
  cupImage: { width: 76, height: 76, borderRadius: radius.medium, backgroundColor: colors.creamDeep },
});
