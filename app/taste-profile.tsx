import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Card, Icon, PageHeader, PageIntro, Screen, Text } from '@/components/ui';
import { listCups, trackEvent } from '@/database/repository';
import { calculateTasteProfile } from '@/domain/tasteProfile';
import { localizedFlavor, roastLevelLabel, type RoastLevel, type TasteDimension, type TasteProfile } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

export default function TasteProfileScreen() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<TasteProfile>(calculateTasteProfile([]));
  useFocusEffect(useCallback(() => { let active = true; void trackEvent(db, 'taste_profile_viewed'); void listCups(db).then((cups) => { if (active) setProfile(calculateTasteProfile(cups)); }); return () => { active = false; }; }, [db]));
  return <Screen header={<PageHeader title="나의 커피 취향" backLabel="프로필" backHref="/(tabs)/profile" />} contentContainerStyle={styles.screen}>
    <PageIntro>좋았던 커피에서 반복되는 맛을 모았어요.</PageIntro>
    <View style={styles.hero}><View style={styles.heroIcon}><Icon name="heart.fill" size={30} color={colors.terracotta} /></View><Text variant="caption" color={colors.cocoa}>요즘의 취향</Text><Text variant="title1">{profile.insight}</Text><Text color={colors.neutral800}>맛을 남긴 커피 {profile.ratedCupCount}잔{profile.averageScore != null ? `, 평균 만족도 ${profile.averageScore} / 3` : ''}</Text></View>
    <Card><Text variant="title3">최근 변화</Text><Text color={colors.neutral800}>{profile.recentTrend}</Text></Card>
    {profile.ratedCupCount < 3 ? <Card tone="tinted"><Text variant="title3">조금만 더 마셔볼까요?</Text><Text color={colors.neutral800}>세 잔부터 반복되는 취향을 살펴봐요. 지금은 결론을 서두르지 않을게요.</Text></Card> : null}
    <Dimension title="자주 좋았던 맛" icon="sparkles" items={profile.topFlavors} localize />
    <Dimension title="잘 맞았던 산지" icon="globe.asia.australia.fill" items={profile.topOrigins} />
    <Dimension title="잘 맞았던 가공법" icon="leaf.fill" items={profile.topProcesses} />
    <Dimension title="잘 맞았던 로스팅" icon="flame.fill" items={profile.topRoasts} localizeRoast />
  </Screen>;
}
function Dimension({ title, items, icon, localize = false, localizeRoast = false }: { title: string; items: TasteDimension[]; icon: Parameters<typeof Icon>[0]['name']; localize?: boolean; localizeRoast?: boolean }) { return <View style={styles.dimension}><View style={styles.title}><View style={styles.titleIcon}><Icon name={icon} size={18} /></View><Text variant="title2">{title}</Text></View>{items.length ? items.map((item, index) => { const label = localize ? localizedFlavor(item.label) : localizeRoast ? roastLevelLabel[item.label as RoastLevel] : item.label; return <View key={item.label} accessible accessibilityLabel={`${label}, ${item.count}회`} style={styles.row}><Text variant="label" style={styles.rank}>{index + 1}</Text><Text variant="title3" style={styles.flex}>{label}</Text><Text variant="caption" color={colors.neutral600}>{item.count}회, 평균 {item.score} / 3</Text></View>; }) : <Text color={colors.neutral800}>아직 보여드릴 기록이 없어요.</Text>}</View>; }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, hero: { minHeight: 240, alignItems: 'flex-start', justifyContent: 'center', gap: spacing.compact, padding: spacing.section, borderRadius: radius.xl, backgroundColor: colors.warmBeige }, heroIcon: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, dimension: { gap: spacing.small, paddingTop: spacing.compact }, title: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact }, titleIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep }, row: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.compact }, rank: { width: 24, color: colors.cocoa }, flex: { flex: 1 } });
