import { useCallback, useState } from 'react';
import { Image, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import Svg, { Path } from 'react-native-svg';
import { BottomSheet, BrandMark, Button, Card, EmptyState, Icon, IconButton, Screen, SectionTitle, Text } from '@/components/ui';
import { getInterruptedBrew, getSetting, listBeans, listCatalogGear, listCups, listUserGear } from '@/database/repository';
import { generateGuidedRecipe } from '@/domain/recipeEngine';
import { localizedFlavor, satisfactionLabel, type BeanLot, type BrewSession, type Cup, type Gear, type Recipe } from '@/domain/types';
import { colors, radius, shadows, spacing } from '@/design-system/tokens';

type Experience = 'beginner' | 'casual' | 'advanced';
type Goal = 'guided' | 'repeat' | 'explore';
type SuggestedAction = { icon: Parameters<typeof Icon>[0]['name']; eyebrow?: string; title: string; body: string; label?: string; actionIcon?: Parameters<typeof Icon>[0]['name']; path: string };

export default function HomeScreen() {
  const db = useSQLiteContext();
  const [beans, setBeans] = useState<BeanLot[]>([]);
  const [cups, setCups] = useState<Cup[]>([]);
  const [interrupted, setInterrupted] = useState<BrewSession | null>(null);
  const [todayRecipe, setTodayRecipe] = useState<Recipe | null>(null);
  const [experience, setExperience] = useState<Experience>('beginner');
  const [goal, setGoal] = useState<Goal>('guided');
  const [beanPickerOpen, setBeanPickerOpen] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([listBeans(db), listCups(db), getInterruptedBrew(db), getSetting(db, 'experience_level', 'beginner'), getSetting(db, 'onboarding_goal', 'guided'), listUserGear(db), listCatalogGear(db)]).then(([nextBeans, nextCups, nextBrew, level, savedGoal, ownedGear, catalogGear]) => {
      const availableBeans = nextBeans.filter((bean) => bean.state !== 'finished' && bean.remainingWeightG > 0);
      const activeBean = availableBeans.find((bean) => bean.state === 'opened') ?? availableBeans[0];
      const availableGear = ownedGear.length ? ownedGear : catalogGear;
      const primaryGear = (category: Gear['category']) => availableGear.find((item) => item.category === category && item.isPrimary) ?? availableGear.find((item) => item.category === category) ?? null;
      let recommendation: Recipe | null = null;
      if (activeBean) {
        try {
          recommendation = generateGuidedRecipe({
            bean: activeBean,
            grinder: primaryGear('grinder'),
            dripper: primaryGear('dripper'),
            filter: primaryGear('filter'),
            water: primaryGear('water'),
            previousCups: nextCups.filter((cup) => cup.beanId === activeBean.id),
          });
        } catch {
          recommendation = null;
        }
      }
      if (active) { setBeans(nextBeans); setCups(nextCups); setInterrupted(nextBrew); setExperience(level as Experience); setGoal(savedGoal as Goal); setTodayRecipe(recommendation); }
    });
    return () => { active = false; };
  }, [db]));

  // "오늘"이라는 모호한 표현 대신, 실제 선택 기준을 화면에 드러낸다.
  const availableBeans = beans.filter((bean) => bean.state !== 'finished' && bean.remainingWeightG > 0);
  const openedBean = availableBeans.find((bean) => bean.state === 'opened');
  const today = openedBean ?? availableBeans[0];
  const todayCriterion = openedBean ? '개봉한 원두 중 최근에 사용한 원두' : '최근에 추가한 원두';
  const hour = new Date().getHours();
  const timeGreeting = hour < 11 ? '좋은 아침이에요' : hour < 17 ? '좋은 오후예요' : '좋은 저녁이에요';
  const greeting = experience === 'beginner' ? '첫 한 잔, 함께 시작해볼까요?' : experience === 'casual' ? '오늘은 가볍게 한 잔 내려볼까요?' : '오늘의 변수를 정해볼까요?';
  const pendingCup = cups.find((cup) => cup.kind === 'home' && !cup.satisfaction);
  const lastHomeCup = cups.find((cup) => cup.kind === 'home' && cup.beanId);
  const cupsForToday = today ? cups.filter((cup) => cup.kind === 'home' && cup.beanId === today.id) : [];
  const comparableCups = cups.filter((cup) => cup.kind === 'home' && cup.beanId);
  const lovedCupForToday = cupsForToday.find((cup) => cup.satisfaction === 'loved' && cup.recipeSnapshot);
  const remainingServings = today && todayRecipe ? Math.floor(today.remainingWeightG / todayRecipe.doseG) : null;
  const suggestedAction: SuggestedAction | null = interrupted ? null : pendingCup
    ? { icon: 'heart.fill', eyebrow: '아직 남은 한 단계', title: '방금 마신 커피는 어땠나요?', body: '첫 느낌만 골라도 다음 추천에 반영돼요.', label: '맛 기록 남기기', path: `/record-cup/${pendingCup.id}` }
    : comparableCups.length >= 2
      ? { icon: 'arrow.left.arrow.right', title: '두 잔을 비교해보세요', body: '원두·추출 조건·맛의 차이를 확인해요.', actionIcon: 'arrow.right', path: '/compare' }
      : today && remainingServings === 0
        ? { icon: 'leaf.fill', eyebrow: `현재 추천 ${todayRecipe?.doseG}g 기준`, title: '한 잔 분량이 조금 부족해요', body: `${today.name}은 ${today.remainingWeightG}g 남았어요. ${Number((todayRecipe!.doseG - today.remainingWeightG).toFixed(1))}g을 더 준비하거나 다른 원두를 골라보세요.`, label: '보관함 보기', path: '/(tabs)/collection' }
        : today && remainingServings === 1
          ? { icon: 'leaf.fill', eyebrow: `현재 추천 ${todayRecipe?.doseG}g 기준`, title: '이 원두는 한 번 더 내릴 수 있어요', body: `${today.remainingWeightG}g 남았어요. 다음 원두를 함께 준비해두면 좋아요.`, label: '보관함 보기', path: '/(tabs)/collection' }
          : today && lovedCupForToday
            ? { icon: 'sparkles', eyebrow: '좋았던 기록을 반영했어요', title: '마음에 들었던 한 잔을 기준으로 시작해요', body: '최근에 좋았다고 남긴 추출값을 오늘의 추천에 반영했어요.', label: '추천 레시피 보기', path: `/recipe/guided?beanId=${today.id}` }
            : goal === 'repeat' && lastHomeCup?.beanId
              ? { icon: 'arrow.clockwise', eyebrow: '내 취향대로 반복하기', title: '최근 레시피를 다시 내려볼까요?', body: `${lastHomeCup.beanName}로 남긴 경험을 기준으로 시작해요.`, label: '같은 원두로 내리기', path: `/recipe/guided?beanId=${lastHomeCup.beanId}` }
              : goal === 'explore'
                ? { icon: 'sparkles', eyebrow: '내 취향 찾기', title: '맛 기록이 쌓일수록 더 또렷해져요', body: '좋았던 커피에 느낌을 남기면 취향 변화를 보여드려요.', label: '내 취향 보기', path: '/taste-profile' }
                : null;
  const noticeCount = Number(Boolean(interrupted))
    + Math.min(3, cups.filter((cup) => cup.kind === 'home' && !cup.satisfaction).length)
    + Math.min(3, beans.filter((bean) => bean.remainingWeightG > 0 && bean.remainingWeightG <= 30 && bean.state !== 'finished').length);

  const header = (
    <View style={styles.brandRow}>
      <View style={styles.wordmark}><BrandMark size={26} /><Text variant="label" style={styles.wordmarkText}>BEANFOLD</Text></View>
      <View style={styles.notificationWrap}>
        <Pressable accessibilityRole="button" accessibilityLabel={noticeCount ? `알림 ${noticeCount}개` : '알림'} onPress={() => router.push('/notifications' as never)} style={({ pressed }) => [styles.notificationButton, pressed && styles.pressed]}><NotificationBell /></Pressable>
        {noticeCount ? <View pointerEvents="none" style={styles.notificationBadge}><Text variant="caption" color={colors.cream} style={styles.notificationBadgeText}>{noticeCount > 9 ? '9+' : noticeCount}</Text></View> : null}
      </View>
    </View>
  );

  return (
    <Screen showNavigation header={header} contentContainerStyle={styles.screen}>

      <View style={styles.greeting}>
        <Text variant="title1" accessibilityRole="header">{timeGreeting}</Text>
        <Text variant="bodyLarge" color={colors.neutral600}>{greeting}</Text>
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
            {today.imageUri ? (
              <ImageBackground source={{ uri: today.imageUri }} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage}>
                <View style={styles.heroShade} />
                <BeanHeroCopy bean={today} criterion={todayCriterion} />
              </ImageBackground>
            ) : (
              <View style={[styles.hero, styles.heroFallback]}>
                <View style={styles.fallbackRing} /><View style={styles.fallbackBean}><Icon name="leaf.fill" size={62} color={colors.cream} /></View>
                <BeanHeroCopy bean={today} criterion={todayCriterion} />
              </View>
            )}
          </Pressable>
          <View style={styles.heroActions}>
            {todayRecipe ? <TodayRecipePreview recipe={todayRecipe} /> : null}
            <Button label="이 원두로 내리기" icon="cup.and.heat.waves.fill" onPress={() => router.push(`/recipe/guided?beanId=${today.id}`)} style={styles.primaryBrew} />
            <View style={styles.duration}><Icon name="clock" size={14} color={colors.neutral600} /><Text variant="caption" color={colors.neutral600}>약 3분 · 단계별 안내</Text></View>
            {availableBeans.length > 1 ? <Button label="다른 원두 고르기" variant="tertiary" icon="arrow.triangle.2.circlepath" onPress={() => setBeanPickerOpen(true)} /> : null}
          </View>
        </View>
      ) : (
        <EmptyState title={beans.length ? '내릴 수 있는 원두가 없어요' : '먼저 원두를 알려주세요'} body={beans.length ? '남은 원두가 없거나 모두 마셨어요. 새 원두를 추가하면 바로 시작할 수 있어요.' : '이름과 남은 양만 입력해도 바로 시작할 수 있어요.'} icon="leaf.fill" action={<Button label={beans.length ? '새 원두 추가하기' : '첫 원두 추가하기'} icon="plus" onPress={() => router.push('/add-bean')} />} />
      )}

      {experience === 'beginner' ? <BeginnerPath hasBean={Boolean(today)} beanId={today?.id} cupCount={cups.length} /> : null}

      {suggestedAction ? <NextAction {...suggestedAction} onPress={() => router.push(suggestedAction.path as never)} /> : null}

      <View style={styles.recentSection}>
        <SectionTitle title="최근에 내린 커피" action={<Button label="전체 보기" variant="tertiary" onPress={() => router.push('/(tabs)/journal')} />} />
        {cups.length ? <View style={styles.cupList}>{cups.slice(0, 3).map((cup, index) => <CupRow key={cup.id} cup={cup} imageOffset={index} showDivider={index > 0} />)}</View> : <Card tone="tinted"><View style={styles.emptyCup}><Icon name="cup.and.saucer" size={30} color={colors.espresso} /><View style={styles.flex}><Text variant="title3">아직 기록이 없어요</Text><Text color={colors.neutral600}>첫 브루잉이 끝나면 여기에 바로 나타나요.</Text></View></View></Card>}
      </View>
      <BottomSheet visible={beanPickerOpen} title="어떤 원두로 내릴까요?" onClose={() => setBeanPickerOpen(false)}><View style={styles.pickerList}>{availableBeans.map((bean) => <Pressable key={bean.id} accessibilityRole="button" accessibilityLabel={`${bean.name}로 내리기`} onPress={() => { setBeanPickerOpen(false); router.push(`/recipe/guided?beanId=${bean.id}`); }} style={styles.pickerItem}><View style={styles.pickerIcon}><Icon name="leaf.fill" size={22} /></View><View style={styles.flex}><Text variant="title3">{bean.name}</Text><Text variant="caption" color={colors.neutral600}>{bean.remainingWeightG}g 남음{bean.roaster ? ` · ${bean.roaster}` : ''}</Text></View><Icon name="chevron.right" size={18} color={colors.neutral600} /></Pressable>)}</View></BottomSheet>
    </Screen>
  );
}

