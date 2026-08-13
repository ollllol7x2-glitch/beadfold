import { useState } from 'react';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { AppNavigation, Button, Chip, Field, PageHeader, Screen, Text } from '@/components/ui';
import { createCafeCup } from '@/database/repository';
import { localizedFlavor, satisfactionLabel, type Satisfaction } from '@/domain/types';
import { colors, spacing } from '@/design-system/tokens';
import { Image, StyleSheet, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const flavors = ['Floral', 'Fruity', 'Juicy', 'Sweet', 'Clean', 'Creamy', 'Nutty', 'Roasty', 'Funky'];

export default function RecordCafeScreen() {
  const db = useSQLiteContext(); const [cafeName, setCafeName] = useState(''); const [beanName, setBeanName] = useState(''); const [drinkName, setDrinkName] = useState('필터 커피'); const [satisfaction, setSatisfaction] = useState<Satisfaction | null>(null); const [tags, setTags] = useState<string[]>([]); const [memo, setMemo] = useState(''); const [imageUri, setImageUri] = useState<string | null>(null); const [error, setError] = useState('');
  const save = async () => { if (!beanName.trim() && !drinkName.trim()) return setError('원두 이름이나 음료 이름 중 하나를 입력해주세요.'); if (!satisfaction) return setError('마신 느낌을 하나 골라주세요.'); await createCafeCup(db, { beanName: beanName.trim() || drinkName.trim(), cafeName: cafeName.trim(), drinkName: drinkName.trim(), satisfaction, flavorTags: tags, memo, imageUri }); router.replace('/(tabs)/journal'); };
  const pickImage = async () => { const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return setError('사진 보관함 권한이 없어요. 사진 없이도 기록할 수 있어요.'); const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }); if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri); };
  return <View style={styles.shell}><Screen showNavigation={false}><PageHeader title="카페에서 마신 커피" description="기억하고 싶은 것만 간단히 남겨보세요." action={<Button label="닫기" variant="tertiary" onPress={() => router.back()} />} />{error ? <Text accessibilityRole="alert" color={colors.error}>{error}</Text> : null}{imageUri ? <Image source={{ uri: imageUri }} style={styles.photo} accessibilityLabel="커피 사진" /> : null}<Button label={imageUri ? '사진 바꾸기' : '사진 추가'} variant="secondary" icon="camera.fill" onPress={() => void pickImage()} /><Field label="카페 이름" value={cafeName} onChangeText={setCafeName} placeholder="선택 사항" /><Field label="원두 또는 메뉴 이름" value={beanName} onChangeText={setBeanName} /><Field label="음료" value={drinkName} onChangeText={setDrinkName} /><Text variant="label">어땠나요?</Text><View style={styles.row}>{(['not_for_me','good','loved'] as Satisfaction[]).map((value) => <Chip key={value} label={satisfactionLabel[value]} selected={satisfaction === value} onPress={() => setSatisfaction(value)} />)}</View><Text variant="label">기억나는 맛 (선택)</Text><View style={styles.row}>{flavors.map((tag) => <Chip key={tag} label={localizedFlavor(tag)} selected={tags.includes(tag)} onPress={() => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag])} />)}</View><Field label="한 줄 메모" value={memo} onChangeText={setMemo} multiline style={styles.memo} /><Button label="기록 저장" onPress={() => void save()} /></Screen><AppNavigation /></View>;
}
const styles = StyleSheet.create({ shell: { flex: 1, backgroundColor: colors.cream }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, photo: { width: '100%', height: 220, borderRadius: 18 }, memo: { minHeight: 120, textAlignVertical: 'top' } });
