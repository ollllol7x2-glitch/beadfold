import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { BottomActionBar, Button, Card, Chip, Field, goBackOrReplace, Icon, Screen, TaskHeader, Text } from '@/components/ui';
import { getCup, recordCupFeedback } from '@/database/repository';
import { emptyTasteValues, satisfactionLabel, type Cup, type Satisfaction, type TasteValues } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';
import { useFeedback } from '@/components/feedback';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

const flavors = ['Floral', 'Fruity', 'Juicy', 'Sweet', 'Clean', 'Creamy', 'Nutty', 'Roasty', 'Funky'];
const flavorLabels: Record<string, string> = { Floral: '꽃향', Fruity: '과일', Juicy: '과즙', Sweet: '달콤함', Clean: '깔끔함', Creamy: '부드러움', Nutty: '고소함', Roasty: '구수함', Funky: '발효향' };
const tasteLabels: Record<keyof TasteValues, string> = { acidity: '산미', sweetness: '단맛', body: '질감', bitterness: '쓴맛', aroma: '향', aftertaste: '여운', balance: '균형' };
export default function RecordCupScreen() {
  const { cupId } = useLocalSearchParams<{ cupId: string }>();
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [cup, setCup] = useState<Cup | null>(null);
  const [satisfaction, setSatisfaction] = useState<Satisfaction | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [taste, setTaste] = useState<TasteValues>(emptyTasteValues());
  const [memo, setMemo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState('');
  const formSnapshot = JSON.stringify({ satisfaction, tags, taste, memo, imageUri });
  const isDirty = Boolean(baseline) && baseline !== formSnapshot;
  const { requestExit, allowExit, exitConfirmation } = useUnsavedChangesGuard(isDirty);

  useFocusEffect(useCallback(() => { if (!cupId) return; let active = true; getCup(db, cupId).then((value) => { if (active && value) { setCup(value); setSatisfaction(value.satisfaction); setTags(value.flavorTags); setTaste(value.taste); setMemo(value.memo); setImageUri(value.imageUri); setBaseline(JSON.stringify({ satisfaction: value.satisfaction, tags: value.flavorTags, taste: value.taste, memo: value.memo, imageUri: value.imageUri })); } }); return () => { active = false; }; }, [cupId, db]));
  const toggleTag = (tag: string) => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  const save = async () => {
    if (!cup || !satisfaction) return setError('이 컵이 어땠는지 하나를 선택해주세요.');
    setSaving(true);
    try {
      await recordCupFeedback(db, cup.id, { satisfaction, flavorTags: tags, taste, memo: memo.trim(), imageUri });
      showFeedback(satisfaction === 'loved' ? '좋았던 추출값을 다음 추천에 반영할게요.' : cup.satisfaction ? '맛 기록을 수정했어요.' : '맛 기록을 저장했어요.');
      allowExit();
      router.replace('/(tabs)/journal');
    } finally {
      setSaving(false);
    }
  };
  const pickImage = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return setError('사진 보관함 권한이 없어요. 사진 없이도 기록할 수 있어요.'); const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }); if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri); };

  if (!cup) return <Screen><Text>컵 기록을 불러오고 있어요…</Text></Screen>;
  return (
    <Screen showNavigation={false} header={<TaskHeader title="맛 기록" closeLabel="나중에" onClose={() => requestExit(() => goBackOrReplace('/(tabs)/journal'))} />} footer={<BottomActionBar primaryLabel={cup.satisfaction ? '변경사항 저장' : '맛 기록 저장'} primaryLoading={saving} onPrimaryPress={() => void save()} />}>
      {error ? <Text accessibilityRole="alert" color={colors.error}>{error}</Text> : null}
      <View style={styles.intro}>
        <Text variant="title1">첫 모금은 어땠나요?</Text>
        <Text color={colors.neutral600}>{cup.beanName}</Text>
      </View>
      <View style={styles.satisfactionChoices}>{(['not_for_me', 'good', 'loved'] as Satisfaction[]).map((value) => {
        const selected = satisfaction === value;
        const icon = value === 'loved' ? 'heart.fill' : value === 'good' ? 'face.smiling' : 'hand.thumbsdown.fill';
        return <Pressable key={value} accessibilityRole="button" accessibilityLabel={satisfactionLabel[value]} accessibilityState={{ selected }} onPress={() => { setSatisfaction(value); setError(''); }} style={({ pressed }) => [styles.satisfactionChoice, selected && styles.satisfactionChoiceSelected, pressed && styles.pressed]}>
          <View style={[styles.ratingIcon, selected && styles.ratingIconSelected]}><Icon name={icon} size={23} color={selected ? colors.cream : colors.espresso} /></View>
          <Text variant="label" color={selected ? colors.cream : colors.charcoal}>{satisfactionLabel[value]}</Text>
        </Pressable>;
      })}</View>
      <View style={styles.flavorSection}>
        <View style={styles.sectionCopy}><Text variant="title3">떠오른 맛</Text><Text variant="caption" color={colors.neutral600}>여러 개 골라도 좋아요.</Text></View>
        <View style={styles.tagChoices}>{flavors.map((flavor) => <Chip key={flavor} label={flavorLabels[flavor]!} selected={tags.includes(flavor)} onPress={() => toggleTag(flavor)} />)}</View>
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }} onPress={() => setDetailsOpen((current) => !current)} style={({ pressed }) => [styles.disclosure, pressed && styles.pressed]}><View style={styles.flex}><Text variant="label">더 자세히 남기기</Text><Text variant="caption" color={colors.neutral600}>향미 점수, 사진, 메모</Text></View><Icon name={detailsOpen ? 'chevron.up' : 'chevron.down'} color={colors.neutral600} /></Pressable>
      {detailsOpen ? <Card style={styles.detailsCard}>
        {(Object.keys(taste) as (keyof TasteValues)[]).map((key) => <View key={key} style={styles.tasteRow}><View><Text variant="label">{tasteLabels[key]}</Text>{key === 'body' ? <Text variant="caption" color={colors.neutral600}>가벼움에서 묵직함</Text> : null}</View><View style={styles.scoreChoices}>{[1,2,3,4,5].map((value) => <Chip key={value} label={String(value)} selected={taste[key] === value} onPress={() => setTaste((current) => ({ ...current, [key]: current[key] === value ? null : value }))} />)}</View></View>)}
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} accessibilityLabel="이 커피의 사진" /> : null}
        <Button label={imageUri ? '사진 바꾸기' : '사진 추가'} variant="secondary" icon="camera.fill" onPress={() => void pickImage()} />
        <Field label="한 줄 메모" value={memo} onChangeText={setMemo} multiline placeholder="다음에는 물 온도를 조금 낮춰보기" style={styles.memo} />
      </Card> : null}
      {exitConfirmation}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { gap: spacing.xs, paddingTop: spacing.xs },
  satisfactionChoices: { flexDirection: 'row', gap: spacing.compact },
  satisfactionChoice: { flex: 1, minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: spacing.compact, padding: spacing.small, borderWidth: 1, borderColor: colors.neutral200, borderRadius: 18, backgroundColor: colors.white },
  satisfactionChoiceSelected: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  ratingIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  ratingIconSelected: { backgroundColor: colors.espressoSoft },
  flavorSection: { gap: spacing.small },
  sectionCopy: { gap: 2 },
  tagChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
  disclosure: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingVertical: spacing.compact, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  detailsCard: { gap: spacing.default },
  tasteRow: { gap: spacing.compact },
  scoreChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
  photo: { width: '100%', height: 220, borderRadius: 18 },
  memo: { minHeight: 120, textAlignVertical: 'top' },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
});