function NotificationBell() {
  return (
    <Svg accessible={false} width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M3.26192 15.326C2.69692 15.91 3.11092 17 3.99992 17H19.9999C20.8889 17 21.3029 15.91 20.7399 15.327C19.4099 13.956 17.9999 12.499 17.9999 8C17.9999 4.686 15.3139 2 11.9999 2C8.68592 2 5.99992 4.686 5.99992 8C5.99992 12.499 4.58892 13.956 3.26192 15.326Z" stroke={colors.espresso} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.5 17.5C15.5 19.433 13.933 21 12 21C10.067 21 8.5 19.433 8.5 17.5" stroke={colors.espresso} strokeWidth={1.5} />
    </Svg>
  );
}

function BeanHeroCopy({ bean, criterion }: { bean: BeanLot; criterion: string }) {
  return (
    <View style={styles.heroCopy}>
      <Text variant="label" color={colors.creamDeep}>지금 내릴 원두</Text>
      <Text variant="caption" color={colors.creamDeep}>{criterion}</Text>
      <Text variant="title1" color={colors.cream} style={styles.heroTitle}>{bean.name}</Text>
      <Text color={colors.cream}>{bean.tastingNotes.slice(0, 3).join(' · ') || [bean.country, bean.process].filter(Boolean).join(' · ')}</Text>
      <View style={styles.heroMeta}><View style={styles.remaining}><Icon name="leaf.fill" size={14} color={colors.cream} /><Text variant="label" color={colors.cream}>남은 양 {bean.remainingWeightG}g</Text></View><Text variant="caption" color={colors.creamDeep}>{roastAgeLabel(bean.roastDate)}</Text></View>
    </View>
  );
}

