import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { PageHeader, Screen, Text } from '@/components/ui';
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

const tasteAxisMeta: { key: keyof TasteValues; label: string }[] = [
  { key: 'acidity', label: '산미' },
  { key: 'sweetness', label: '단맛' },
  { key: 'body', label: '질감' },
  { key: 'bitterness', label: '쓴맛' },
  { key: 'aroma', label: '향' },
  { key: 'aftertaste', label: '여운' },
  { key: 'balance', label: '균형' },
];

const glyphSize = 340;
const glyphCenter = glyphSize / 2;

const previewTasteProfile: TasteProfile = {
  cupCount: 18,
  ratedCupCount: 16,
  averageScore: 2.63,
  insight: '과일처럼 맑고, 산미가 선명한 커피를 좋아해요.',
  recentTrend: '최근에는 가볍고 투명한 질감의 커피에서 만족도가 높아졌어요.',
  tasteAverages: [
    { key: 'acidity', value: 4.4, count: 16 },
    { key: 'sweetness', value: 3.8, count: 15 },
    { key: 'body', value: 2.6, count: 14 },
    { key: 'bitterness', value: 1.7, count: 13 },
    { key: 'aroma', value: 4.1, count: 16 },
    { key: 'aftertaste', value: 4.3, count: 15 },
    { key: 'balance', value: 3.9, count: 16 },
  ],
  topFlavors: [
    { label: 'Fruity', count: 11, score: 2.82 },
    { label: 'Juicy', count: 9, score: 2.78 },
    { label: 'Floral', count: 7, score: 2.71 },
    { label: 'Clean', count: 6, score: 2.67 },
  ],
  topOrigins: [{ label: 'Ethiopia', count: 8, score: 2.75 }],
  topProcesses: [{ label: 'Washed', count: 10, score: 2.76 }],
  topRoasts: [{ label: 'light', count: 12, score: 2.74 }],
};

const emptyPreviewTasteProfile = calculateTasteProfile([]);

type Point = { x: number; y: number };

export default function TasteProfileScreen() {
  const db = useSQLiteContext();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const [profile, setProfile] = useState<TasteProfile>(calculateTasteProfile([]));

  useFocusEffect(useCallback(() => {
    let active = true;
    void trackEvent(db, 'taste_profile_viewed');
    void listCups(db).then((cups) => {
      if (active) setProfile(calculateTasteProfile(cups));
    });
    return () => { active = false; };
  }, [db]));

  const shownProfile = preview === '1' ? previewTasteProfile : preview === 'empty' ? emptyPreviewTasteProfile : profile;

  return (
    <Screen header={<PageHeader title="나의 커피 취향" backLabel="마이페이지" backHref="/(tabs)/profile" />} contentContainerStyle={styles.screen}>
      <TastePoster profile={shownProfile} />
      <PreferenceAnnotations
        origins={shownProfile.topOrigins}
        processes={shownProfile.topProcesses}
        roasts={shownProfile.topRoasts}
        recentTrend={shownProfile.recentTrend}
      />
    </Screen>
  );
}

