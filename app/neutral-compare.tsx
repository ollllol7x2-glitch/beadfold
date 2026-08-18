import { StyleSheet, View } from 'react-native';
import { Icon, PageHeader, Screen, Text } from '@/components/ui';
import { radius, spacing } from '@/design-system/tokens';

type NeutralPalette = {
  name: string;
  background: string;
  surface: string;
  inset: string;
  line: string;
  text: string;
  secondary: string;
};

const oyster: NeutralPalette = {
  name: '01 Oyster',
  background: '#F7F7F5',
  surface: '#FEFEFC',
  inset: '#F0F0EC',
  line: '#E3E3DE',
  text: '#242522',
  secondary: '#696A65',
};

const limestone: NeutralPalette = {
  name: '03 Limestone',
  background: '#F7F4F0',
  surface: '#FEFDFC',
  inset: '#F0ECE6',
  line: '#E1DBD3',
  text: '#282521',
  secondary: '#726761',
};

export default function NeutralCompareScreen() {
  return (
    <Screen showNavigation={false} header={<PageHeader title="뉴트럴 비교" backLabel="홈" backHref="/(tabs)" />} contentContainerStyle={styles.screen}>
      <Text color={limestone.secondary}>같은 홈 화면을 두 뉴트럴로 비교합니다.</Text>
      <View style={styles.previews}>
        <HomePreview palette={oyster} />
        <HomePreview palette={limestone} />
      </View>
    </Screen>
  );
}

function HomePreview({ palette }: { palette: NeutralPalette }) {
  return (
    <View style={[styles.phone, { backgroundColor: palette.background, borderColor: palette.line }]}>
      <Text variant="caption" color={palette.secondary} style={styles.paletteName}>{palette.name}</Text>
      <View style={styles.previewHeader}>
        <Text variant="caption" color={palette.text} style={styles.wordmark}>BEANFOLD</Text>
        <View style={[styles.bell, { borderColor: palette.line }]}><Icon name="bell" size={13} color={palette.text} /></View>
      </View>
      <View style={styles.greeting}>
        <Text variant="label" color={palette.text}>좋은 아침이에요</Text>
        <Text variant="caption" color={palette.secondary}>첫 한 잔, 함께 시작해볼까요?</Text>
      </View>
      <View style={[styles.emptyCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.previewIcon, { backgroundColor: palette.inset }]}><Icon name="leaf.fill" size={17} color={palette.text} /></View>
        <Text variant="caption" color={palette.text} style={styles.emptyTitle}>원두를 하나 담아볼까요?</Text>
        <Text variant="caption" color={palette.secondary}>이름과 남은 양만 알면 시작할 수 있어요.</Text>
        <View style={styles.previewCta}><Text variant="caption" color="#FFFFFF" style={styles.ctaText}>원두 추가하기</Text></View>
      </View>
      <Text variant="caption" color={palette.text} style={styles.sectionLabel}>최근에 내린 커피</Text>
      <View style={[styles.recentCard, { backgroundColor: palette.surface, borderColor: palette.line }]}>
        <View style={[styles.thumb, { backgroundColor: palette.inset }]} />
        <View style={styles.recentCopy}><View style={[styles.copyLine, { backgroundColor: palette.text }]} /><View style={[styles.copyLineShort, { backgroundColor: palette.line }]} /></View>
      </View>
      <View style={[styles.previewNav, { borderTopColor: palette.line }]}>
        <Icon name="house.fill" size={15} color={palette.secondary} />
        <Icon name="book.closed.fill" size={15} color={palette.secondary} />
        <View style={styles.navAction}><Text variant="caption" color="#FFFFFF" style={styles.ctaText}>원두·기록</Text></View>
        <Icon name="archivebox.fill" size={15} color={palette.secondary} />
        <Icon name="person.crop.circle" size={15} color={palette.secondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.default },
  previews: { flexDirection: 'row', gap: spacing.compact },
  phone: { flex: 1, minHeight: 530, overflow: 'hidden', borderWidth: 1, borderRadius: radius.large, paddingTop: spacing.compact },
  paletteName: { paddingHorizontal: spacing.small, fontWeight: '700', letterSpacing: 0.4 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.small, paddingTop: spacing.compact },
  wordmark: { fontWeight: '700', letterSpacing: 1.4 },
  bell: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13 },
  greeting: { gap: 2, paddingHorizontal: spacing.small, paddingVertical: spacing.default },
  emptyCard: { gap: 7, marginHorizontal: spacing.small, padding: spacing.small, borderWidth: 1, borderRadius: radius.medium },
  previewIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  emptyTitle: { fontWeight: '700' },
  previewCta: { alignSelf: 'flex-start', marginTop: spacing.xs, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.small, backgroundColor: '#790C41' },
  ctaText: { fontWeight: '700', fontSize: 10 },
  sectionLabel: { marginTop: spacing.large, paddingHorizontal: spacing.small, fontWeight: '700' },
  recentCard: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: spacing.small, marginTop: spacing.compact, padding: 8, borderWidth: 1, borderRadius: radius.medium },
  thumb: { width: 42, height: 42, borderRadius: radius.small },
  recentCopy: { flex: 1, gap: 7 },
  copyLine: { width: '76%', height: 7, borderRadius: 4 },
  copyLineShort: { width: '52%', height: 6, borderRadius: 3 },
  previewNav: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderTopWidth: 1 },
  navAction: { paddingHorizontal: 9, paddingVertical: 7, borderRadius: radius.full, backgroundColor: '#790C41' },
});
