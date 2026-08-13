import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { Button, Card, Chip, Field, Icon, PageHeader, Screen, Text } from '@/components/ui';
import { createBean, getBean, matchKnowledgeFromLabel, trackEvent, updateBean } from '@/database/repository';
import type { BeanLot, BeanState, RoastLevel } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

const roastLevels: { value: RoastLevel; label: string }[] = [
  { value: 'light', label: '약배전' }, { value: 'medium-light', label: '중약배전' },
  { value: 'medium', label: '중배전' }, { value: 'medium-dark', label: '중강배전' }, { value: 'dark', label: '강배전' },
];
const beanStates: { value: BeanState; label: string }[] = [
  { value: 'unopened', label: '미개봉' }, { value: 'opened', label: '개봉' },
  { value: 'frozen', label: '냉동' }, { value: 'finished', label: '다 마심' },
];

export default function AddBeanScreen() {
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const db = useSQLiteContext();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('200');
  const [initialWeight, setInitialWeight] = useState(200);
  const [detailsOpen, setDetailsOpen] = useState(Boolean(editId));
  const [searchOpen, setSearchOpen] = useState(false);
  const [labelText, setLabelText] = useState('');
  const [roaster, setRoaster] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [variety, setVariety] = useState('');
  const [process, setProcess] = useState('');
  const [roastDate, setRoastDate] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('light');
  const [storageType, setStorageType] = useState('bag');
  const [beanState, setBeanState] = useState<BeanState>('opened');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<BeanLot | null>(null);
  const [saved, setSaved] = useState<BeanLot | null>(null);

  useEffect(() => {
    if (!editId) void trackEvent(db, 'bean_add_started');
    if (!editId) return;
    let active = true;
    void getBean(db, editId).then((bean) => {
      if (!active || !bean) return;
      setExisting(bean); setName(bean.name); setRoaster(bean.roaster); setCountry(bean.country); setRegion(bean.region);
      setVariety(bean.variety); setProcess(bean.process); setRoastDate(bean.roastDate ?? ''); setRoastLevel(bean.roastLevel);
      setWeight(String(bean.remainingWeightG)); setInitialWeight(bean.initialWeightG); setNotes(bean.tastingNotes.join(', '));
      setDescription(bean.description); setImageUri(bean.imageUri); setStorageType(bean.storageType); setBeanState(bean.state);
    });
    return () => { active = false; };
  }, [db, editId]);

  const pickImage = async (camera: boolean) => {
    const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError(`${camera ? '카메라' : '사진 보관함'} 권한이 없어요. 이름만 입력해도 원두를 추가할 수 있어요.`);
    const result = camera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setDetailsOpen(true);
      setStatus('사진을 추가했어요. 봉투를 보면서 필요한 정보만 적어주세요.');
      void trackEvent(db, 'bean_photo_added', { source: camera ? 'camera' : 'gallery' });
    }
  };

  const findFromLabel = async () => {
    const query = labelText.trim();
    if (!query) return setError('봉투에 적힌 원두 이름이나 산지를 입력해주세요.');
    void trackEvent(db, 'bean_search', { query_length: query.length });
    const matches = await matchKnowledgeFromLabel(db, query);
    for (const match of matches) {
      if (match.category === 'country' && !country) setCountry(match.name);
      if (match.category === 'region' && !region) { setRegion(match.name); if (!country && match.parent_name) setCountry(match.parent_name); }
      if (match.category === 'variety' && !variety) setVariety(match.name);
      if (match.category === 'process' && !process) setProcess(match.name);
    }
    setName((current) => current || query);
    setSearchOpen(false);
    setDetailsOpen(matches.length > 0);
    setStatus(matches.length ? `봉투 문구에서 ${matches.length}개 정보를 찾았어요. 확인한 뒤 저장해주세요.` : '이름을 먼저 채웠어요. 나머지는 나중에 입력해도 됩니다.');
    setError('');
  };

  const save = async () => {
    const grams = Number(weight);
    if (!name.trim()) return setError('원두 이름을 입력해주세요.');
    if (!Number.isFinite(grams) || grams <= 0 || grams > 10000) return setError('남은 양을 1g부터 10,000g 사이로 입력해주세요.');
    setSaving(true);
    try {
      const draft = {
        name: name.trim(), roaster: roaster.trim(), country: country.trim(), region: region.trim(), farm: '',
        variety: variety.trim(), process: process.trim(), altitude: '', roastDate: /^\d{4}-\d{2}-\d{2}$/.test(roastDate) ? roastDate : null,
        roastLevel, initialWeightG: existing ? Math.max(initialWeight, grams) : grams, remainingWeightG: grams,
        storageType, state: beanState, tastingNotes: notes.split(',').map((note) => note.trim()).filter(Boolean),
        description: description.trim(), imageUri,
      };
      const bean = existing ? { ...existing, ...draft } : await createBean(db, draft);
      if (existing) await updateBean(db, bean);
      if (existing) router.replace(`/bean/${bean.id}`); else setSaved(bean);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '원두를 저장하지 못했어요.');
    } finally { setSaving(false); }
  };

  if (saved) {
    return <Screen showNavigation={false} contentContainerStyle={styles.successScreen}>
      <View style={styles.successIcon}><Icon name="checkmark" size={32} color={colors.cream} weight="bold" /></View>
      <View style={styles.successCopy}><Text variant="title1" accessibilityRole="header">원두를 추가했어요</Text><Text variant="bodyLarge" color={colors.neutral800}>{saved.name}. 지금 바로 내리거나, 정보를 더 채울 수 있어요.</Text></View>
      <Button label="이 원두로 바로 내리기" icon="waterbottle.fill" onPress={() => router.replace(`/recipe/guided?beanId=${saved.id}`)} />
      <Button label="원두 정보 더 입력하기" variant="secondary" onPress={() => { setExisting(saved); setSaved(null); setDetailsOpen(true); }} />
      <Button label="보관함에서 보기" variant="tertiary" onPress={() => router.replace(`/bean/${saved.id}`)} />
    </Screen>;
  }

  return <Screen showNavigation={false} contentContainerStyle={styles.screen}>
    <PageHeader title={existing ? '원두 정보 수정' : '새 원두 추가'} description={existing ? '바뀐 정보만 고쳐주세요.' : '이름과 남은 양만 알면 바로 시작할 수 있어요.'} action={<Button label="닫기" variant="tertiary" onPress={() => router.back()} />} />

    {!existing ? <View style={styles.sources}>
      <SourceAction icon="camera.fill" title="봉투 촬영" body="사진을 보며 필요한 정보만 적어요" onPress={() => void pickImage(true)} />
      <SourceAction icon="magnifyingglass" title="이름으로 찾기" body="봉투 문구에서 정보를 찾아요" onPress={() => setSearchOpen((current) => !current)} />
    </View> : null}

    {searchOpen ? <Card tone="tinted">
      <Text variant="title3">봉투에는 뭐라고 적혀 있나요?</Text>
      <Field label="원두 이름 또는 산지" value={labelText} onChangeText={setLabelText} placeholder="예: Ethiopia Guji Washed" onSubmitEditing={() => void findFromLabel()} />
      <Button label="정보 찾기" variant="secondary" onPress={() => void findFromLabel()} />
    </Card> : null}

    {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} accessibilityLabel="선택한 원두 패키지 사진" /> : null}
    {status ? <Text accessibilityLiveRegion="polite" color={colors.success}>{status}</Text> : null}
    {error ? <Text accessibilityRole="alert" color={colors.error}>{error}</Text> : null}

    <Card style={styles.quickCard}>
      <View><Text variant="title2">빠른 추가</Text><Text color={colors.neutral800}>두 가지만 입력하면 저장할 수 있어요.</Text></View>
      <Field label="원두 이름" value={name} onChangeText={setName} placeholder="예: 과테말라 엘 인헤르토" />
      <Field label="남은 양 (g)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
    </Card>

    <Pressable accessibilityRole="button" accessibilityLabel={`원두 정보 더 입력하기, 현재 ${detailsOpen ? '펼쳐짐' : '접힘'}`} onPress={() => setDetailsOpen((current) => !current)} style={styles.disclosure}>
      <View style={styles.disclosureCopy}><Text variant="title3">원두 정보 더 입력하기</Text><Text color={colors.neutral800}>산지, 가공법, 로스팅 정보는 선택 사항이에요.</Text></View>
      <Icon name={detailsOpen ? 'chevron.up' : 'chevron.down'} size={22} />
    </Pressable>

    {detailsOpen ? <View style={styles.details}>
      {!imageUri ? <Button label="봉투 사진 추가" variant="secondary" icon="camera.fill" onPress={() => void pickImage(false)} /> : null}
      <Field label="로스터" value={roaster} onChangeText={setRoaster} placeholder="선택 사항" />
      <View style={styles.two}><View style={styles.flex}><Field label="국가" value={country} onChangeText={setCountry} /></View><View style={styles.flex}><Field label="산지" value={region} onChangeText={setRegion} /></View></View>
      <View style={styles.two}><View style={styles.flex}><Field label="품종" value={variety} onChangeText={setVariety} /></View><View style={styles.flex}><Field label="가공 방식" value={process} onChangeText={setProcess} /></View></View>
      <Field label="로스팅 날짜" value={roastDate} onChangeText={setRoastDate} placeholder="YYYY-MM-DD" hint="정확히 모르면 비워두세요." />
      <Text variant="label">로스팅 정도</Text><View style={styles.chips}>{roastLevels.map((level) => <Chip key={level.value} label={level.label} selected={roastLevel === level.value} onPress={() => setRoastLevel(level.value)} />)}</View>
      <Text variant="label">원두 상태</Text><View style={styles.chips}>{beanStates.map((state) => <Chip key={state.value} label={state.label} selected={beanState === state.value} onPress={() => setBeanState(state.value)} />)}</View>
      <Field label="보관 방식" value={storageType} onChangeText={setStorageType} placeholder="예: 원두 봉투" />
      <Field label="봉투에 적힌 맛" value={notes} onChangeText={setNotes} placeholder="예: 자스민, 복숭아, 홍차" hint="쉼표로 구분해주세요." />
      <Field label="메모" value={description} onChangeText={setDescription} multiline placeholder="기억할 내용을 자유롭게 남겨주세요." style={styles.memo} />
    </View> : null}

    <Button label={existing ? '변경사항 저장' : '원두 추가'} loading={saving} onPress={() => void save()} style={styles.saveButton} />
  </Screen>;
}