function TodayRecipePreview({ recipe }: { recipe: Recipe }) {
  const metrics = [
    { label: '원두', value: `${recipe.doseG}g` },
    { label: '물', value: `${recipe.waterMl}ml` },
    { label: '온도', value: `${recipe.temperatureC}℃` },
    { label: '시간', value: formatDuration(recipe.totalTimeSec) },
  ];
  return (
    <View accessible accessibilityLabel={`오늘의 추천 레시피. 원두 ${recipe.doseG}그램, 물 ${recipe.waterMl}밀리리터, ${recipe.temperatureC}도, 총 ${formatDuration(recipe.totalTimeSec)}`} style={styles.recipePreview}>
      <View style={styles.recipePreviewHeading}><View style={styles.recipePreviewIcon}><Icon name="sparkles" size={15} color={colors.espresso} /></View><View style={styles.flex}><Text variant="label">오늘의 시작점</Text><Text variant="caption" color={colors.neutral600} numberOfLines={1}>{recipe.grindTarget} · {recipe.steps.filter((step) => step.waterDeltaMl > 0).length}번 나눠 붓기</Text></View></View>
      <View style={styles.recipeMetrics}>{metrics.map((metric, index) => <View key={metric.label} style={[styles.recipeMetric, index < metrics.length - 1 && styles.recipeMetricDivider]}><Text variant="caption" color={colors.neutral600}>{metric.label}</Text><Text variant="label">{metric.value}</Text></View>)}</View>
    </View>
  );
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}분 ${String(seconds % 60).padStart(2, '0')}초`;
}

function roastAgeLabel(roastDate: string | null) {
  if (!roastDate) return '로스팅일 미입력';
  const roastedAt = new Date(`${roastDate}T00:00:00`).getTime();
  if (Number.isNaN(roastedAt)) return '로스팅일 미입력';
  const days = Math.max(0, Math.floor((Date.now() - roastedAt) / 86_400_000));
  return `로스팅 후 ${days}일`;
}

function NextAction({ icon, eyebrow, title, body, label, actionIcon, onPress }: { icon: Parameters<typeof Icon>[0]['name']; eyebrow?: string; title: string; body: string; label?: string; actionIcon?: Parameters<typeof Icon>[0]['name']; onPress: () => void }) {
  return <Card tone="tinted" style={styles.nextAction}><View style={styles.nextIcon}><Icon name={icon} size={22} color={colors.espresso} /></View><View style={styles.flex}>{eyebrow ? <Text variant="caption" color={colors.cocoa}>{eyebrow}</Text> : null}<Text variant="title3">{title}</Text><Text variant="caption" color={colors.neutral600}>{body}</Text></View>{actionIcon ? <IconButton name={actionIcon} label={label ?? title} onPress={onPress} /> : label ? <Button label={label} variant="tertiary" onPress={onPress} style={styles.nextButton} /> : null}</Card>;
}

function BeginnerPath({ hasBean, beanId, cupCount }: { hasBean: boolean; beanId?: string; cupCount: number }) {
  const active = !hasBean ? 0 : cupCount === 0 ? 1 : 2;
  const steps = [
    { label: '원두 고르기', icon: 'leaf.fill' as const },
    { label: '안내대로 내리기', icon: 'cup.and.heat.waves.fill' as const },
    { label: '맛 남기기', icon: 'heart.fill' as const },
  ];
  const next = !hasBean
    ? { label: '원두 추가하기', href: '/add-bean' }
    : cupCount === 0 && beanId
      ? { label: '안내 시작하기', href: `/recipe/guided?beanId=${beanId}` }
      : { label: '내 기록 보기', href: '/(tabs)/journal' };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`처음 시작하기. 현재 ${steps[active]!.label} 단계. ${next.label}`} onPress={() => router.push(next.href as never)} style={({ pressed }) => [styles.path, pressed && styles.pressed]}>
      <Text variant="label">처음 시작하기</Text>
      <View style={styles.pathSteps}>{steps.map((step, index) => <View key={step.label} style={styles.pathStep}>
        <View style={[styles.pathIcon, index === active && styles.pathIconActive, index < active && styles.pathIconDone]}><Icon name={index < active ? 'checkmark' : step.icon} size={20} color={index <= active ? colors.cream : colors.neutral600} weight="bold" /></View>
        <Text variant="caption" color={index === active ? colors.espresso : colors.neutral600} style={index === active && styles.pathLabelActive}>{step.label}</Text>
        {index < steps.length - 1 ? <View style={[styles.pathLine, index < active && styles.pathLineDone]} /> : null}
      </View>)}</View>
      <View style={styles.pathAction}><Text variant="label" color={colors.espresso}>{next.label}</Text><Icon name="chevron.right" size={17} color={colors.espresso} /></View>
    </Pressable>
  );
}

function CupRow({ cup, imageOffset, showDivider }: { cup: Cup; imageOffset: number; showDivider: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${cup.beanName} 기록 보기`} onPress={() => router.push(`/cup/${cup.id}`)} style={({ pressed }) => [styles.cupRow, showDivider && styles.cupRowDivided, pressed && styles.pressed]}>
      <View style={styles.thumbnail}><Image source={require('../../assets/visuals/bean-still-life.png')} resizeMode="cover" style={[styles.thumbnailImage, { transform: [{ scale: 1.25 + imageOffset * 0.04 }] }]} /></View>
      <View style={styles.flex}><Text variant="title3" numberOfLines={1}>{cup.beanName}</Text><Text variant="caption" color={colors.neutral600}>{new Date(cup.createdAt).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text><Text variant="caption" color={colors.neutral600}>{cup.flavorTags.slice(0, 3).map(localizedFlavor).join(' · ') || '아직 맛을 남기지 않았어요'}</Text></View>
      <View style={styles.rating}><Icon name={cup.satisfaction === 'loved' ? 'heart.fill' : cup.satisfaction === 'good' ? 'face.smiling' : cup.satisfaction === 'not_for_me' ? 'hand.thumbsdown.fill' : 'circle'} size={cup.satisfaction === 'not_for_me' ? 22 : 24} color={cup.satisfaction === 'loved' ? colors.terracotta : colors.espresso} /><Text variant="caption" color={colors.neutral600}>{cup.satisfaction ? satisfactionLabel[cup.satisfaction] : '평가 전'}</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.section, gap: spacing.section },
  brandRow: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  wordmarkText: { letterSpacing: 4 },
  greeting: { gap: 2 },
  // The action keeps a 48px touch target, so 4px here renders as a visual 12px below the title text.
  recentSection: { gap: spacing.xs },
  heroWrap: { backgroundColor: colors.white, borderRadius: radius.xl, overflow: 'hidden', ...shadows.lifted },
  hero: { height: 310, justifyContent: 'flex-end' },
  heroImage: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(35,25,18,0.24)' },
  heroCopy: { padding: spacing.roomy, gap: 5, backgroundColor: 'rgba(35,25,18,0.36)' },
  heroTitle: { maxWidth: '75%' },
  heroFallback: { overflow: 'hidden', backgroundColor: colors.cocoa },
  fallbackRing: { position: 'absolute', width: 330, height: 330, borderRadius: 165, borderWidth: 1, borderColor: 'rgba(255,253,249,0.28)', top: -110, right: -62 },
  fallbackBean: { position: 'absolute', width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,253,249,0.14)', top: 54, alignSelf: 'center' },
  heroMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.compact, paddingTop: 2 },
  remaining: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroActions: { padding: spacing.default, gap: spacing.compact },
  recipePreview: { gap: spacing.small, padding: spacing.small, borderRadius: radius.medium, backgroundColor: colors.creamDeep },
  recipePreviewHeading: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: spacing.compact },
  recipePreviewIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.warmBeige },
  recipeMetrics: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.warmBeige, paddingTop: spacing.compact },
  recipeMetric: { flex: 1, gap: 2, alignItems: 'center' },
  recipeMetricDivider: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.warmBeige },
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
  pathAction: { minHeight: 44, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: spacing.small },
  notificationWrap: { position: 'relative' },
  notificationButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', minWidth: 19, height: 19, right: 2, top: 1, paddingHorizontal: 4, borderRadius: 10, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.cream },
  notificationBadgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
  cupList: { backgroundColor: colors.white, borderRadius: radius.large, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 },
  cupRow: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small },
  cupRowDivided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  thumbnail: { width: 72, height: 72, borderRadius: radius.medium, overflow: 'hidden', backgroundColor: colors.creamDeep },
  thumbnailImage: { width: '100%', height: '100%' },
  rating: { width: 66, alignItems: 'center', gap: 4 },
  emptyCup: { flexDirection: 'row', alignItems: 'center', gap: spacing.default },
  nextAction: { flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small },
  nextIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  nextButton: { alignSelf: 'center' },
  pickerList: { gap: spacing.compact, paddingBottom: spacing.small },
  pickerItem: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderRadius: radius.large, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  pickerIcon: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep },
  pressed: { opacity: 0.68 },
});
