import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { AppNavigation, Button, Card, Chip, Field, Icon, PageHeader, Screen, Text } from '@/components/ui';
import { getCup, recordCupFeedback } from '@/database/repository';
import { emptyTasteValues, satisfactionLabel, type Cup, type Satisfaction, type TasteValues } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';

const flavors = ['Floral', 'Fruity', 'Juicy', 'Sweet', 'Clean', 'Creamy', 'Nutty', 'Roasty', 'Funky'];
const flavorLabels: Record<string, string> = { Floral: '꽃향', Fruity: '과일', Juicy: '과즙', Sweet: '달콤함', Clean: '깔끔함', Creamy: '부드러움', Nutty: '고소함', Roasty: '구수함', Funky: '발효향' };
const tasteLabels: Record<keyof TasteValues, string> = { acidity: '산미', sweetness: '단맛', body: '질감', bitterness: '쓴맛', aroma: '향', aftertaste: '여운', balance: '균형' };

export default function RecordCupScreen() {
  const { cupId } = useLocalSearchParams<{ cupId: string }>();
  const db = useSQLiteContext();
  const [cup, setCup] = useState<Cup | null>(null);
  const [satisfaction, setSatisfaction] = useState<Satisfaction | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [taste, setTaste] = useState<TasteValues>(emptyTasteValues());
  const [memo, setMemo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => { if (!cupId) return; let active = true; getCup(db, cupId).then((value) => { if (active && value) { setCup(value); setSatisfaction(value.satisfaction); setTags(value.flavorTags); setTaste(value.taste); setMemo(value.memo); setImageUri(value.imageUri); } }); return () => { active = false; }; }, [cupId, db]));
  const toggleTag = (tag: string) => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  const save = async () => { if (!cup || !satisfaction) return setError('이 컵이 어땠는지 하나를 선택해주세요.'); await recordCupFeedback(db, cup.id, { satisfaction, flavorTags: tags, taste, memo, imageUri }); router.replace('/(tabs)/journal'); };
  const pickImage = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return setError('사진 보관함 권한이 없어요. 사진 없이도 기록할 수 있어요.'); const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }); if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri); };

  if (!cup) return <Screen><Text>컵 기록을 불러오고 있어요…</Text></Screen>;
  return (
    <View style={styles.shell}><Screen showNavigation={false}>
      <PageHeader title="이 커피는 어땠나요?" description="첫 느낌만 골라도 충분해요." action={<Button label="나중에" variant="tertiary" onPress={() => router.replace('/(tabs)/journal')} />} />
      {error ? <Text accessibilityRole="alert" color={colors.error}>{error}</Text> : null}
      <View style={styles.ratings}>{(['not_for_me', 'good', 'loved'] as Satisfaction[]).map((value) => <View key={value} style={styles.ratingChoice}><View style={[styles.ratingIcon, satisfaction === value && styles.ratingIconSelected]}><Icon name={value === 'loved' ? 'heart.fill' : value === 'good' ? 'face.smiling' : 'hand.thumbsdown.fill'} size={25} color={satisfaction === value ? colors.cream : colors.espresso} /></View><Chip label={satisfactionLabel[value]} selected={satisfaction === value} onPress={() => setSatisfaction(value)} /></View>)}</View>
      <Text variant="title2">어떤 맛이 떠올랐나요?</Text>
      <View style={styles.ratings}>{flavors.map((flavor) => <Chip key={flavor} label={flavorLabels[flavor]!} selected={tags.includes(flavor)} onPress={() => toggleTag(flavor)} />)}</View>
      <Pressable accessibilityRole="button" onPress={() => setDetailsOpen((current) => !current)} style={styles.disclosure}><View style={styles.flex}><Text variant="title3">맛을 더 자세히 남기기</Text><Text color={colors.neutral800}>선택 사항이에요. 원하는 항목만 기록하세요.</Text></View><Icon name={detailsOpen ? 'chevron.up' : 'chevron.down'} /></Pressable>
      {detailsOpen ? <Card>{(Object.keys(taste) as (keyof TasteValues)[]).map((key) => <View key={key} style={styles.tasteRow}><View><Text variant="label">{tasteLabels[key]}</Text>{key === 'body' ? <Text variant="caption" color={colors.neutral600}>가벼움에서 묵직함</Text> : null}</View><View style={styles.ratings}>{[1,2,3,4,5].map((value) => <Chip key={value} label={String(value)} selected={taste[key] === value} onPress={() => setTaste((current) => ({ ...current, [key]: current[key] === value ? null : value }))} />)}</View></View>)}</Card> : null}
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} accessibilityLabel="이 커피의 사진" /> : null}
      <Button label={imageUri ? '사진 바꾸기' : '사진 추가'} variant="secondary" icon="camera.fill" onPress={() => void pickImage()} />
      <Field label="한 줄 메모" value={memo} onChangeText={setMemo} multiline placeholder="다음에는 물 온도를 조금 낮춰보기" style={styles.memo} />
      <Button label="맛 기록 저장" onPress={() => void save()} />
    </Screen><AppNavigation /></View>
  );
}

const styles = StyleSheet.create({ shell: { flex: 1, backgroundColor: colors.cream }, flex: { flex: 1 }, ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, ratingChoice: { flex: 1, minWidth: 100, alignItems: 'center', gap: spacing.compact }, ratingIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' }, ratingIconSelected: { backgroundColor: colors.espresso }, disclosure: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.small }, tasteRow: { gap: spacing.compact, paddingTop: spacing.small, borderTopWidth: 1, borderTopColor: colors.neutral200 }, photo: { width: '100%', height: 220, borderRadius: 18 }, memo: { minHeight: 140, textAlignVertical: 'top' } });
