import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { Button, EmptyState, Icon, Screen, Text } from '@/components/ui';
import { abandonBrew, completeBrew, getBrewSession, getSetting, updateBrewSession } from '@/database/repository';
import { formatDuration, pauseSession, projectBrew, resumeSession, skipStep, startReadySession } from '@/domain/brewClock';
import type { BrewSession, RecipeStep } from '@/domain/types';
import { colors, fonts, radius, spacing } from '@/design-system/tokens';
import { scheduleTasteReminderIfAllowed } from '@/services/notifications';
import { ConfirmDialog } from '@/components/confirmDialog';

type BrewPhase = 'ready' | 'countdown' | 'active';

export default function BrewScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const db = useSQLiteContext();
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 790 || fontScale > 1.15;
  const accessibilityScroll = fontScale > 1.5;
  const [session, setSession] = useState<BrewSession | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const previousStep = useRef(-1);
  const [error, setError] = useState('');
  const [hapticsEnabled, setHapticsEnabled] = useState(false);
  const [confirm, setConfirm] = useState<'pause' | 'leave' | 'skip' | null>(null);

  const load = useCallback(async () => {
    if (sessionId) setSession(await getBrewSession(db, sessionId));
    setHapticsEnabled((await getSetting(db, 'haptics', 'true')) === 'true');
  }, [db, sessionId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    const interval = setInterval(() => setTick((value) => value + 1), 250);
    const subscription = AppState.addEventListener('change', (state) => { if (state === 'active') void load(); });
    return () => { clearInterval(interval); subscription.remove(); };
  }, [load]);

  useEffect(() => {
    if (countdown == null) return;
    AccessibilityInfo.announceForAccessibility(countdown === 0 ? '시작' : String(countdown));
    if (hapticsEnabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (countdown === 0) {
      if (!session) return;
      const timer = setTimeout(() => {
        const active = startReadySession(session);
        setCountdown(null);
        setSession(active);
        previousStep.current = -1;
        void updateBrewSession(db, active);
      }, 450);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setCountdown((value) => value == null ? null : value - 1), 850);
    return () => clearTimeout(timer);
  }, [countdown, db, hapticsEnabled, session]);

  const projection = session && session.status !== 'completed' && session.status !== 'ready' ? projectBrew(session) : null;
  useEffect(() => {
    if (!projection || projection.stepIndex === previousStep.current) return;
    previousStep.current = projection.stepIndex;
    const announcement = `${projection.step.name} 시작. ${projection.step.durationSec}초. ${projection.step.waterDeltaMl ? `${projection.step.waterDeltaMl}밀리리터를 부어주세요.` : '기다려주세요.'}`;
    AccessibilityInfo.announceForAccessibility(announcement);
    if (hapticsEnabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [hapticsEnabled, projection]);

  if (!session) return <Screen showNavigation={false}><EmptyState title="브루잉을 찾을 수 없어요" body="홈에서 다시 시작해주세요." action={<Button label="홈으로 가기" onPress={() => router.replace('/(tabs)')} />} /></Screen>;
  if (session.status === 'completed') return <Screen showNavigation={false}><EmptyState title="이미 끝낸 브루잉이에요" body="기록 탭에서 이 컵을 확인할 수 있어요." action={<Button label="기록 보기" onPress={() => router.replace('/(tabs)/journal')} />} /></Screen>;

  const persist = async (nextSession: BrewSession) => { setSession(nextSession); await updateBrewSession(db, nextSession); };
  const togglePause = async () => {
    const nextSession = session.pausedAt ? resumeSession(session) : pauseSession(session);
    await persist(nextSession);
    AccessibilityInfo.announceForAccessibility(nextSession.pausedAt ? '브루잉 일시정지' : '브루잉 재개');
  };
  const leave = async () => {
    const nextSession = session.status === 'ready' || session.pausedAt ? session : pauseSession(session);
    if (nextSession !== session) await persist(nextSession);
    router.replace('/(tabs)');
  };
  const finish = async () => {
    try {
      const cup = await completeBrew(db, session.id);
      AccessibilityInfo.announceForAccessibility('브루잉 완료. 맛을 남기는 화면으로 이동합니다.');
      if (hapticsEnabled) await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      void scheduleTasteReminderIfAllowed(db, cup.id);
      router.replace(`/record-cup/${cup.id}`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : '브루잉을 완료하지 못했어요.'); }
  };
  const abandon = () => setConfirm('leave');
  const reviewRecipe = async () => {
    await abandonBrew(db, session.id);
    const recipe = session.recipeSnapshot;
    router.replace(`/recipe/${recipe.type === 'manual' ? 'manual' : 'guided'}?${recipe.type === 'manual' ? `recipeId=${recipe.id}` : `beanId=${session.beanId}`}`);
  };

  const phase: BrewPhase = countdown != null ? 'countdown' : session.status === 'ready' ? 'ready' : 'active';
  if (phase !== 'active') {
    return (
      <Screen scroll={accessibilityScroll} showNavigation={false} contentContainerStyle={[styles.shell, compact && styles.shellCompact]}>
        <ConfirmDialog visible={confirm === 'pause'} title="준비를 잠시 멈출까요?" body="지금까지의 준비 상태는 홈에서 이어갈 수 있어요." confirmLabel="나가기" onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); void leave(); }} />
        <BrewTopBar title="추출 준비" subtitle={`1 / ${session.recipeSnapshot.steps.length}`} onLeave={() => setConfirm('pause')} />
        {phase === 'countdown' ? (
          <CountdownState value={countdown ?? 0} />
        ) : (
          <ReadyState session={session} compact={compact} onStart={() => setCountdown(3)} onReview={() => void reviewRecipe()} />
        )}
      </Screen>
    );
  }

  if (!projection) return null;
  const next = session.recipeSnapshot.steps[projection.stepIndex + 1];
  const canSkip = projection.stepElapsedMs >= Math.min(5000, projection.step.durationSec * 500);
  const requestNext = () => {
    if (projection.completed) return void finish();
    if (!next) return;
    const move = async () => { const nextSession = skipStep({ ...session, stepIndex: projection.stepIndex }); await persist(nextSession); };
    if (!canSkip) {
      setConfirm('skip');
    } else void move();
  };
  const stepProgress = Math.min(1, projection.stepElapsedMs / Math.max(1, projection.step.durationSec * 1000));
  const currentVisual = stepVisual(projection.step);
  return (
    <Screen scroll={accessibilityScroll} showNavigation={false} background={<BrewSceneTransition stepIndex={projection.stepIndex} />} contentContainerStyle={[styles.shell, compact && styles.shellCompact]}>
      <ConfirmDialog visible={confirm === 'skip'} title="벌써 다음 단계로 갈까요?" body={`${formatDuration(projection.stepRemainingMs)}가 남아 있어요.`} confirmLabel="다음 단계" onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); const nextSession = skipStep({ ...session, stepIndex: projection.stepIndex }); void persist(nextSession); }} />
      <ConfirmDialog visible={confirm === 'pause'} title="브루잉을 잠시 멈출까요?" body="타이머를 멈추고 홈에서 이어할 수 있어요." confirmLabel="잠시 멈추기" onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); void leave(); }} />
      <ConfirmDialog visible={confirm === 'leave'} title="브루잉을 그만둘까요?" body="컵 기록은 만들지 않아요." confirmLabel="그만두기" destructive onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); void abandonBrew(db, session.id).then(() => router.replace('/(tabs)')); }} />
      <BrewTopBar
        title={projection.step.name}
        subtitle={`${projection.stepIndex + 1} / ${session.recipeSnapshot.steps.length}`}
        onLeave={() => setConfirm('pause')}
      />

      {error ? <Text accessibilityRole="alert" color={colors.error}>{error}</Text> : null}

      <View accessible accessibilityLiveRegion="polite" accessibilityLabel={`${projection.step.name}. 남은 시간 ${formatDuration(projection.stepRemainingMs)}. 전체 ${formatDuration(projection.totalElapsedMs)} 경과.`} style={[styles.timerZone, compact && styles.timerZoneCompact]}>
        <Text variant="label" color={colors.neutral600}>{session.pausedAt ? '잠시 멈춤' : '남은 시간'}</Text>
        <Text style={[styles.heroTimer, compact && styles.heroTimerCompact]} adjustsFontSizeToFit minimumFontScale={0.72}>{formatDuration(projection.stepRemainingMs)}</Text>
        <Text variant="bodyLarge" color={colors.neutral600} style={styles.elapsedTime}>전체 {formatDuration(projection.totalElapsedMs)} / {formatDuration(session.recipeSnapshot.totalTimeSec * 1000)}</Text>
        <View style={styles.stepProgress}>
          {session.recipeSnapshot.steps.map((step, index) => {
            const fill = index < projection.stepIndex ? 1 : index === projection.stepIndex ? stepProgress : 0;
            return <View key={step.id} style={styles.stepTrack}><View style={[styles.stepFill, { width: `${fill * 100}%`, backgroundColor: currentVisual.color }]} /></View>;
          })}
        </View>
      </View>

      <View style={[styles.instructionCard, compact && styles.instructionCardCompact]}>
        <View style={[styles.instructionIcon, { backgroundColor: colors.creamDeep }]} accessible={false}>
          <Icon name={currentVisual.icon} size={25} color={currentVisual.color} weight="semibold" />
        </View>
        <View style={styles.instructionCopy}>
          <Text variant="label" color={colors.espresso}>지금 할 일</Text>
          <Text style={[styles.instructionText, compact && styles.instructionTextCompact]} accessibilityRole="header">{friendlyInstruction(projection.step)}</Text>
        </View>
      </View>

      <View style={styles.metrics} accessible accessibilityLabel={`지금 ${projection.step.waterDeltaMl ? `${projection.step.waterDeltaMl}밀리리터` : `${projection.step.durationSec}초 기다리기`}. ${next ? `다음 ${next.name}. ` : ''}누적 ${projection.step.waterTotalMl}밀리리터.`}>
        <Metric label="지금" value={projection.step.waterDeltaMl ? `${projection.step.waterDeltaMl}ml` : '기다리기'} />
        <View style={styles.metricDivider} />
        <Metric label="다음" value={next ? next.name : '맛 남기기'} />
        <View style={styles.metricDivider} />
        <Metric label="누적" value={`${projection.step.waterTotalMl} / ${session.recipeSnapshot.waterMl}ml`} />
      </View>

      <View style={styles.bottomArea}>
        <View style={styles.primaryControls}>
          <Button style={styles.controlButton} variant="secondary" label={session.pausedAt ? '계속하기' : '일시정지'} icon={session.pausedAt ? 'play.fill' : 'pause.fill'} onPress={() => void togglePause()} />
          <Button style={styles.controlButton} label={projection.completed ? '추출 완료' : '다음 단계'} icon={projection.completed ? 'checkmark' : 'forward.fill'} onPress={requestNext} disabled={!projection.completed && !next} />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="브루잉 그만두기" onPress={abandon} style={styles.stopAction}><Text variant="label" color={colors.neutral600}>브루잉 그만두기</Text></Pressable>
      </View>
    </Screen>
  );
}

