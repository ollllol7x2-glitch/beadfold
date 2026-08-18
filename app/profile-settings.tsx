import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as ImagePicker from 'expo-image-picker';
import { BottomActionBar, Button, Field, goBackOrReplace, Icon, Screen, TaskHeader, Text } from '@/components/ui';
import { getSetting, setSetting } from '@/database/repository';
import { colors, spacing } from '@/design-system/tokens';
import { useFeedback } from '@/components/feedback';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';

export default function ProfileSettingsScreen() {
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState('');
  const [baseline, setBaseline] = useState('');
  const [saving, setSaving] = useState(false);
  const snapshot = JSON.stringify({ name, imageUri });
  const isDirty = Boolean(baseline) && baseline !== snapshot;
  const { requestExit, allowExit, exitConfirmation } = useUnsavedChangesGuard(isDirty);

  useFocusEffect(useCallback(() => {
    let active = true;
    void Promise.all([getSetting(db, 'profile_name', ''), getSetting(db, 'profile_image_uri', '')]).then(([savedName, savedImage]) => {
      if (!active) return;
      setName(savedName); setImageUri(savedImage); setBaseline(JSON.stringify({ name: savedName, imageUri: savedImage }));
    });
    return () => { active = false; };
  }, [db]));

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1] });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };
  const save = async () => {
    setSaving(true);
    try {
      await Promise.all([setSetting(db, 'profile_name', name.trim()), setSetting(db, 'profile_image_uri', imageUri)]);
      setBaseline(JSON.stringify({ name: name.trim(), imageUri }));
      showFeedback('프로필을 저장했어요.');
      allowExit();
      router.replace('/(tabs)/profile');
    } finally { setSaving(false); }
  };

  return (
    <Screen showNavigation={false} header={<TaskHeader title="프로필 설정" onClose={() => requestExit(() => goBackOrReplace('/(tabs)/profile'))} />} footer={<BottomActionBar primaryLabel="저장" primaryLoading={saving} onPrimaryPress={() => void save()} />} contentContainerStyle={styles.screen}>
      <View style={styles.avatar}>{imageUri ? <Image source={{ uri: imageUri }} style={styles.avatarImage} accessibilityLabel="선택한 프로필 사진" /> : <Icon name="person.crop.circle" size={58} color={colors.espresso} />}</View>
      <View style={styles.photoActions}><Button label={imageUri ? '사진 바꾸기' : '사진 선택'} variant="secondary" icon="camera.fill" onPress={() => void pickImage()} />{imageUri ? <Button label="사진 제거" variant="tertiary" onPress={() => setImageUri('')} /> : null}</View>
      <Field label="표시 이름" value={name} onChangeText={setName} placeholder="이름을 입력해주세요" maxLength={30} />
      <Text variant="caption" color={colors.neutral600}>이름과 사진은 이 기기에서만 사용됩니다.</Text>
      {exitConfirmation}
    </Screen>
  );
}

const styles = StyleSheet.create({ screen: { gap: spacing.section }, avatar: { width: 128, height: 128, borderRadius: 64, overflow: 'hidden', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep }, avatarImage: { width: '100%', height: '100%' }, photoActions: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: spacing.compact } });
