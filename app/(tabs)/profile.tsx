import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Icon, Screen, Text, type SymbolName } from '@/components/ui';
import { listBeans, listCups } from '@/database/repository';
import { calculateTasteProfile } from '@/domain/tasteProfile';
import { localizedFlavor, type TasteProfile } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<TasteProfile>(calculateTasteProfile([]));
  const [beanCount, setBeanCount] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([listCups(db), listBeans(db)]).then(([cups, beans]) => { if (active) { setProfile(calculateTasteProfile(cups)); setBeanCount(beans.length); } });
    return () => { active = false; };
  }, [db]));

  return (
    <Screen contentContainerStyle={styles.screen}>
      <View style={styles.header}><View><Text variant="title1" accessibilityRole="header">프로필</Text><Text color={colors.neutral800}>나의 커피 기록과 앱 설정을 관리해요.</Text></View><View style={styles.heart}><Icon name="person.crop.circle" size={30} color={colors.espresso} /></View></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${friendlyInsight(profile)}. 취향 자세히 보기`} onPress={() => router.push('/taste-profile')} style={styles.hero}>
        <View style={styles.heroIcon}><Icon name="sparkles" size={32} color={colors.espresso} /></View><Text variant="caption" color={colors.cocoa}>지금 보이는 취향</Text><Text variant="title1">{friendlyInsight(profile)}</Text><Text color={colors.neutral800}>{profile.ratedCupCount < 3 ? `맛을 남긴 커피가 ${3 - profile.ratedCupCount}잔 더 필요해요.` : `${profile.ratedCupCount}잔을 바탕으로 찾았어요.`}</Text><View style={styles.more}><Text variant="label">자세히 보기</Text><Icon name="chevron.right" size={16} /></View>
      </Pressable>
      <View style={styles.stats}><Stat label="원두" value={beanCount} icon="leaf.fill" /><Stat label="마신 커피" value={profile.cupCount} icon="cup.and.saucer.fill" /><Stat label="맛 기록" value={profile.ratedCupCount} icon="heart.fill" /></View>
      <View style={styles.sectionHeading}><Text variant="title2">앱 관리</Text><Text color={colors.neutral800}>앱 사용 방식을 내게 맞게 설정해요.</Text></View>
      <View style={styles.menu}><MenuRow icon="gearshape.fill" title="설정" body="진동, 소리, 화면 움직임, 저장 및 앱 정보" onPress={() => router.push('/settings')} /></View>
    </Screen>
  );
}

function friendlyInsight(profile: TasteProfile) { if (profile.ratedCupCount < 3) return '조금 더 마셔볼까요?'; return profile.topFlavors[0] ? `${localizedFlavor(profile.topFlavors[0].label)} 계열을 좋아해요` : profile.insight; }
function Stat({ label, value, icon }: { label: string; value: number; icon: SymbolName }) { return <View accessible accessibilityLabel={`${label} ${value}`} style={styles.stat}><Icon name={icon} size={19} color={colors.cocoa} /><Text variant="title1">{value}</Text><Text variant="caption" color={colors.neutral600}>{label}</Text></View>; }
function MenuRow({ icon, title, body, onPress }: { icon: SymbolName; title: string; body: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${body}`} onPress={onPress} style={styles.menuRow}><View style={styles.menuIcon}><Icon name={icon} size={23} /></View><View style={styles.flex}><Text variant="title3">{title}</Text><Text color={colors.neutral800}>{body}</Text></View><Icon name="chevron.right" size={17} color={colors.neutral400} /></Pressable>; }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, flex: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heart: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }, hero: { minHeight: 270, justifyContent: 'center', alignItems: 'flex-start', gap: spacing.compact, padding: spacing.section, borderRadius: radius.xl, backgroundColor: colors.warmBeige }, heroIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.compact }, more: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: spacing.compact }, stats: { flexDirection: 'row', gap: spacing.compact }, stat: { flex: 1, minHeight: 116, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: radius.large, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 }, sectionHeading: { gap: 2 }, menu: { backgroundColor: colors.white, borderRadius: radius.large, overflow: 'hidden' }, menuRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral200 }, menuIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' } });
