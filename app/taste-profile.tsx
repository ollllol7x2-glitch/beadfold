import { useCallback, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, Icon, PageHeader, Screen, Text, type SymbolName } from '@/components/ui';
import { listCups, trackEvent } from '@/database/repository';
import { calculateTasteProfile } from '@/domain/tasteProfile';
import {
  localizedFlavor,
  roastLevelLabel,
  type RoastLevel,
  type TasteAverage,
  type TasteDimension,
  type TasteProfile,
  type TasteValues,
} from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

const flavorColors = [colors.berry, colors.apricot, colors.sage, colors.teal, colors.blue] as const;
const tasteAxisMeta: { key: keyof TasteValues; label: string; color: string }[] = [
  { key: 'acidity', label: '산미', color: colors.berry },
  { key: 'sweetness', label: '단맛', color: colors.apricot },
  { key: 'body', label: '질감', color: colors.sage },
  { key: 'bitterness', label: '쓴맛', color: colors.plum },
  { key: 'aroma', label: '향', color: colors.teal },
  { key: 'aftertaste', label: '여운', color: colors.blue },
  { key: 'balance', label: '균형', color: colors.cocoa },
];

const radarSize = 248;
const radarCenter = radarSize / 2;
const radarRadius = 74;
const radarLabelRadius = 106;

type Point = { x: number; y: number };

export default function TasteProfileScreen() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<TasteProfile>(calculateTasteProfile([]));

  useFocusEffect(useCallback(() => {
    let active = true;
    void trackEvent(db, 'taste_profile_viewed');
    void listCups(db).then((cups) => {
      if (active) setProfile(calculateTasteProfile(cups));
    });
    return () => { active = false; };
  }, [db]));

  return (
    <Screen header={<PageHeader title="나의 커피 취향" backLabel="프로필" backHref="/(tabs)/profile" />} contentContainerStyle={styles.screen}>
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroBerry} />
        <View pointerEvents="none" style={styles.heroApricot} />
        <View style={styles.heroContent}>
          <View style={styles.heroHeading}>
            <View style={styles.heroIcon}><Icon name="heart.fill" size={24} color={colors.berry} /></View>
            <Text variant="caption" color={colors.warmBeige}>요즘의 취향</Text>
          </View>
          <Text variant="title1" color={colors.cream}>{profile.insight}</Text>
          <View style={styles.heroMetrics}>
            <HeroMetric label="맛 기록" value={`${profile.ratedCupCount}잔`} />
            <View style={styles.metricDivider} />
            <HeroMetric label="평균 만족도" value={profile.averageScore == null ? '기록 전' : `${profile.averageScore} / 3`} />
          </View>
        </View>
      </View>

      <TasteRadar items={profile.tasteAverages} />
      <FlavorSpectrum items={profile.topFlavors} />

      <View style={styles.trend}>
        <View style={styles.trendIcon}><Icon name="arrow.triangle.2.circlepath" size={21} color={colors.teal} /></View>
        <View style={styles.flex}>
          <Text variant="label" color={colors.teal}>최근 변화</Text>
          <Text variant="title3">{profile.recentTrend}</Text>
        </View>
      </View>

      {profile.ratedCupCount < 3 ? (
        <Card style={styles.growingCard}>
          <Text variant="title3">취향 지도가 만들어지는 중이에요</Text>
          <Text color={colors.neutral800}>세 잔부터 반복되는 취향을 살펴봐요. 지금은 결론을 서두르지 않을게요.</Text>
          <View style={styles.progressSteps} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 3, now: profile.ratedCupCount }} accessibilityLabel={`취향 분석까지 ${profile.ratedCupCount}잔 기록`}>
            {[0, 1, 2].map((index) => <View key={index} style={[styles.progressStep, index < profile.ratedCupCount && styles.progressStepDone]} />)}
          </View>
        </Card>
      ) : null}

      <DimensionChart title="잘 맞았던 산지" icon="globe.asia.australia.fill" items={profile.topOrigins} color={colors.sage} tint={colors.sageWash} />
      <DimensionChart title="잘 맞았던 가공법" icon="leaf.fill" items={profile.topProcesses} color={colors.teal} tint={colors.tealWash} />
      <DimensionChart title="잘 맞았던 로스팅" icon="flame.fill" items={profile.topRoasts} color={colors.apricot} tint={colors.apricotWash} localizeRoast />
    </Screen>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return <View style={styles.heroMetric}><Text variant="caption" color={colors.warmBeige}>{label}</Text><Text variant="title2" color={colors.cream}>{value}</Text></View>;
}