function TastePoster({ profile }: { profile: TasteProfile }) {
  const values = new Map(profile.tasteAverages.map((item) => [item.key, item]));
  const summary = tasteAxisMeta
    .map((axis) => values.get(axis.key) ? `${axis.label} ${values.get(axis.key)!.value}점` : null)
    .filter(Boolean)
    .join(', ');
  const averageCount = profile.tasteAverages.length
    ? profile.tasteAverages.reduce((total, item) => total + item.count, 0) / profile.tasteAverages.length
    : 0;
  const layerCount = Math.max(1, Math.min(4, Math.ceil(averageCount / 4)));
  const headline = profile.ratedCupCount > 0
    ? profile.insight.replace(' 커피를 ', '\n커피를 ')
    : '첫 한 잔부터\n취향을 그려보세요.';
  const satisfactionOutOfFive = profile.averageScore == null ? '-' : ((profile.averageScore / 3) * 5).toFixed(1);

  return (
    <View style={styles.poster}>
      <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 360 620" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="poster-background" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.actionPressed} />
            <Stop offset="0.72" stopColor={colors.action} />
            <Stop offset="1" stopColor="#8C2858" />
          </LinearGradient>
        </Defs>
        <Path d="M 0 0 H 360 V 620 H 0 Z" fill="url(#poster-background)" />
        <Path d="M -20 490 C 62 414 104 558 208 472 C 288 406 330 428 386 358 L 386 640 L -20 640 Z" fill={colors.white} fillOpacity={0.055} />
        <Path d="M 220 -24 C 308 48 300 132 382 184 L 382 -24 Z" fill={colors.terracotta} fillOpacity={0.1} />
      </Svg>

      <View style={styles.posterMasthead}>
        <Text variant="caption" color="rgba(255,255,255,0.72)">BEANFOLD / TASTE PORTRAIT / 2026</Text>
        <Text variant="caption" color="rgba(255,255,255,0.72)">{String(profile.ratedCupCount).padStart(2, '0')} CUPS</Text>
      </View>

      <View style={styles.posterHeadline}>
        <Text variant="label" color={colors.terracotta}>요즘의 취향</Text>
        <Text variant="title1" color={colors.white}>{headline}</Text>
      </View>

      <TasteGlyph items={profile.tasteAverages} layerCount={layerCount} summary={summary} />

      <View style={styles.posterTags}>
        <Text variant="caption" color="rgba(255,255,255,0.62)">REPEATED FLAVORS</Text>
        <View style={styles.tagRow}>
          {profile.topFlavors.slice(0, 4).map((item, index) => (
            <View key={item.label} style={[styles.flavorTag, index === 0 && styles.flavorTagPrimary]}>
              <Text variant="label" color={index === 0 ? colors.actionPressed : colors.white}>#{localizedFlavor(item.label)}</Text>
            </View>
          ))}
          {!profile.topFlavors.length ? <Text color="rgba(255,255,255,0.72)">향미 기록을 기다리고 있어요.</Text> : null}
        </View>
      </View>

      <View style={styles.posterMetrics}>
        <View style={styles.posterMetric}>
          <Text style={styles.posterMetricNumber} color={colors.white}>{profile.ratedCupCount}</Text>
          <Text variant="caption" color="rgba(255,255,255,0.62)">CUPS RECORDED</Text>
        </View>
        <View style={styles.posterMetricDivider} />
        <View style={styles.posterMetric}>
          <Text style={styles.posterMetricNumber} color={colors.white}>{satisfactionOutOfFive}</Text>
          <Text variant="caption" color="rgba(255,255,255,0.62)">SATISFACTION / 5</Text>
        </View>
      </View>
    </View>
  );
}

