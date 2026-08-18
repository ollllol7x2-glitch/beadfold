import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { BrandMark, Button, Icon, Screen, Text, type SymbolName } from '@/components/ui';
import { getSetting, setSetting } from '@/database/repository';
import { colors, radius, spacing } from '@/design-system/tokens';

type Experience = 'beginner' | 'casual' | 'advanced';
type Goal = 'guided' | 'repeat' | 'explore';

const experienceOptions: { value: Experience; title: string; body: string; icon: SymbolName }[] = [
  { value: 'beginner', title: '처음이에요', body: '무엇부터 할지 알려주세요', icon: 'cup.and.saucer.fill' },
  { value: 'casual', title: '가끔 내려요', body: '추천을 빠르게 받고 싶어요', icon: 'cup.and.heat.waves.fill' },
  { value: 'advanced', title: '직접 조절해요', body: '변수와 기록을 자세히 볼게요', icon: 'slider.horizontal.3' },
];

const goalOptions: { value: Goal; title: string; body: string; icon: SymbolName }[] = [
  { value: 'guided', title: '오늘 바로 내려볼래요', body: '원두를 고르면 순서대로 안내해요', icon: 'play.fill' },
  { value: 'repeat', title: '맛있던 한 잔을 반복할래요', body: '레시피와 결과를 함께 기억해요', icon: 'arrow.clockwise' },
  { value: 'explore', title: '내 취향을 찾아볼래요', body: '몇 잔 기록하면 패턴을 보여드려요', icon: 'heart.fill' },
];

export default function OnboardingScreen() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience>('beginner');
  const [goal, setGoal] = useState<Goal>('guided');

  useEffect(() => {
    let active = true;
    void getSetting(db, 'onboarding_complete', 'false').then((complete) => {
      if (!active) return;
      if (complete === 'true') router.replace('/(tabs)');
      else setReady(true);
    });
    return () => { active = false; };
  }, [db]);

  const finish = async () => {
    setLoading(true);
    await Promise.all([
      setSetting(db, 'experience_level', experience),
      setSetting(db, 'onboarding_goal', goal),
      setSetting(db, 'onboarding_complete', 'true'),
    ]);
    router.replace('/(tabs)');
  };

  if (!ready) return null;

  return (
    <Screen showNavigation={false} contentContainerStyle={styles.content}>
      <View style={styles.wordmark} accessible accessibilityLabel="BEANFOLD">
        <BrandMark size={24} />
        <Text variant="label" style={styles.wordmarkText}>BEANFOLD</Text>
      </View>

      {step === 0 ? (
        <>
          <ImageBackground source={require('../assets/visuals/bean-still-life.png')} resizeMode="cover" style={styles.hero} imageStyle={styles.heroImage} accessible={false}>
            <View style={styles.heroFade} />
          </ImageBackground>
          <View style={styles.heading}>
            <Text variant="display" accessibilityRole="header">커피, 얼마나{`\n`}익숙하세요?</Text>
            <Text variant="bodyLarge" color={colors.neutral800}>지금 수준에 맞춰 첫 화면과 설명을 바꿔드릴게요.</Text>
          </View>
          <View style={styles.choices}>{experienceOptions.map((option) => <Choice key={option.value} {...option} selected={experience === option.value} onPress={() => setExperience(option.value)} />)}</View>
        </>
      ) : step === 1 ? (
        <>
          <View style={styles.illustration} accessible={false}>
            <View style={styles.illustrationCircle}><Icon name="mug.fill" size={74} color={colors.espresso} /></View>
            <View style={styles.foldPaper} />
          </View>
          <View style={styles.heading}>
            <Text variant="display" accessibilityRole="header">어떤 한 잔을{`\n`}원하세요?</Text>
            <Text variant="bodyLarge" color={colors.neutral800}>고른 답은 언제든 프로필에서 바꿀 수 있어요.</Text>
          </View>
          <View style={styles.choices}>{goalOptions.map((option) => <Choice key={option.value} {...option} selected={goal === option.value} onPress={() => setGoal(option.value)} />)}</View>
        </>
      ) : (
        <>
          <View style={styles.readyVisual} accessible={false}>
            <BrandMark size={96} inverted />
            <View style={styles.readyLine} />
            <View style={styles.readySteps}>
              <Icon name="leaf.fill" size={28} color={colors.espresso} />
              <Icon name="chevron.right" size={16} color={colors.taupe} />
              <Icon name="cup.and.heat.waves.fill" size={32} color={colors.espresso} />
              <Icon name="chevron.right" size={16} color={colors.taupe} />
              <Icon name="heart.fill" size={28} color={colors.terracotta} />
            </View>
          </View>
          <View style={styles.heading}>
            <Text variant="display" accessibilityRole="header">준비됐어요.</Text>
            <Text variant="bodyLarge" color={colors.neutral800}>{experience === 'beginner' ? '첫 원두부터 한 단계씩 함께할게요.' : experience === 'casual' ? '필요한 추천만 빠르게 보여드릴게요.' : '자주 쓰는 변수와 기록을 바로 꺼내드릴게요.'}</Text>
          </View>
          <View style={styles.preview}>
            <PreviewStep number="1" icon="leaf.fill" title="원두 고르기" />
            <PreviewStep number="2" icon="cup.and.heat.waves.fill" title="안내대로 내리기" />
            <PreviewStep number="3" icon="heart.fill" title="맛 남기기" />
          </View>
        </>
      )}

      <View style={styles.footer}>
        <Button label={step === 2 ? 'BEANFOLD 시작하기' : '다음'} loading={loading} onPress={() => step === 2 ? void finish() : setStep((value) => value + 1)} icon={step === 2 ? 'arrow.right' : undefined} />
        <View style={styles.progress} accessibilityLabel={`온보딩 ${step + 1}단계, 전체 3단계`}>
          {[0, 1, 2].map((index) => <View key={index} style={[styles.progressDot, index === step && styles.progressDotActive]} />)}
          <Text variant="caption" color={colors.neutral600}>{step + 1} / 3</Text>
        </View>
      </View>
    </Screen>
  );
}