function BrewTopBar({ title, subtitle, onLeave }: { title: string; subtitle: string; onLeave: () => void }) {
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="나가기" onPress={onLeave} style={styles.topSide}><Icon name="chevron.left" size={24} /></Pressable>
      <View style={styles.stepHeading}><Text variant="caption" color={colors.neutral600}>{subtitle}</Text><Text variant="title3" accessibilityRole="header" numberOfLines={1}>{title}</Text></View>
      <View style={styles.topSide} />
    </View>
  );
}

function ReadyState({ session, compact, onStart, onReview }: { session: BrewSession; compact: boolean; onStart: () => void; onReview: () => void }) {
  const recipe = session.recipeSnapshot;
  return (
    <View style={styles.readyBody}>
      <View style={styles.readyHeading}><Text variant="title1" accessibilityRole="header">도구를 준비해주세요</Text><Text color={colors.neutral600}>아직 타이머는 시작되지 않았어요.</Text></View>
      <View style={styles.checks}>
        <ReadyItem icon="leaf.fill" label="원두" value={`${recipe.doseG}g`} />
        <ReadyItem icon="drop.fill" label="물" value={`${recipe.waterMl}ml · ${recipe.temperatureC}℃`} />
        <ReadyItem icon="mug.fill" label="도구" value={friendlyGearName(recipe.dripper)} />
      </View>
      <View style={[styles.readyMedia, compact && styles.readyMediaCompact]}>
        <Image source={require('../../assets/visuals/bloom-top.png')} style={styles.readyImage} resizeMode="cover" accessible={false} />
        <View style={styles.readyMediaCopy}><Icon name="timer" size={22} color={colors.espresso} /><Text variant="label">버튼을 누른 뒤 3초 후 시작해요</Text><Text variant="caption" color={colors.neutral600}>주전자와 저울을 잡을 시간을 드릴게요.</Text></View>
      </View>
      <View style={styles.readyActions}><Button label="준비됐어요 · 시작" icon="play.fill" onPress={onStart} style={styles.startButton} /><Button label="레시피 다시 보기" variant="tertiary" onPress={onReview} /></View>
    </View>
  );
}

