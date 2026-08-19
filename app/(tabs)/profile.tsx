import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Icon, Screen, Text, type SymbolName } from '@/components/ui';
import { getSetting, listBeans, listCups } from '@/database/repository';
import { calculateTasteProfile } from '@/domain/tasteProfile';
import { localizedFlavor, type TasteProfile } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<TasteProfile>(calculateTasteProfile([]));
  const [beanCount, setBeanCount] = useState(0);
  const [profileName, setProfileName] = useState('');
  const [profileImageUri, setProfileImageUri] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([listCups(db), listBeans(db), getSetting(db, 'profile_name', ''), getSetting(db, 'profile_image_uri', '')]).then(([cups, beans, name, imageUri]) => { if (active) { setProfile(calculateTasteProfile(cups)); setBeanCount(beans.length); setProfileName(name); setProfileImageUri(imageUri); } });
    return () => { active = false; };
  }, [db]));

  return (
    <Screen header={<View style={styles.header}><Text variant="title1" accessibilityRole="header">마이페이지</Text><Pressable accessibilityRole="button" accessibilityLabel="프로필 설정" onPress={() => router.push('/profile-settings' as never)} style={styles.profileButton}>{profileImageUri ? <Image source={{ uri: profileImageUri }} style={styles.profileImage} accessibilityLabel="프로필 사진" /> : <Icon name="person.crop.circle" size={30} color={colors.espresso} />}</Pressable></View>} contentContainerStyle={styles.screen}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${friendlyInsight(profile)}. 취향 자세히 보기`} onPress={() => router.push('/taste-profile')} style={styles.hero}>
        <View style={styles.heroIcon}><Icon name="sparkles" size={32} color={colors.espresso} /></View>{profileName ? <Text variant="title3">{profileName}</Text> : null}<Text variant="caption" color={colors.cocoa}>지금 보이는 취향</Text><Text variant="title1">{friendlyInsight(profile)}</Text><Text color={colors.neutral600}>{profile.ratedCupCount < 3 ? `맛을 남긴 커피가 ${3 - profile.ratedCupCount}잔 더 필요해요.` : `${profile.ratedCupCount}잔을 바탕으로 찾았어요.`}</Text><View style={styles.more}><Text variant="label">자세히 보기</Text><Icon name="chevron.right" size={16} /></View>
      </Pressable>
      <View style={styles.stats}><Stat label="원두" value={beanCount} icon="leaf.fill" hint="보관함으로 이동" onPress={() => router.push('/(tabs)/collection')} /><Stat label="마신 커피" value={profile.cupCount} icon="cup.and.saucer.fill" hint="기록으로 이동" onPress={() => router.push('/(tabs)/journal')} /><Stat label="맛 기록" value={profile.ratedCupCount} icon="heart.fill" hint="나의 커피 취향으로 이동" onPress={() => router.push('/taste-profile')} /></View>
      <View style={styles.menu}><MenuRow icon="gearshape.fill" title="앱 설정" body="진동, 소리, 저장 및 앱 정보" onPress={() => router.push('/settings')} /></View>
    </Screen>
  );
}

function friendlyInsight(profile: TasteProfile) { if (profile.ratedCupCount < 3) return '조금 더 마셔볼까요?'; return profile.topFlavors[0] ? `${localizedFlavor(profile.topFlavors[0].label)} 계열을 좋아해요` : profile.insight; }
function Stat({ label, value, icon, hint, onPress }: { label: string; value: number; icon: SymbolName; hint: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={`${label} ${value}`} accessibilityHint={hint} onPress={onPress} style={({ pressed }) => [styles.stat, pressed && styles.pressed]}><Icon name={icon} size={28} color={colors.cocoa} /><View style={styles.statValue}><Text variant="label">{label}</Text><Text variant="title2">{value}</Text></View></Pressable>; }
function MenuRow({ icon, title, body, onPress }: { icon: SymbolName; title: string; body: string; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${body}`} onPress={onPress} style={styles.menuRow}><View style={styles.menuIcon}><Icon name={icon} size={23} /></View><View style={styles.flex}><Text variant="title3">{title}</Text><Text color={colors.neutral600}>{body}</Text></View><Icon name="chevron.right" size={17} color={colors.neutral400} /></Pressable>; }
const styles = StyleSheet.create({ screen: { gap: spacing.section }, flex: { flex: 1 }, header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, profileButton: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, profileImage: { width: '100%', height: '100%' }, hero: { minHeight: 270, justifyContent: 'center', alignItems: 'flex-start', gap: spacing.compact, padding: spacing.section, borderRadius: radius.xl, backgroundColor: colors.warmBeige }, heroIcon: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.compact }, more: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: spacing.compact }, stats: { flexDirection: 'row', gap: spacing.compact }, stat: { flex: 1, minHeight: 108, alignItems: 'center', justifyContent: 'center', gap: spacing.compact, paddingHorizontal: spacing.xs, borderRadius: radius.large, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 }, statValue: { flexDirection: 'row', alignItems: 'center', gap: 4 }, menu: { backgroundColor: colors.white, borderRadius: radius.large, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 }, menuRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small }, menuIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] } });
