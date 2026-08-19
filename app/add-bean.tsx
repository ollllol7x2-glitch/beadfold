import { useEffect, useRef, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AutocompleteField, BottomActionBar, BottomSheet, Button, Card, Chip, DateField, Field, goBackOrReplace, Icon, Screen, TaskHeader, Text } from '@/components/ui';
import { createBean, defaultBeanTemplateSuggestions, getBean, matchKnowledgeFromLabel, searchBeanSuggestions, searchBeanTemplateSuggestions, searchKnowledgeSuggestions, trackEvent, updateBean, type BeanSearchSuggestion, type BeanTemplateSuggestion, type KnowledgeSearchSuggestion } from '@/database/repository';
import type { BeanLot, BeanState, RoastLevel } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';
import { useFeedback } from '@/components/feedback';
import { isBeanLabelOcrAvailable, recognizeBeanLabel, type BeanLabelOcrResult } from '@/services/beanLabelOcr';
import { uploadBeanLabelPhoto } from '@/services/beanLabelStorage';
import { useResolvedImageUri } from '@/hooks/useResolvedImageUri';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useFirstInvalidField } from '@/hooks/useFirstInvalidField';

const roastLevels: { value: RoastLevel; label: string }[] = [
  { value: 'unknown', label: '모름' },
  { value: 'light', label: '약배전' }, { value: 'medium-light', label: '중약배전' },
  { value: 'medium', label: '중배전' }, { value: 'medium-dark', label: '중강배전' }, { value: 'dark', label: '강배전' },
];
const beanStates: { value: BeanState; label: string }[] = [
  { value: 'unspecified', label: '나중에 입력' },
  { value: 'unopened', label: '미개봉' }, { value: 'opened', label: '개봉' },
  { value: 'frozen', label: '냉동' }, { value: 'finished', label: '다 마심' },
];

