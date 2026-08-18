import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { EmptyState, Icon, PageHeader, Screen, Text, type SymbolName } from '@/components/ui';
import { getInterruptedBrew, listBeans, listCups } from '@/database/repository';
import type { BeanLot, BrewSession, Cup } from '@/domain/types';
import { colors, radius, spacing } from '@/design-system/tokens';

type Notice = {
  id: string;
  title: string;
  body: string;
  icon: SymbolName;
  path: string;
};

export default function NotificationsScreen() {
  const db = useSQLiteContext();
  const [beans, setBeans] = useState<BeanLot[]>([]);
  const [cups, setCups] = useState<Cup[]>([]);
  const [interrupted, setInterrupted] = useState<BrewSession | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([listBeans(db), listCups(db), getInterruptedBrew(db)]).then(([nextBeans, nextCups, nextBrew]) => {
      if (active) {
        setBeans(nextBeans);
        setCups(nextCups);
        setInterrupted(nextBrew);
      }
    });
    return () => { active = false; };
  }, [db]));

  const notices = useMemo(() => buildNotices(beans, cups, interrupted), [beans, cups, interrupted]);

  return (
    <Screen header={<PageHeader title="알림" backLabel="홈" backHref="/(tabs)" />} contentContainerStyle={styles.screen}>
      {notices.length ? (
        <View style={styles.list}>
          <Text variant="label" color={colors.neutral600}>확인할 알림 {notices.length}개</Text>
          {notices.map((notice) => (
            <Pressable
              key={notice.id}
              accessibilityRole="button"
              accessibilityLabel={`${notice.title}. ${notice.body}`}
              onPress={() => router.push(notice.path as never)}
              style={({ pressed }) => [styles.notice, pressed && styles.pressed]}
            >
              <View style={styles.icon}><Icon name={notice.icon} size={22} color={colors.espresso} /></View>
              <View style={styles.copy}><Text variant="title3">{notice.title}</Text><Text color={colors.neutral600}>{notice.body}</Text></View>
              <Icon name="chevron.right" size={17} color={colors.neutral400} />
            </Pressable>
          ))}
        </View>
      ) : (
        <EmptyState title="새 알림이 없어요" body="확인할 내용이 생기면 여기에 알려드릴게요." icon="bell" />
      )}
    </Screen>
  );
}

function buildNotices(beans: BeanLot[], cups: Cup[], interrupted: BrewSession | null): Notice[] {
  const notices: Notice[] = [];
  if (interrupted) {
    notices.push({
      id: `brew-${interrupted.id}`,
      title: interrupted.status === 'ready' ? '시작 전인 브루잉이 있어요' : '멈춘 브루잉이 있어요',
      body: `${interrupted.beanSnapshot.name} 브루잉을 이어서 진행할 수 있어요.`,
      icon: 'play.fill',
      path: `/brew/${interrupted.id}`,
    });
  }
  cups.filter((cup) => cup.kind === 'home' && !cup.satisfaction).slice(0, 3).forEach((cup) => {
    notices.push({
      id: `taste-${cup.id}`,
      title: '맛 기록을 남겨주세요',
      body: `${cup.beanName}의 맛이 기억날 때 간단히 남겨보세요.`,
      icon: 'heart.fill',
      path: `/record-cup/${cup.id}`,
    });
  });
  beans.filter((bean) => bean.remainingWeightG > 0 && bean.remainingWeightG <= 30 && bean.state !== 'finished').slice(0, 3).forEach((bean) => {
    notices.push({
      id: `bean-${bean.id}`,
      title: '원두가 얼마 남지 않았어요',
      body: `${bean.name}이 ${bean.remainingWeightG}g 남았어요.`,
      icon: 'leaf.fill',
      path: `/bean/${bean.id}`,
    });
  });
  return notices;
}

const styles = StyleSheet.create({
  screen: { gap: spacing.section },
  list: { gap: spacing.small },
  notice: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderRadius: radius.large, backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200 },
  icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.creamDeep, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 3 },
  pressed: { opacity: 0.68 },
});
