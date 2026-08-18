import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { BottomActionBar, Button, Chip, Field, goBackOrReplace, PageIntro, Screen, TaskHeader, Text } from '@/components/ui';
import { createCafeCup, deleteCup, getCup, updateCafeCup } from '@/database/repository';
import { localizedFlavor, satisfactionLabel, type Satisfaction } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';
import { useFeedback } from '@/components/feedback';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

const flavors = ['Floral', 'Fruity', 'Juicy', 'Sweet', 'Clean', 'Creamy', 'Nutty', 'Roasty', 'Funky'];

export default function RecordCafeScreen() {
  const { cupId } = useLocalSearchParams<{ cupId?: string }>();
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [cafeName, setCafeName] = useState('');
  const [beanName, setBeanName] = useState('');
  const [drinkName, setDrinkName] = useState('');
  const [satisfaction, setSatisfaction] = useState<Satisfaction | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [satisfactionError, setSatisfactionError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(cupId));
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState('');
  const formSnapshot = JSON.stringify({ cafeName, beanName, drinkName, satisfaction, tags, memo, imageUri });
  const isDirty = cupId ? Boolean(baseline) && baseline !== formSnapshot : Boolean(cafeName || beanName || drinkName || satisfaction || tags.length || memo || imageUri);
  const { requestExit, allowExit, exitConfirmation } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!cupId) return;
    let active = true;
    void getCup(db, cupId).then((cup) => {
      if (!active) return;
      if (!cup || cup.kind !== 'cafe') {
        setError('카페 기록을 찾지 못했어요.');
        setLoading(false);
        return;
      }
      setCafeName(cup.cafeName);
      setBeanName(cup.beanName === cup.drinkName ? '' : cup.beanName);
      setDrinkName(cup.drinkName);
      setSatisfaction(cup.satisfaction);
      setTags(cup.flavorTags);
      setMemo(cup.memo);
      setImageUri(cup.imageUri);
      setBaseline(JSON.stringify({ cafeName: cup.cafeName, beanName: cup.beanName === cup.drinkName ? '' : cup.beanName, drinkName: cup.drinkName, satisfaction: cup.satisfaction, tags: cup.flavorTags, memo: cup.memo, imageUri: cup.imageUri }));
      setLoading(false);
    });
    return () => { active = false; };
  }, [cupId, db]);

  const save = async () => {
    const normalizedBean = beanName.trim();
    const normalizedDrink = drinkName.trim();
    const missingName = !normalizedBean && !normalizedDrink;
    setNameError(missingName ? '원두나 음료 이름 중 하나를 입력해주세요.' : '');
    setSatisfactionError(!satisfaction ? '마신 느낌을 하나 골라주세요.' : '');
    if (missingName || !satisfaction) return;

    setSaving(true);
    try {
      const input = {
        beanName: normalizedBean || normalizedDrink,
        cafeName: cafeName.trim(),
        drinkName: normalizedDrink,
        satisfaction,
        flavorTags: tags,
        memo: memo.trim(),
        imageUri,
      };
      if (cupId) {
        await updateCafeCup(db, cupId, input);
        showFeedback('카페 기록을 수정했어요.');
      } else {
        const saved = await createCafeCup(db, input);
        showFeedback({
          message: '카페 기록을 저장했어요.',
          actionLabel: '실행 취소',
          onAction: async () => {
            await deleteCup(db, saved.id);
            showFeedback('방금 저장한 기록을 삭제했어요.');
            router.replace(`/(tabs)/journal?refresh=${Date.now()}`);
          },
        });
      }
      allowExit();
      router.replace('/(tabs)/journal');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '카페 기록을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('사진 보관함 권한이 없어요. 사진 없이도 기록할 수 있어요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  if (loading) return <Screen showNavigation={false}><Text>카페 기록을 불러오고 있어요.</Text></Screen>;

  return (
      <Screen showNavigation={false} header={<TaskHeader title={cupId ? '카페 기록 수정' : '카페에서 마신 커피'} onClose={() => requestExit(() => goBackOrReplace('/(tabs)/journal'))} />} footer={<BottomActionBar primaryLabel={cupId ? '변경사항 저장' : '기록 저장'} primaryLoading={saving} onPrimaryPress={() => void save()} />}>
        <PageIntro>{cupId ? '바뀐 내용만 고쳐주세요.' : '기억하고 싶은 것만 간단히 남겨보세요.'}</PageIntro>
        {error ? <Text accessibilityRole="alert" color={colors.error}>{error}</Text> : null}
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} accessibilityLabel="커피 사진" /> : null}
        <Button label={imageUri ? '사진 바꾸기' : '사진 추가'} variant="secondary" icon="camera.fill" onPress={() => void pickImage()} />
        <Field label="카페 이름" value={cafeName} onChangeText={setCafeName} placeholder="선택 사항" />
        <Field
          label="원두 또는 메뉴 이름"
          value={beanName}
          onChangeText={(value) => { setBeanName(value); setNameError(''); }}
          placeholder="예: 에티오피아 구지"
          error={nameError}
          hint="정확한 원두를 모르면 음료 종류만 적어도 괜찮아요."
        />
        <Field
          label="음료 종류"
          value={drinkName}
          onChangeText={(value) => { setDrinkName(value); setNameError(''); }}
          placeholder="예: 필터 커피"
        />
        <Text variant="label">어땠나요?</Text>
        <View style={styles.row}>
          {(['not_for_me', 'good', 'loved'] as Satisfaction[]).map((value) => (
            <Chip key={value} label={satisfactionLabel[value]} selected={satisfaction === value} onPress={() => { setSatisfaction(value); setSatisfactionError(''); }} />
          ))}
        </View>
        {satisfactionError ? <Text accessibilityRole="alert" variant="caption" color={colors.error}>{satisfactionError}</Text> : null}
        <Text variant="label">기억나는 맛 (선택)</Text>
        <View style={styles.row}>
          {flavors.map((tag) => <Chip key={tag} label={localizedFlavor(tag)} selected={tags.includes(tag)} onPress={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} />)}
        </View>
        <Field label="한 줄 메모" value={memo} onChangeText={setMemo} multiline style={styles.memo} />
        {exitConfirmation}
      </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact },
  photo: { width: '100%', height: 220, borderRadius: 18 },
  memo: { minHeight: 120, textAlignVertical: 'top' },
});