function ReadyItem({ icon, label, value }: { icon: Parameters<typeof Icon>[0]['name']; label: string; value: string }) {
  return <View style={styles.readyItem}><View style={styles.readyItemTop}><View style={styles.readyIcon}><Icon name={icon} size={18} color={colors.espresso} /></View><Icon name="checkmark.circle.fill" size={18} color={colors.success} weight="bold" /></View><View><Text variant="caption" color={colors.neutral600}>{label}</Text><Text variant="label" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{value}</Text></View></View>;
}

function CountdownState({ value }: { value: number }) {
  return <View style={styles.countdown} accessible accessibilityLiveRegion="assertive"><Text variant="label" color={colors.neutral600}>주전자와 저울을 잡아주세요</Text><Text style={styles.countdownNumber}>{value || '시작'}</Text><Text variant="bodyLarge" color={colors.neutral600}>첫 단계는 뜸 들이기예요.</Text></View>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metric}><Text variant="caption" color={colors.neutral600}>{label}</Text><Text variant="label" numberOfLines={2} style={styles.metricValue}>{value}</Text></View>;
}

const brewSceneColors = [colors.cream, '#F6F2ED', '#F4F0EB', colors.creamDeep, '#EEE9E2'];

function BrewSceneTransition({ stepIndex }: { stepIndex: number }) {
  const currentIndex = Math.min(Math.max(stepIndex, 0), brewSceneColors.length - 1);
  const [previousIndex, setPreviousIndex] = useState(currentIndex);
  const previousIndexRef = useRef(currentIndex);
  const [fade] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (previousIndexRef.current === currentIndex) return;
    setPreviousIndex(previousIndexRef.current);
    previousIndexRef.current = currentIndex;
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 520, useNativeDriver: true }).start(() => setPreviousIndex(currentIndex));
  }, [currentIndex, fade]);

  return <View accessible={false} pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: brewSceneColors[previousIndex] }]}><Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, backgroundColor: brewSceneColors[currentIndex] }]} /></View>;
}