export default function AddBeanScreen() {
  const { editId, copyFromId } = useLocalSearchParams<{ editId?: string; copyFromId?: string }>();
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [initialWeight, setInitialWeight] = useState(0);
  const [detailsOpen, setDetailsOpen] = useState(Boolean(editId || copyFromId));
  const [searchOpen, setSearchOpen] = useState(false);
  const [photoSourceOpen, setPhotoSourceOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'back' | 'front'>('back');
  const [capturing, setCapturing] = useState(false);
  const [labelText, setLabelText] = useState('');
  const [labelError, setLabelError] = useState('');
  const [roaster, setRoaster] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [variety, setVariety] = useState('');
  const [process, setProcess] = useState('');
  const [roastDate, setRoastDate] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('unknown');
  const [storageType, setStorageType] = useState('');
  const [beanState, setBeanState] = useState<BeanState>('unspecified');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [nameError, setNameError] = useState('');
  const [weightError, setWeightError] = useState('');
  const [beanSuggestions, setBeanSuggestions] = useState<BeanSearchSuggestion[]>([]);
  const [beanTemplateSuggestions, setBeanTemplateSuggestions] = useState<BeanTemplateSuggestion[]>(defaultBeanTemplateSuggestions);
  const [dismissedBeanSuggestion, setDismissedBeanSuggestion] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<BeanLot | null>(null);
  const [saved, setSaved] = useState<BeanLot | null>(null);
  const [baseline, setBaseline] = useState('');
  const { fieldRef, focusField } = useFirstInvalidField();
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const resolvedImageUri = useResolvedImageUri(imageUri);

  const formSnapshot = JSON.stringify({ name, weight, roaster, country, region, variety, process, roastDate, roastLevel, storageType, beanState, notes, description, imageUri });
  const isDirty = existing ? Boolean(baseline) && baseline !== formSnapshot : Boolean(name || weight || roaster || country || region || variety || process || roastDate || storageType || notes || description || imageUri);
  const visibleBeanTemplates = beanTemplateSuggestions.length ? beanTemplateSuggestions : defaultBeanTemplateSuggestions;
  const { requestExit, allowExit, exitConfirmation } = useUnsavedChangesGuard(isDirty);

  useEffect(() => {
    if (!editId && !copyFromId) void trackEvent(db, 'bean_add_started');
    const sourceId = editId ?? copyFromId;
    if (!sourceId) return;
    let active = true;
    void getBean(db, sourceId).then((bean) => {
      if (!active || !bean) return;
      setName(bean.name); setRoaster(bean.roaster); setCountry(bean.country); setRegion(bean.region);
      setVariety(bean.variety); setProcess(bean.process); setRoastLevel(bean.roastLevel); setNotes(bean.tastingNotes.join(', '));
      setDescription(bean.description); setStorageType(bean.storageType);
      if (editId) {
        setExisting(bean); setRoastDate(bean.roastDate ?? ''); setWeight(String(bean.remainingWeightG)); setInitialWeight(bean.initialWeightG);
        setImageUri(bean.imageUri); setBeanState(bean.state); setBaseline(beanFormSnapshot(bean));
      } else {
        setRoastDate(''); setWeight(''); setInitialWeight(0); setImageUri(null); setBeanState('unopened');
        setStatus(`${bean.name}의 원두 정보만 가져왔어요. 이번 구매분의 무게와 로스팅 날짜를 새로 입력해주세요.`);
      }
    });
    return () => { active = false; };
  }, [copyFromId, db, editId]);

  useEffect(() => {
    const query = name.trim();
    if (query.length < 2 || query === dismissedBeanSuggestion) return;
    let active = true;
    void searchBeanSuggestions(db, query, existing?.id).then((suggestions) => { if (active) setBeanSuggestions(suggestions); });
    return () => { active = false; };
  }, [db, dismissedBeanSuggestion, existing?.id, name]);

  useEffect(() => {
    const query = name.trim();
    if (query && query === dismissedBeanSuggestion) return;
    let active = true;
    void searchBeanTemplateSuggestions(db, query).then((suggestions) => { if (active) setBeanTemplateSuggestions(suggestions); });
    return () => { active = false; };
  }, [db, dismissedBeanSuggestion, name]);

  const applyImageAsset = async (asset: { uri: string; base64?: string | null; mimeType?: string | null }, source: 'camera' | 'gallery') => {
    let persistedUri = asset.uri;
    if (asset.base64) {
      try {
        persistedUri = await uploadBeanLabelPhoto({ base64: asset.base64, beanId: existing?.id, mimeType: asset.mimeType, source });
        setStatus('봉투 사진을 안전하게 보관했어요.');
      } catch (caught) {
        setStatus(caught instanceof Error ? `${caught.message} 이 기기에서는 사진을 확인할 수 있어요.` : '사진을 클라우드에 보관하지 못했어요. 이 기기에서는 사진을 확인할 수 있어요.');
      }
    }
    setImageUri(persistedUri);
    setDetailsOpen(true);
    void trackEvent(db, 'bean_photo_added', { source });
    if (!isBeanLabelOcrAvailable() || !asset.base64) {
      setStatus('사진을 추가했어요. 봉투를 보면서 필요한 정보만 적어주세요.');
      return;
    }
    setRecognizing(true);
    setStatus('봉투 정보를 읽고 있어요. 잠시만 기다려주세요.');
    try {
      const result = await recognizeBeanLabel(asset.base64);
      await applyOcrResult(result);
    } catch (caught) {
      setStatus(caught instanceof Error ? `${caught.message} 사진을 보며 직접 입력할 수 있어요.` : '자동 인식에 실패했어요. 사진을 보며 직접 입력할 수 있어요.');
    } finally {
      setRecognizing(false);
    }
  };

  const pickFromLibrary = async () => {
    setPhotoSourceOpen(false);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return setError('사진 보관함 권한이 없어요. 이름만 입력해도 원두를 추가할 수 있어요.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    if (!result.canceled && result.assets[0]) await applyImageAsset(result.assets[0], 'gallery');
  };

  const openCamera = async () => {
    setPhotoSourceOpen(false);
    const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!permission.granted) return setError('카메라 권한이 없어요. 사진 보관함에서 선택하거나 이름만 입력해도 원두를 추가할 수 있어요.');
    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: true });
      if (!photo) return;
      setCameraOpen(false);
      await applyImageAsset(photo, 'camera');
    } catch (caught) {
      setCameraOpen(false);
      setError(caught instanceof Error ? `사진을 촬영하지 못했어요. ${caught.message}` : '사진을 촬영하지 못했어요.');
    } finally {
      setCapturing(false);
    }
  };

  const applyOcrResult = async (result: BeanLabelOcrResult) => {
    const matches = await matchKnowledgeFromLabel(db, result.fullText);
    const { candidates } = result;
    setName((current) => current || candidates.beanName || '');
    setRoaster((current) => current || candidates.roaster || '');
    setRoastDate((current) => current || candidates.roastDate || '');
    setRoastLevel((current) => current === 'unknown' && candidates.roastLevel ? candidates.roastLevel : current);
    setNotes((current) => current || candidates.tastingNotes?.join(', ') || '');
    for (const match of matches) {
      if (match.category === 'country') setCountry((current) => current || match.name);
      if (match.category === 'region') {
        setRegion((current) => current || match.name);
        if (match.parent_name) setCountry((current) => current || match.parent_name || '');
      }
      if (match.category === 'variety') setVariety((current) => current || match.name);
      if (match.category === 'process') setProcess((current) => current || match.name);
    }
    const candidateCount = Object.values(candidates).filter(Boolean).length + matches.length;
    setStatus(candidateCount ? `봉투에서 ${candidateCount}개 정보를 채웠어요. 저장 전 내용을 확인해주세요.` : '글자는 읽었지만 확실한 정보를 찾지 못했어요. 사진을 보며 직접 입력해주세요.');
  };

  const findFromLabel = async () => {
    const query = labelText.trim();
    if (!query) { setLabelError('봉투에 적힌 원두 이름이나 산지를 입력해주세요.'); focusField('labelText'); return; }
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
    if (!name.trim()) { setNameError('원두 이름을 입력해주세요.'); focusField('name'); return; }
    if (!Number.isFinite(grams) || grams <= 0 || grams > 10000) { setWeightError('남은 양을 1g부터 10,000g 사이로 입력해주세요.'); focusField('weight'); return; }
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
      if (existing) {
        showFeedback('원두 정보를 수정했어요.');
        allowExit();
        router.replace(`/bean/${bean.id}`);
      } else setSaved(bean);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '원두를 저장하지 못했어요.');
    } finally { setSaving(false); }
  };

  if (saved) {
    return <Screen showNavigation={false} contentContainerStyle={styles.successScreen}>
      <View style={styles.successIcon}><Icon name="checkmark" size={32} color={colors.cream} weight="bold" /></View>
      <View style={styles.successCopy}><Text variant="title1" accessibilityRole="header">원두를 추가했어요</Text><Text variant="bodyLarge" color={colors.neutral600}>{saved.name}. 지금 바로 내리거나, 정보를 더 채울 수 있어요.</Text></View>
      <Button label="이 원두로 바로 내리기" icon="cup.and.heat.waves.fill" onPress={() => { router.dismissAll(); router.push(`/recipe/guided?beanId=${saved.id}`); }} />
      <Button label="원두 정보 더 입력하기" variant="secondary" onPress={() => { setExisting(saved); setBaseline(beanFormSnapshot(saved)); setSaved(null); setDetailsOpen(true); }} />
      <Button label="보관함에서 보기" variant="tertiary" onPress={() => { router.dismissAll(); router.push('/(tabs)/collection'); }} />
    </Screen>;
  }

  return <Screen showNavigation={false} header={<TaskHeader title={existing ? '원두 정보 수정' : copyFromId ? '새 구매 원두 추가' : '새 원두 추가'} onClose={() => requestExit(() => goBackOrReplace(existing ? `/bean/${existing.id}` : copyFromId ? `/bean/${copyFromId}` : '/(tabs)/collection'))} />} contentContainerStyle={styles.screen} footer={<BottomActionBar primaryLabel={existing ? '변경사항 저장' : '원두 추가'} primaryLoading={saving} onPrimaryPress={() => void save()} />}>

    {!existing ? <View style={styles.sources}>
      <SourceAction icon="camera.fill" title="봉투 촬영" body="촬영하거나 사진 보관함에서 불러와요" onPress={() => setPhotoSourceOpen(true)} />
      <SourceAction icon="magnifyingglass" title="이름으로 찾기" body="봉투 문구에서 정보를 찾아요" onPress={() => setSearchOpen((current) => !current)} />
    </View> : null}

    {searchOpen ? <Card tone="tinted">
      <Text variant="title3">봉투에는 뭐라고 적혀 있나요?</Text>
      <Field ref={fieldRef('labelText')} label="원두 이름 또는 산지" value={labelText} onChangeText={(value) => { setLabelText(value); setLabelError(''); }} placeholder="예: Ethiopia Guji Washed" onSubmitEditing={() => void findFromLabel()} error={labelError} />
      <Button label="정보 찾기" variant="secondary" onPress={() => void findFromLabel()} />
    </Card> : null}

    {resolvedImageUri ? <Image source={{ uri: resolvedImageUri }} style={styles.preview} accessibilityLabel="선택한 원두 패키지 사진" /> : null}
    {recognizing ? <Card tone="tinted"><View style={styles.scanStatus}><Icon name="magnifyingglass" size={21} color={colors.espresso} /><View style={styles.flex}><Text variant="title3">봉투 정보 확인 중</Text><Text color={colors.neutral600}>원두명과 산지, 로스팅 정보를 읽고 있어요.</Text></View></View></Card> : null}
    {status ? <Text accessibilityLiveRegion="polite" color={colors.neutral600}>{status}</Text> : null}
    {error ? <Text accessibilityRole="alert" color={colors.error}>{error}</Text> : null}

    <Card style={styles.quickCard}>
      <View><Text variant="title2">빠른 추가</Text><Text color={colors.neutral600}>두 가지만 입력하면 저장할 수 있어요.</Text></View>
      <AutocompleteField ref={fieldRef('name')} label="원두 이름" value={name} onChangeText={(value) => { setName(value); setDismissedBeanSuggestion(''); setNameError(''); setError(''); }} placeholder="예: 과테말라 엘 인헤르토" error={nameError} suggestions={[
        ...(name.trim().length >= 2 && name.trim() !== dismissedBeanSuggestion ? beanSuggestions.map((suggestion) => ({ id: `saved-${suggestion.bean.id}`, title: suggestion.bean.name, description: [suggestion.bean.roaster, suggestion.bean.country, suggestion.bean.region].filter(Boolean).join(' · ') || '이전에 등록한 원두', group: '이전에 등록한 원두' })) : []),
        ...(name.trim().length >= 2 && name.trim() !== dismissedBeanSuggestion ? visibleBeanTemplates.map((template) => ({ id: `template-${template.id}`, title: template.name, description: template.description, group: '대표 원두 템플릿' })) : []),
      ]} onSuggestionPress={(suggestion) => {
        const template = visibleBeanTemplates.find((item) => `template-${item.id}` === suggestion.id);
        if (template) {
          setName(template.name); setDismissedBeanSuggestion(template.name); setBeanTemplateSuggestions([]);
          setCountry(template.country); setRegion(template.region); setVariety(template.variety); setProcess(template.process); setDetailsOpen(true);
          setStatus(`${template.name} 템플릿을 채웠어요. 로스터, 무게, 로스팅 날짜는 이번 구매분에 맞게 입력해주세요.`); return;
        }
        const selected = beanSuggestions.find((item) => `saved-${item.bean.id}` === suggestion.id)?.bean;
        if (!selected) return;
        setName(selected.name); setDismissedBeanSuggestion(selected.name); setBeanSuggestions([]);
        setRoaster((current) => current || selected.roaster); setCountry((current) => current || selected.country); setRegion((current) => current || selected.region);
        setVariety((current) => current || selected.variety); setProcess((current) => current || selected.process); setNotes((current) => current || selected.tastingNotes.join(', '));
        setDetailsOpen(true); setStatus(`${selected.name}의 저장된 정보만 가져왔어요. 이번 구매분의 무게와 로스팅 날짜는 새로 입력해주세요.`);
      }} />
      <Field ref={fieldRef('weight')} label="남은 양 (g)" value={weight} onChangeText={(value) => { setWeight(value); setWeightError(''); setError(''); }} keyboardType="decimal-pad" placeholder="예: 200" hint="봉투에 남은 양을 대략 적어도 괜찮아요." error={weightError} />
    </Card>

    <Pressable accessibilityRole="button" accessibilityLabel={`원두 정보 더 입력하기, 현재 ${detailsOpen ? '펼쳐짐' : '접힘'}`} onPress={() => setDetailsOpen((current) => !current)} style={styles.disclosure}>
      <View style={styles.disclosureCopy}><Text variant="title3">원두 정보 더 입력하기</Text><Text color={colors.neutral600}>산지, 가공법, 로스팅 정보는 선택 사항이에요.</Text></View>
      <Icon name={detailsOpen ? 'chevron.up' : 'chevron.down'} size={22} />
    </Pressable>

    {detailsOpen ? <View style={styles.details}>
      {!imageUri ? <Button label="봉투 사진 추가" variant="secondary" icon="camera.fill" onPress={() => setPhotoSourceOpen(true)} /> : null}
      <Field label="로스터" value={roaster} onChangeText={setRoaster} placeholder="선택 사항" />
      <KnowledgeField category="country" label="국가" value={country} onChangeText={setCountry} />
      <KnowledgeField category="region" label="산지" value={region} onChangeText={setRegion} parentName={country} onSelect={(suggestion) => { if (!country && suggestion.parentName) setCountry(suggestion.parentName); }} />
      <KnowledgeField category="variety" label="품종" value={variety} onChangeText={setVariety} />
      <KnowledgeField category="process" label="가공 방식" value={process} onChangeText={setProcess} />
      <DateField label="로스팅 날짜" value={roastDate} onChange={setRoastDate} hint="정확히 모르면 비워두세요." />
      <Text variant="label">로스팅 정도</Text><View style={styles.chips}>{roastLevels.map((level) => <Chip key={level.value} label={level.label} selected={roastLevel === level.value} onPress={() => setRoastLevel(level.value)} />)}</View>
      <Text variant="label">원두 상태</Text><View style={styles.chips}>{beanStates.map((state) => <Chip key={state.value} label={state.label} selected={beanState === state.value} onPress={() => setBeanState(state.value)} />)}</View>
      <Field label="보관 방식" value={storageType} onChangeText={setStorageType} placeholder="예: 원두 봉투" />
      <Field label="봉투에 적힌 맛" value={notes} onChangeText={setNotes} placeholder="예: 자스민, 복숭아, 홍차" hint="쉼표로 구분해주세요." />
      <Field label="메모" value={description} onChangeText={setDescription} multiline placeholder="기억할 내용을 자유롭게 남겨주세요." style={styles.memo} />
    </View> : null}

    <BottomSheet visible={photoSourceOpen} title="봉투 사진 추가" onClose={() => setPhotoSourceOpen(false)}>
      <Button label="카메라로 촬영" icon="camera.fill" onPress={() => void openCamera()} />
      <Button label="사진 보관함에서 선택" variant="secondary" onPress={() => void pickFromLibrary()} />
    </BottomSheet>
    <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
      <View style={styles.cameraScreen}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={cameraFacing} />
        <View style={styles.cameraTop}><Pressable accessibilityRole="button" accessibilityLabel="봉투 촬영 닫기" onPress={() => setCameraOpen(false)} style={styles.cameraControl}><Icon name="xmark" size={25} color={colors.white} weight="bold" /></Pressable></View>
        <View style={styles.cameraControls}>
          <View style={styles.cameraControlPlaceholder} />
          <Pressable accessibilityRole="button" accessibilityLabel="사진 촬영" accessibilityState={{ disabled: capturing }} disabled={capturing} onPress={() => void capturePhoto()} style={({ pressed }) => [styles.cameraShutter, pressed && styles.pressed, capturing && styles.disabled]}><View style={styles.cameraShutterInner} /></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="전면 카메라로 전환" onPress={() => setCameraFacing((current) => current === 'back' ? 'front' : 'back')} style={styles.cameraControl}><Icon name="arrow.triangle.2.circlepath" size={25} color={colors.white} /></Pressable>
        </View>
      </View>
    </Modal>
    {exitConfirmation}
  </Screen>;
}