function TasteRadar({ items }: { items: TasteAverage[] }) {
  const values = new Map(items.map((item) => [item.key, item]));
  const outerPoints = tasteAxisMeta.map((_, index) => radarPoint(index, radarRadius));
  const dataPoints = tasteAxisMeta.map((axis, index) => radarPoint(index, radarRadius * ((values.get(axis.key)?.value ?? 0) / 5)));
  const summary = tasteAxisMeta
    .map((axis) => values.get(axis.key) ? `${axis.label} ${values.get(axis.key)!.value}점` : null)
    .filter(Boolean)
    .join(', ');

  return (
    <Card style={styles.radarCard}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.blueWash }]}><Icon name="slider.horizontal.3" size={20} color={colors.blue} /></View>
        <View style={styles.flex}>
          <Text variant="title2">나의 맛 모양</Text>
          <Text color={colors.neutral800}>자세히 남긴 맛 점수의 평균이에요.</Text>
        </View>
      </View>
      {items.length >= 3 ? (
        <View accessible accessibilityRole="image" accessibilityLabel={`방사형 취향 그래프. ${summary}`} style={styles.radar}>
          {[0.25, 0.5, 0.75, 1].flatMap((scale) => outerPoints.map((_, index) => {
            const from = radarPoint(index, radarRadius * scale);
            const to = radarPoint((index + 1) % tasteAxisMeta.length, radarRadius * scale);
            return <ChartLine key={`ring-${scale}-${index}`} from={from} to={to} color={colors.neutral200} />;
          }))}
          {outerPoints.map((point, index) => <ChartLine key={`axis-${index}`} from={{ x: radarCenter, y: radarCenter }} to={point} color={colors.neutral200} />)}
          {dataPoints.map((point, index) => <ChartLine key={`data-${index}`} from={point} to={dataPoints[(index + 1) % dataPoints.length]!} color={tasteAxisMeta[index]!.color} thickness={3} />)}
          {dataPoints.map((point, index) => values.has(tasteAxisMeta[index]!.key) ? <View key={`point-${index}`} style={[styles.radarPoint, { left: point.x - 5, top: point.y - 5, backgroundColor: tasteAxisMeta[index]!.color }]} /> : null)}
          {tasteAxisMeta.map((axis, index) => {
            const labelPoint = radarPoint(index, radarLabelRadius);
            return <Text key={axis.key} variant="caption" color={values.has(axis.key) ? colors.charcoal : colors.neutral400} style={[styles.radarLabel, { left: labelPoint.x - 28, top: labelPoint.y - 9 }]}>{axis.label}</Text>;
          })}
        </View>
      ) : <ChartEmpty body="세부 맛을 세 가지 이상 기록하면 방사형으로 취향의 모양이 그려져요." color={colors.blue} />}
      <View style={styles.radarLegend}>
        {tasteAxisMeta.map((axis) => <View key={axis.key} style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: axis.color }]} /><Text variant="caption" color={colors.neutral800}>{axis.label}</Text></View>)}
      </View>
    </Card>
  );
}

function ChartLine({ from, to, color, thickness = 1 }: { from: Point; to: Point; color: string; thickness?: number }) {
  const width = Math.hypot(to.x - from.x, to.y - from.y);
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
  return <View pointerEvents="none" style={{ position: 'absolute', left: (from.x + to.x) / 2 - width / 2, top: (from.y + to.y) / 2 - thickness / 2, width, height: thickness, borderRadius: thickness, backgroundColor: color, transform: [{ rotate: `${angle}deg` }] }} />;
}

function radarPoint(index: number, radius: number): Point {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / tasteAxisMeta.length;
  return { x: radarCenter + Math.cos(angle) * radius, y: radarCenter + Math.sin(angle) * radius };
}

function FlavorSpectrum({ items }: { items: TasteDimension[] }) {
  const maxCount = Math.max(1, ...items.map((item) => item.count));
  return (
    <Card style={styles.flavorCard}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.berryWash }]}><Icon name="sparkles" size={20} color={colors.berry} /></View>
        <View style={styles.flex}>
          <Text variant="title2">좋아한 맛의 스펙트럼</Text>
          <Text color={colors.neutral800}>길이는 만족도와 기록 빈도를 함께 반영해요.</Text>
        </View>
      </View>
      {items.length ? <View accessible accessibilityRole="image" accessibilityLabel={`좋아한 맛 그래프. ${items.map((item) => `${localizedFlavor(item.label)} ${item.count}회`).join(', ')}`} style={styles.spectrum}>
        {items.map((item, index) => {
          const width = Math.max(14, Math.round(((item.score / 3) * 0.68 + (item.count / maxCount) * 0.32) * 100));
          return (
            <View key={item.label} style={styles.spectrumRow}>
              <View style={styles.barHeading}><Text variant="label">{localizedFlavor(item.label)}</Text><Text variant="caption" color={colors.neutral600}>{item.count}회 / 평균 {item.score}</Text></View>
              <View style={styles.barTrack}><View style={[styles.barFill, { width: `${width}%` as ViewStyle['width'], backgroundColor: flavorColors[index % flavorColors.length] }]} /></View>
            </View>
          );
        })}
      </View> : <ChartEmpty body="맛을 기록하면 좋아한 향미가 색으로 쌓여요." color={colors.berry} />}
    </Card>
  );
}