function TasteGlyph({ items, layerCount, summary }: { items: TasteAverage[]; layerCount: number; summary: string }) {
  const values = new Map(items.map((item) => [item.key, item]));
  const actualPoints = tasteGlyphPoints(values, 1);
  const guidePoints = tasteGlyphGuidePoints();
  const accessibleLabel = items.length >= 3 ? `일곱 감각으로 만든 취향 지문. ${summary}` : '아직 완성되지 않은 취향 지문';

  if (!items.length) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={accessibleLabel} style={styles.glyph}>
        <Svg width={glyphSize} height={glyphSize} viewBox={`0 0 ${glyphSize} ${glyphSize}`} style={StyleSheet.absoluteFill}>
          {[64, 92, 120].map((circleRadius, index) => <Circle key={circleRadius} cx={glyphCenter} cy={glyphCenter} r={circleRadius} fill={index === 0 ? colors.white : 'none'} fillOpacity={0.025} stroke={colors.white} strokeOpacity={0.12 + index * 0.05} strokeWidth={1} strokeDasharray={index === 2 ? '3 8' : undefined} />)}
        </Svg>
        <View pointerEvents="none" style={styles.emptyGlyphCopy}>
          <Text variant="label" color={colors.white}>YOUR TASTE</Text>
          <Text variant="caption" color="rgba(255,255,255,0.58)">첫 기록을 기다리고 있어요</Text>
        </View>
      </View>
    );
  }

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibleLabel} style={styles.glyph}>
      <Svg width={glyphSize} height={glyphSize} viewBox={`0 0 ${glyphSize} ${glyphSize}`} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="glyph-fill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.white} stopOpacity="0.82" />
            <Stop offset="0.56" stopColor={colors.terracotta} stopOpacity="0.78" />
            <Stop offset="1" stopColor={colors.terracotta} stopOpacity="0.38" />
          </LinearGradient>
        </Defs>
        <Path d={closedPath(guidePoints)} fill="none" stroke={colors.white} strokeOpacity={0.22} strokeWidth={1} />
        {guidePoints.map((point, index) => <Line key={tasteAxisMeta[index]!.key} x1={glyphCenter} y1={glyphCenter} x2={point.x} y2={point.y} stroke={colors.white} strokeOpacity={0.18} strokeWidth={1} />)}
        {Array.from({ length: layerCount }, (_, index) => {
          const scale = 0.58 + index * (0.42 / Math.max(1, layerCount - 1));
          return <Path key={scale} d={smoothClosedPath(tasteGlyphPoints(values, scale))} fill={index === layerCount - 1 ? 'url(#glyph-fill)' : 'none'} stroke={colors.white} strokeOpacity={0.15 + index * 0.13} strokeWidth={1.15} />;
        })}
        {actualPoints.map((point, index) => <Circle key={tasteAxisMeta[index]!.key} cx={point.x} cy={point.y} r={3.4} fill={colors.white} fillOpacity={0.92} />)}
        <Circle cx={glyphCenter} cy={glyphCenter} r={4} fill={colors.white} fillOpacity={0.72} />
      </Svg>
      {tasteAxisMeta.map((axis, index) => {
        const point = glyphLabelPoint(index);
        const item = values.get(axis.key);
        return (
          <View key={axis.key} pointerEvents="none" style={[styles.glyphLabel, { left: point.x - 29, top: point.y - 18 }]}>
            <Text variant="caption" color="rgba(255,255,255,0.68)" style={styles.glyphLabelText}>{axis.label}</Text>
            <Text variant="label" color={colors.white} style={styles.glyphLabelText}>{item?.value.toFixed(1) ?? '-'}</Text>
          </View>
        );
      })}
    </View>
  );
}

function tasteGlyphPoints(values: Map<keyof TasteValues, TasteAverage>, scale: number): Point[] {
  return tasteAxisMeta.map((axis, index) => {
    const value = values.get(axis.key)?.value ?? 0;
    const angle = -Math.PI / 2 + index * Math.PI * 2 / tasteAxisMeta.length;
    const pointRadius = 40 + Math.max(0, Math.min(5, value)) * 19 * scale;
    return { x: glyphCenter + Math.cos(angle) * pointRadius, y: glyphCenter + Math.sin(angle) * pointRadius };
  });
}

function tasteGlyphGuidePoints(): Point[] {
  return tasteAxisMeta.map((_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / tasteAxisMeta.length;
    const pointRadius = 135;
    return { x: glyphCenter + Math.cos(angle) * pointRadius, y: glyphCenter + Math.sin(angle) * pointRadius };
  });
}

function glyphLabelPoint(index: number): Point {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / tasteAxisMeta.length;
  const labelRadius = 150;
  return { x: glyphCenter + Math.cos(angle) * labelRadius, y: glyphCenter + Math.sin(angle) * labelRadius };
}

function smoothClosedPath(points: Point[]) {
  if (!points.length) return '';
  const midpoint = (first: Point, second: Point): Point => ({ x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 });
  const first = points[0]!;
  const last = points[points.length - 1]!;
  const start = midpoint(last, first);
  let path = `M ${start.x} ${start.y}`;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]!;
    const end = midpoint(point, next);
    path += ` Q ${point.x} ${point.y} ${end.x} ${end.y}`;
  });
  return `${path} Z`;
}