function SourceAction({ icon, title, body, onPress }: { icon: Parameters<typeof Icon>[0]['name']; title: string; body: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${body}`} onPress={onPress} style={({ pressed }) => [styles.source, pressed && styles.pressed]}>
    <View style={styles.sourceIcon}><Icon name={icon} size={25} /></View><View style={styles.flex}><Text variant="label">{title}</Text><Text variant="caption" color={colors.neutral600}>{body}</Text></View>
  </Pressable>;
}

function KnowledgeField({ category, label, value, onChangeText, parentName, onSelect }: { category: 'country' | 'region' | 'variety' | 'process'; label: string; value: string; onChangeText: (value: string) => void; parentName?: string; onSelect?: (suggestion: KnowledgeSearchSuggestion) => void }) {
  const db = useSQLiteContext();
  const [suggestions, setSuggestions] = useState<KnowledgeSearchSuggestion[]>([]);
  const [dismissedValue, setDismissedValue] = useState('');
  useEffect(() => {
    const query = value.trim();
    if (!query || query === dismissedValue) return;
    let active = true;
    void searchKnowledgeSuggestions(db, category, query, parentName).then((next) => { if (active) setSuggestions(next); });
    return () => { active = false; };
  }, [category, db, dismissedValue, parentName, value]);
  const visibleSuggestions = value.trim() && value.trim() !== dismissedValue ? suggestions : [];
  return <AutocompleteField label={label} value={value} onChangeText={(next) => { setDismissedValue(''); onChangeText(next); }} suggestions={visibleSuggestions.map((suggestion) => ({ id: suggestion.id, title: suggestion.aliases[0] ? `${suggestion.name} · ${suggestion.aliases[0]}` : suggestion.name, description: suggestion.aliases.join(' · ') || suggestion.parentName || undefined }))} onSuggestionPress={(suggestion) => {
    const selected = suggestions.find((item) => item.id === suggestion.id);
    if (!selected) return;
    onChangeText(selected.name); setDismissedValue(selected.name); setSuggestions([]); onSelect?.(selected);
  }} />;
}

function beanFormSnapshot(bean: BeanLot) {
  return JSON.stringify({ name: bean.name, weight: String(bean.remainingWeightG), roaster: bean.roaster, country: bean.country, region: bean.region, variety: bean.variety, process: bean.process, roastDate: bean.roastDate ?? '', roastLevel: bean.roastLevel, storageType: bean.storageType, beanState: bean.state, notes: bean.tastingNotes.join(', '), description: bean.description, imageUri: bean.imageUri });
}

const styles = StyleSheet.create({
  screen: { gap: spacing.section }, successScreen: { flex: 1, justifyContent: 'center', gap: spacing.default },
  successIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }, successCopy: { gap: spacing.compact, marginBottom: spacing.small },
  sources: { flexDirection: 'row', gap: spacing.compact }, source: { flex: 1, minHeight: 92, padding: spacing.small, gap: spacing.compact, borderRadius: radius.large, backgroundColor: colors.creamDeep },
  sourceIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  quickCard: { gap: spacing.default }, disclosure: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.small, paddingVertical: spacing.compact }, disclosureCopy: { flex: 1, gap: 2 },
  details: { gap: spacing.default }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.compact }, flex: { flex: 1 },
  preview: { width: '100%', height: 210, borderRadius: radius.large }, scanStatus: { flexDirection: 'row', alignItems: 'center', gap: spacing.small }, memo: { minHeight: 100, textAlignVertical: 'top' }, pressed: { opacity: 0.65 }, disabled: { opacity: 0.45 },
  cameraScreen: { flex: 1, backgroundColor: '#000' }, cameraTop: { position: 'absolute', top: 60, left: 20 },
  cameraControls: { position: 'absolute', left: 24, right: 24, bottom: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cameraControl: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.52)' }, cameraControlPlaceholder: { width: 52, height: 52 },
  cameraShutter: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: colors.white }, cameraShutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.white },
});