function DimensionChart({ title, items, icon, color, tint, localizeRoast = false }: { title: string; items: TasteDimension[]; icon: SymbolName; color: string; tint: string; localizeRoast?: boolean }) {
  const maxCount = Math.max(1, ...items.map((item) => item.count));
  return (
    <Card style={{ ...styles.dimensionCard, backgroundColor: tint, borderColor: tint }}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionIcon, { backgroundColor: colors.white }]}><Icon name={icon} size={20} color={color} /></View>
        <Text variant="title2" style={styles.flex}>{title}</Text>
      </View>
      {items.length ? <View accessible accessibilityRole="image" accessibilityLabel={`${title} 그래프. ${items.map((item) => dimensionLabel(item, localizeRoast)).join(', ')}`} style={styles.dimensionBars}>
        {items.map((item, index) => {
          const label = dimensionLabel(item, localizeRoast);
          const width = Math.max(12, Math.round(((item.count / maxCount) * 0.62 + (item.score / 3) * 0.38) * 100));
          return (
            <View key={item.label} style={styles.dimensionRow}>
              <View style={styles.dimensionCopy}><Text variant="label" numberOfLines={1} style={styles.flex}>{label}</Text><Text variant="caption" color={colors.neutral600}>{item.count}회</Text></View>
              <View style={styles.dimensionTrack}><View style={[styles.dimensionFill, { width: `${width}%` as ViewStyle['width'], backgroundColor: color, opacity: 1 - index * 0.11 }]} /></View>
            </View>
          );
        })}
      </View> : <ChartEmpty body="기록이 쌓이면 순위와 강도를 함께 보여드려요." color={color} />}
    </Card>
  );
}

function dimensionLabel(item: TasteDimension, localizeRoast: boolean) {
  return localizeRoast ? roastLevelLabel[item.label as RoastLevel] : item.label;
}

function ChartEmpty({ body, color }: { body: string; color: string }) {
  return (
    <View style={styles.chartEmpty}>
      <View style={styles.emptyBars}>
        {[0.38, 0.62, 0.48, 0.82, 0.56].map((width, index) => <View key={index} style={[styles.emptyBar, { width: `${Math.round(width * 100)}%` as ViewStyle['width'], backgroundColor: color, opacity: 0.16 + index * 0.05 }]} />)}
      </View>
      <Text color={colors.neutral800}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.section },
  flex: { flex: 1 },
  hero: { minHeight: 290, overflow: 'hidden', justifyContent: 'center', borderRadius: radius.xl, backgroundColor: colors.espresso },
  heroBerry: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -78, top: -70, backgroundColor: colors.berry, opacity: 0.8 },
  heroApricot: { position: 'absolute', width: 120, height: 120, borderRadius: 60, right: 20, bottom: -72, backgroundColor: colors.apricot, opacity: 0.85 },
  heroContent: { gap: spacing.default, padding: spacing.section },
  heroHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  heroIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.berryWash },
  heroMetrics: { flexDirection: 'row', alignItems: 'stretch', marginTop: spacing.compact, padding: spacing.default, borderRadius: radius.large, backgroundColor: 'rgba(255,253,249,0.10)' },
  heroMetric: { flex: 1, gap: 2 },
  metricDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: spacing.default, backgroundColor: 'rgba(255,253,249,0.25)' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  sectionIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  radarCard: { gap: spacing.roomy },
  radar: { width: radarSize, height: radarSize, alignSelf: 'center', position: 'relative' },
  radarPoint: { position: 'absolute', width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.white },
  radarLabel: { position: 'absolute', width: 56, textAlign: 'center' },
  radarLegend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.compact },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendSwatch: { width: 9, height: 9, borderRadius: 3 },
  flavorCard: { gap: spacing.roomy },
  spectrum: { gap: spacing.default },
  spectrumRow: { gap: 7 },
  barHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.compact },
  barTrack: { height: 11, overflow: 'hidden', borderRadius: radius.full, backgroundColor: colors.neutral100 },
  barFill: { height: '100%', borderRadius: radius.full },
  trend: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.default, borderRadius: radius.large, backgroundColor: colors.tealWash },
  trendIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  growingCard: { backgroundColor: colors.apricotWash, borderColor: colors.apricotWash },
  progressSteps: { flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  progressStep: { flex: 1, height: 6, borderRadius: radius.full, backgroundColor: 'rgba(210,135,66,0.22)' },
  progressStepDone: { backgroundColor: colors.apricot },
  dimensionCard: { gap: spacing.roomy },
  dimensionBars: { gap: spacing.default },
  dimensionRow: { gap: 7 },
  dimensionCopy: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  dimensionTrack: { height: 8, overflow: 'hidden', borderRadius: radius.full, backgroundColor: 'rgba(255,253,249,0.74)' },
  dimensionFill: { height: '100%', borderRadius: radius.full },
  chartEmpty: { gap: spacing.default, paddingTop: spacing.xs },
  emptyBars: { gap: 7 },
  emptyBar: { height: 8, borderRadius: radius.full },
});