function stepVisual(step: RecipeStep) {
  if (step.action === 'bloom') return { label: '뜸들이기', icon: 'drop.fill' as const, tone: 'pour' as const, color: colors.cocoa };
  if (step.waterDeltaMl > 0 || step.action === 'pour') return { label: '물을 붓는 중', icon: 'drop.fill' as const, tone: 'pour' as const, color: colors.cocoa };
  if (step.action === 'wait') return { label: '기다리는 중', icon: 'timer' as const, tone: 'wait' as const, color: colors.teal };
  return { label: '추출 진행 중', icon: 'timer' as const, tone: 'wait' as const, color: colors.teal };
}

function friendlyInstruction(step: RecipeStep) {
  if (!step.waterDeltaMl) return step.instruction || '물이 고르게 내려가도록 기다려주세요.';
  if (/bloom|뜸/i.test(step.instruction) || step.action === 'bloom') return `가운데부터 천천히 ${step.waterDeltaMl}ml를 부어주세요.`;
  return step.instruction || `원을 그리며 ${step.waterDeltaMl}ml를 부어주세요.`;
}

function friendlyGearName(value: string) {
  if (!value) return '드리퍼와 서버';
  if (/cone/i.test(value)) return '원뿔형 드리퍼';
  if (/flat|wave/i.test(value)) return '평저형 드리퍼';
  return value;
}