function closedPath(points: Point[]) {
  if (!points.length) return '';
  return `${points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')} Z`;
}

function PreferenceAnnotations({ origins, processes, roasts, recentTrend }: { origins: TasteDimension[]; processes: TasteDimension[]; roasts: TasteDimension[]; recentTrend: string }) {
  const hasAnnotations = origins.length > 0 || processes.length > 0 || roasts.length > 0;
  const annotations = [
    { label: 'ORIGIN', item: origins[0], value: origins[0]?.label },
    { label: 'PROCESS', item: processes[0], value: processes[0]?.label },
    { label: 'ROAST', item: roasts[0], value: roasts[0] ? roastLevelLabel[roasts[0].label as RoastLevel] : undefined },
  ];

  return (
    <View style={styles.annotationSection}>
      <View style={styles.annotationHeading}>
        <Text variant="label" color={colors.action}>BEST MATCH</Text>
        <Text variant="title2">잘 맞았던 조합</Text>
        <Text color={colors.neutral600}>{hasAnnotations ? '좋았던 한 잔에서 반복된 조건이에요.' : '기록이 쌓이면 잘 맞는 조건을 보여드려요.'}</Text>
      </View>
      <View style={styles.annotationGrid} accessibilityLabel={`잘 맞았던 조합. ${annotations.map((annotation) => `${annotation.label} ${annotation.value ?? '기록 중'}`).join(', ')}`}>
        {annotations.map((annotation, index) => (
          <View key={annotation.label} style={[styles.annotationCell, index > 0 && styles.annotationCellBorder]}>
            <Text variant="caption" color={colors.neutral600}>{annotation.label}</Text>
            <Text variant="title3" numberOfLines={2}>{annotation.value ?? '기록 중'}</Text>
            {annotation.item ? <Text variant="caption" color={colors.action}>{annotation.item.count}회 · {annotation.item.score}</Text> : null}
          </View>
        ))}
      </View>
      <View style={styles.trendBlock}>
        <Text variant="caption" color={colors.action}>RECENT SHIFT</Text>
        <Text variant="title3">{recentTrend}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.section },
  poster: { minHeight: 620, overflow: 'hidden', borderRadius: radius.hero, backgroundColor: colors.action, paddingHorizontal: spacing.roomy, paddingVertical: spacing.roomy },
  posterMasthead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.compact },
  posterHeadline: { minHeight: 86, justifyContent: 'flex-end', gap: spacing.xs, paddingTop: spacing.roomy },
  glyph: { width: glyphSize, height: glyphSize, alignSelf: 'center', position: 'relative', marginVertical: spacing.default },
  glyphLabel: { position: 'absolute', width: 58, alignItems: 'center' },
  glyphLabelText: { textAlign: 'center' },
  emptyGlyphCopy: { position: 'absolute', top: glyphCenter - 21, right: 0, left: 0, alignItems: 'center', gap: 2 },
  posterTags: { gap: spacing.compact, paddingTop: spacing.xs },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
  flavorTag: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.small, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.06)' },
  flavorTagPrimary: { borderColor: colors.terracotta, backgroundColor: colors.terracotta },
  posterMetrics: { flexDirection: 'row', alignItems: 'stretch', marginTop: spacing.roomy, paddingTop: spacing.default, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)' },
  posterMetric: { flex: 1, gap: 1 },
  posterMetricDivider: { width: StyleSheet.hairlineWidth, marginHorizontal: spacing.default, backgroundColor: 'rgba(255,255,255,0.2)' },
  posterMetricNumber: { fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8 },
  annotationSection: { gap: spacing.roomy, paddingVertical: spacing.section },
  annotationHeading: { gap: 2 },
  annotationGrid: { flexDirection: 'row', paddingVertical: spacing.roomy, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 },
  annotationCell: { flex: 1, minHeight: 92, gap: spacing.xs, paddingRight: spacing.compact },
  annotationCellBorder: { paddingLeft: spacing.default, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.neutral200 },
  trendBlock: { gap: spacing.compact, paddingTop: spacing.xs },
});
