import { useCallback, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BrandMark, Button, Card, EmptyState, Icon, IconButton, Screen, SectionTitle, Text } from '@/components/ui';
import { getInterruptedBrew, getSetting, listBeans, listCups } from '@/database/repository';
import { localizedFlavor, satisfactionLabel, type BeanLot, type BrewSession, type Cup } from '@/domain/types';
import { colors, radius, shadows, spacing } from '@/design-system/tokens';

type Experience = 'beginner' | 'casual' | 'advanced';

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [beans, setBeans] = useState<BeanLot[]>([]);
  const [cups, setCups] = useState<Cup[]>([]);
  const [interrupted, setInterrupted] = useState<BrewSession | null>(null);
  const [experience, setExperience] = useState<Experience>('beginner');

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([listBeans(db), listCups(db), getInterruptedBrew(db), getSetting(db, 'experience_level', 'beginner')]).then(([nextBeans, nextCups, nextBrew, level]) => {
      if (active) { setBeans(nextBeans); setCups(nextCups); setInterrupted(nextBrew); setExperience(level as Experience); }
    });
    return () => { active = false; };
  }, [db]));

  const today = beans.find((bean) => bean.state === 'opened') ?? beans[0];
  const hour = new Date().getHours();
  const timeGreeting = hour < 11 ? '좋은 아침이에요' : hour < 17 ? '좋은 오후예요' : '좋은 저녁이에요';
  const greeting = experience === 'beginner' ? '첫 한 잔, 함께 시작해볼까요?' : experience === 'casual' ? '오늘은 가볍게 한 잔 내려볼까요?' : '오늘의 변수를 정해볼까요?';

  return (
    <Screen showNavigation contentContainerStyle={styles.screen}>
      <View style={styles.brandRow}>
        <View style={styles.wordmark}><BrandMark size={26} /><Text variant="label" style={styles.wordmarkText}>BEANFOLD</Text></View>
        <IconButton name="bell" label="알림" onPress={() => router.push('/notifications' as never)} />
      </View>

      <View style={styles.greeting}>
        <Text variant="title1" accessibilityRole="header">{timeGreeting}</Text>
        <Text variant="bodyLarge" color={colors.neutral800}>{greeting}</Text>
      </View>

      {interrupted ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`${interrupted.beanSnapshot.name} ${interrupted.status === 'ready' ? '추출 준비 이어가기' : '브루잉 이어가기'}`} onPress={() => router.push(`/brew/${interrupted.id}`)} style={({ pressed }) => [styles.resume, pressed && styles.pressed]}>
          <View style={styles.resumeIcon}><Icon name="play.fill" color={colors.cream} /></View>
          <View style={styles.flex}><Text variant="caption" color={colors.taupe}>{interrupted.status === 'ready' ? '시작 전 준비' : '잠시 멈춘 브루잉'}</Text><Text variant="title3" color={colors.cream}>{interrupted.beanSnapshot.name}</Text></View>
          <Icon name="chevron.right" color={colors.cream} />
        </Pressable>
      ) : null}

      {today ? (
        <View style={styles.heroWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${today.name} 원두 상세 보기`} onPress={() => router.push(`/bean/${today.id}`)}>
            <ImageBackground source={today.imageUri ? { uri: today.imageUri } : require('../../assets/visuals/bean-still-life.png')} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
              <View style={styles.heroShade} />
              <View style={styles.heroCopy}>
                <Text variant="label" color={colors.creamDeep}>오늘의 원두</Text>
                <Text variant="title1" color={colors.cream} style={styles.heroTitle}>{today.name}</Text>
                <Text color={colors.cream}>{today.tastingNotes.slice(0, 3).join(' · ') || [today.country, today.process].filter(Boolean).join(' · ')}</Text>
                <View style={styles.remaining}><Icon name="leaf.fill" size={14} color={colors.cream} /><Text variant="label" color={colors.cream}>남은 양 {today.remainingWeightG}g</Text></View>
              </View>
            </ImageBackground>
          </Pressable>
          <View style={styles.heroActions}>
            <Button label="이 원두로 내리기" icon="waterbottle.fill" onPress={() => router.push(`/recipe/guided?beanId=${today.id}`)} style={styles.primaryBrew} />
            <View style={styles.duration}><Icon name="clock" size={14} color={colors.neutral600} /><Text variant="caption" color={colors.neutral600}>약 3분 · 단계별 안내</Text></View>
            <Button label="다른 원두 고르기" variant="tertiary" icon="arrow.triangle.2.circlepath" onPress={() => router.push('/(tabs)/collection')} />
          </View>
        </View>
      ) : (
        <EmptyState title="먼저 원두를 알려주세요" body="이름과 남은 양만 입력해도 바로 시작할 수 있어요." icon="leaf.fill" action={<Button label="첫 원두 추가하기" icon="plus" onPress={() => router.push('/add-bean')} />} />
      )}

      {experience === 'beginner' ? <BeginnerPath hasBean={Boolean(today)} cupCount={cups.length} /> : null}

      <SectionTitle title="최근에 내린 커피" action={<Button label="전체 보기" variant="tertiary" onPress={() => router.push('/(tabs)/journal')} />} />
      {cups.length ? <View style={styles.cupList}>{cups.slice(0, 3).map((cup, index) => <CupRow key={cup.id} cup={cup} imageOffset={index} />)}</View> : <Card tone="tinted"><View style={styles.emptyCup}><Icon name="cup.and.saucer" size={30} color={colors.espresso} /><View style={styles.flex}><Text variant="title3">아직 기록이 없어요</Text><Text color={colors.neutral800}>첫 브루잉이 끝나면 여기에 바로 나타나요.</Text></View></View></Card>}
    </Screen>
  );
}

function BeginnerPath({ hasBean, cupCount }: { hasBean: boolean; cupCount: number }) {
  const active = !hasBean ? 0 : cupCount === 0 ? 1 : 2;
  const steps = [
    { label: '원두 고르기', icon: 'leaf.fill' as const },
    { label: '안내대로 내리기', icon: 'waterbottle.fill' as const },
    { label: '맛 남기기', icon: 'heart.fill' as const },
  ];
  return (
    <View style={styles.path} accessible accessibilityLabel={`처음 시작하기. 현재 ${steps[active]!.label} 단계`}>
      <Text variant="label">처음 시작하기</Text>
      <View style={styles.pathSteps}>{steps.map((step, index) => <View key={step.label} style={styles.pathStep}>
        <View style={[styles.pathIcon, index === active && styles.pathIconActive, index < active && styles.pathIconDone]}><Icon name={index < active ? 'checkmark' : step.icon} size={20} color={index <= active ? colors.cream : colors.neutral600} weight="bold" /></View>
        <Text variant="caption" color={index === active ? colors.espresso : colors.neutral600} style={index === active && styles.pathLabelActive}>{step.label}</Text>
        {index < steps.length - 1 ? <View style={[styles.pathLine, index < active && styles.pathLineDone]} /> : null}
      </View>)}</View>
    </View>
  );
}

function CupRow({ cup, imageOffset }: { cup: Cup; imageOffset: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${cup.beanName} 기록 보기`} onPress={() => router.push(`/cup/${cup.id}`)} style={({ pressed }) => [styles.cupRow, pressed && styles.pressed]}>
      <View style={styles.thumbnail}><Image source={require('../../assets/visuals/bean-still-life.png')} resizeMode="cover" style={[styles.thumbnailImage, { transform: [{ scale: 1.25 + imageOffset * 0.04 }] }]} /></View>
      <View style={styles.flex}><Text variant="title3" numberOfLines={1}>{cup.beanName}</Text><Text variant="caption" color={colors.neutral600}>{new Date(cup.createdAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text><Text variant="caption" color={colors.neutral800}>{cup.flavorTags.slice(0, 3).map(localizedFlavor).join(' · ') || '아직 맛을 남기지 않았어요'}</Text></View>
      <View style={styles.rating}><Icon name={cup.satisfaction === 'loved' ? 'heart.fill' : cup.satisfaction === 'good' ? 'face.smiling' : 'circle'} size={24} color={cup.satisfaction === 'loved' ? colors.terracotta : colors.espresso} /><Text variant="caption" color={colors.neutral600}>{cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '평가 전'}</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.compact, gap: spacing.section },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  wordmarkText: { letterSpacing: 4 },
  greeting: { gap: 2 },
  heroWrap: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', ...shadows.lifted },
  hero: { height: 310, justifyContent: 'flex-end' },
  heroImage: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(35,25,18,0.24)' },
  heroCopy: { padding: spacing.roomy, gap: spacing.compact, backgroundColor: 'rgba(35,25,18,0.26)' },
  heroTitle: { maxWidth: '75%' },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 },
  heroActions: { padding: spacing.default, gap: spacing.compact },
  primaryBrew: { minHeight: 62 },
  duration: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  resume: { minHeight: 76, padding: spacing.small, backgroundColor: colors.espresso, borderRadius: radius.large, flexDirection: 'row', alignItems: 'center', gap: spacing.small },
  resumeIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.espressoSoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  path: { gap: spacing.small, paddingVertical: spacing.compact },
  pathSteps: { flexDirection: 'row' },
  pathStep: { flex: 1, alignItems: 'center', gap: spacing.compact, position: 'relative' },
  pathIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.neutral100, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  pathIconActive: { backgroundColor: colors.espresso },
  pathIconDone: { backgroundColor: colors.taupe },
  pathLine: { position: 'absolute', height: 2, backgroundColor: colors.neutral200, left: '66%', right: '-34%', top: 23 },
  pathLineDone: { backgroundColor: colors.taupe },
  pathLabelActive: { fontWeight: '700' },
  cupList: { backgroundColor: colors.white, borderRadius: radius.large, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 },
  cupRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral200 },
  thumbnail: { width: 72, height: 72, borderRadius: radius.medium, overflow: 'hidden', backgroundColor: colors.creamDeep },
  thumbnailImage: { width: '100%', height: '100%' },
  rating: { width: 66, alignItems: 'center', gap: 4 },
  emptyCup: { flexDirection: 'row', alignItems: 'center', gap: spacing.default },
  pressed: { opacity: 0.68 },
});