const styles = StyleSheet.create({
  shell: { flex: 1, gap: spacing.small, paddingTop: 0, paddingBottom: spacing.compact },
  shellCompact: { gap: spacing.compact },
  flex: { flex: 1 },
  topBar: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topSide: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  stepHeading: { flex: 1, alignItems: 'center', gap: 1 },
  readyBody: { flex: 1, justifyContent: 'space-between', gap: spacing.small },
  readyHeading: { alignItems: 'center', gap: 2 },
  checks: { flexDirection: 'row', gap: spacing.compact },
  readyItem: { flex: 1, minHeight: 88, padding: spacing.compact, borderRadius: radius.medium, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, justifyContent: 'space-between', gap: 3, overflow: 'hidden' },
  readyItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  readyMedia: { flex: 1, minHeight: 220, maxHeight: 310, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.creamDeep },
  readyMediaCompact: { minHeight: 175 },
  readyImage: { width: '100%', height: '68%' },
  readyMediaCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.compact, paddingTop: spacing.default, paddingHorizontal: spacing.small, paddingBottom: spacing.small, flexWrap: 'wrap' },
  readyActions: { gap: 2 },
  startButton: { minHeight: 62 },
  countdown: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.small },
  countdownNumber: { fontFamily: fonts.bold, fontSize: 124, lineHeight: 138, letterSpacing: -4, color: colors.espresso },
  timerZone: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.default, paddingBottom: spacing.small },
  timerZoneCompact: { paddingTop: spacing.compact, paddingBottom: spacing.compact },
  heroTimer: { fontFamily: fonts.bold, fontSize: 186, lineHeight: 198, letterSpacing: -6, color: colors.espresso, fontVariant: ['tabular-nums'], marginVertical: spacing.xs },
  heroTimerCompact: { fontSize: 156, lineHeight: 168, letterSpacing: -5.5 },
  elapsedTime: { marginTop: spacing.xs },
  stepProgress: { width: '100%', flexDirection: 'row', gap: 5, marginTop: spacing.default },
  stepTrack: { height: 7, flex: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.neutral200 },
  stepFill: { height: '100%', backgroundColor: colors.espresso },
  instructionCard: { minHeight: 142, flexDirection: 'row', alignItems: 'center', gap: spacing.default, borderRadius: radius.large, backgroundColor: colors.white, padding: spacing.roomy, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 },
  instructionCardCompact: { minHeight: 124, paddingVertical: spacing.default },
  instructionIcon: { width: 52, height: 52, flexShrink: 0, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  instructionCopy: { flex: 1, justifyContent: 'center', gap: spacing.compact },
  instructionText: { fontFamily: fonts.semibold, fontSize: 25, lineHeight: 34, letterSpacing: -0.4, color: colors.charcoal },
  instructionTextCompact: { fontSize: 22, lineHeight: 30 },
  metrics: { minHeight: 86, flexDirection: 'row', alignItems: 'stretch', borderRadius: radius.medium, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 },
  metric: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 4 },
  metricDivider: { width: StyleSheet.hairlineWidth, marginVertical: spacing.small, backgroundColor: colors.neutral200 },
  metricValue: { textAlign: 'center', lineHeight: 18 },
  bottomArea: { marginTop: 'auto', gap: 0 },
  primaryControls: { flexDirection: 'row', gap: spacing.compact },
  controlButton: { flex: 1, minHeight: 60 },
  stopAction: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