function Choice({ title, body, icon, selected, onPress }: { title: string; body: string; icon: SymbolName; selected: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
      <View style={styles.choiceIcon}><Icon name={icon} size={28} color={colors.espresso} /></View>
      <View style={styles.choiceCopy}><Text variant="title3">{title}</Text><Text color={colors.neutral800}>{body}</Text></View>
      {selected ? <View style={styles.check}><Icon name="checkmark" size={16} color={colors.cream} weight="bold" /></View> : <View style={styles.radio} />}
    </Pressable>
  );
}

function PreviewStep({ number, icon, title }: { number: string; icon: SymbolName; title: string }) {
  return <View style={styles.previewStep}><Text variant="caption" color={colors.neutral600}>{number}</Text><View style={styles.previewIcon}><Icon name={icon} size={24} /></View><Text variant="label" style={styles.previewText}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.default, justifyContent: 'space-between' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: spacing.compact, alignSelf: 'center' },
  wordmarkText: { letterSpacing: 4 },
  hero: { height: 220, marginHorizontal: -20, marginTop: -4, justifyContent: 'flex-end' },
  heroImage: { borderBottomLeftRadius: radius.hero, borderBottomRightRadius: radius.hero },
  heroFade: { height: 70, backgroundColor: 'rgba(247,242,234,0.52)' },
  heading: { gap: spacing.compact },
  choices: { gap: spacing.small },
  choice: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, backgroundColor: colors.white, borderRadius: radius.large, borderWidth: 1, borderColor: colors.neutral200 },
  choiceSelected: { borderWidth: 2, borderColor: colors.espresso, backgroundColor: colors.creamDeep },
  choiceIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  choiceCopy: { flex: 1, gap: 2 },
  check: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.espresso, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.neutral400 },
  footer: { gap: spacing.small, paddingTop: spacing.small },
  progress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.compact },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.neutral200 },
  progressDotActive: { width: 22, backgroundColor: colors.espresso },
  illustration: { height: 240, alignItems: 'center', justifyContent: 'center' },
  illustrationCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: colors.warmBeige, alignItems: 'center', justifyContent: 'center' },
  foldPaper: { position: 'absolute', right: 36, bottom: 20, width: 72, height: 72, backgroundColor: colors.white, borderTopRightRadius: 36, transform: [{ rotate: '-18deg' }] },
  readyVisual: { minHeight: 250, alignItems: 'center', justifyContent: 'center', gap: spacing.section },
  readyLine: { width: 1, height: 28, backgroundColor: colors.oat },
  readySteps: { flexDirection: 'row', alignItems: 'center', gap: spacing.default },
  preview: { flexDirection: 'row', gap: spacing.compact },
  previewStep: { flex: 1, minHeight: 118, alignItems: 'center', justifyContent: 'center', gap: spacing.compact, backgroundColor: colors.creamDeep, borderRadius: radius.large, padding: spacing.compact },
  previewIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  previewText: { textAlign: 'center' },
  pressed: { opacity: 0.65 },
});
