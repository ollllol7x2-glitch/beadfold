import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, Card, Field, InfoNote, PageHeader, Screen, Text } from '@/components/ui';
import { adjustBeanInventory, getBean } from '@/database/repository';
import { spacing } from '@/design-system/tokens';
import { useFeedback } from '@/components/feedback';

export default function BeanInventoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { showFeedback } = useFeedback();
  const [beanName, setBeanName] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    if (!id) return;
    let active = true;
    void getBean(db, id).then((bean) => { if (active && bean) { setBeanName(bean.name); setWeight(String(bean.remainingWeightG)); } });
    return () => { active = false; };
  }, [db, id]));

  const save = async () => {
    const nextWeight = Number(weight);
    if (!id || !Number.isFinite(nextWeight) || nextWeight < 0 || nextWeight > 10000) return setError('남은 양을 0g부터 10,000g 사이로 입력해주세요.');
    try { await adjustBeanInventory(db, id, nextWeight); showFeedback('남은 양을 맞췄어요. 재고 이력에서도 확인할 수 있어요.'); router.back(); } catch (cause) { setError(cause instanceof Error ? cause.message : '재고를 저장하지 못했어요.'); }
  };

  return <Screen header={<PageHeader title="재고 맞추기" backLabel="원두" backHref={`/bean/${id}`} />} contentContainerStyle={styles.screen}>
    <Card><Text variant="title2">{beanName || '원두'}</Text><InfoNote body="봉투의 실제 무게를 확인한 뒤 남은 양을 맞춰주세요." /><Field label="실제 남은 양 (g)" value={weight} onChangeText={(value) => { setWeight(value); setError(''); }} keyboardType="decimal-pad" error={error} /></Card>
    <InfoNote body="입력한 양과 이전 재고의 차이를 재고 이력에 기록합니다." />
    <Button label="재고 저장" onPress={() => void save()} />
  </Screen>;
}

const styles = StyleSheet.create({ screen: { gap: spacing.section } });