function SourceAction({ icon, title, body, onPress }: { icon: Parameters<typeof Icon>[0]['name']; title: string; body: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${body}`} onPress={onPress} style={({ pressed }) => [styles.source, pressed && styles.pressed]}>
    <View style={styles.sourceIcon}><Icon name={icon} size={25} /></View><View style={styles.flex}><Text variant="label">{title}</Text><Text variant="caption" color={colors.neutral600}>{body}</Text></View>
  </Pressable>;
}

const styles = StyleSheet.create({
  screen: { gap: spacing.section }, successScreen: { flex: 1, justifyContent: 'center', gap: spacing.default },
  successIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }, successCopy: { gap: spacing.compact, marginBottom: spacing.small },
  sources: { flexDirection: 'row', gap: spacing.compact }, source: { flex: 1, minHeight: 92, padding: spacing.small, gap: spacing.compact, borderRadius: radius.large, backgroundColor: colors.creamDeep },
  sourceIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  quickCard: { gap: spacing.default }, disclosure: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingVertical: spacing.compact }, disclosureCopy: { flex: 1, gap: 2 },
  details: { gap: spacing.default }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, two: { flexDirection: 'row', gap: spacing.small }, flex: { flex: 1 },
  preview: { width: '100%', height: 210, borderRadius: radius.large }, memo: { minHeight: 100, textAlignVertical: 'top' }, saveButton: { minHeight: 60 }, pressed: { opacity: 0.65 },
});
