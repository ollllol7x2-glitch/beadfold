import type { ReactNode } from 'react';
import { forwardRef } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextInput,
  View,
  type PressableProps,
  type ScrollViewProps,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, usePathname } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/design-system/tokens';

type TextVariant = keyof typeof typography;
export type SymbolName = SymbolViewProps['name'];

type WebIconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const webIconNames: Record<string, WebIconName> = {
  'arrow.left.arrow.right': 'swap-horizontal',
  'arrow.clockwise': 'refresh',
  'arrow.triangle.2.circlepath': 'refresh',
  'archivebox.fill': 'archive',
  'bell.badge.fill': 'bell-badge',
  bell: 'bell-outline',
  'book.closed.fill': 'book-open-variant',
  'book.pages.fill': 'book-open-page-variant',
  checkmark: 'check',
  'checkmark.circle.fill': 'check-circle',
  'chevron.down': 'chevron-down',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'chevron-up',
  circle: 'circle-outline',
  clock: 'clock-outline',
  'clock.fill': 'clock',
  'cup.and.saucer': 'coffee-outline',
  'cup.and.saucer.fill': 'coffee',
  'cup.and.heat.waves.fill': 'coffee',
  'camera.fill': 'camera',
  'dial.medium': 'tune-variant',
  'drop.fill': 'water',
  'face.smiling': 'emoticon-happy-outline',
  'fast.forward.fill': 'fast-forward',
  'figure.walk.motion': 'walk',
  'flame.fill': 'fire',
  'forward.fill': 'fast-forward',
  'gearshape.fill': 'cog',
  'globe.asia.australia.fill': 'earth',
  'hand.tap.fill': 'gesture-tap',
  'hand.thumbsdown.fill': 'thumb-down',
  'heart.fill': 'heart',
  hourglass: 'timer-sand',
  'house.fill': 'home',
  iphone: 'cellphone',
  'leaf.fill': 'leaf',
  'line.3.horizontal.decrease': 'filter-variant',
  'mug.fill': 'coffee',
  magnifyingglass: 'magnify',
  pause: 'pause',
  'pause.fill': 'pause',
  play: 'play',
  'play.fill': 'play',
  plus: 'plus',
  'person.crop.circle': 'account-circle-outline',
  questionmark: 'help',
  'slider.horizontal.3': 'tune',
  'speaker.wave.2.fill': 'volume-high',
  sparkles: 'creation',
  'thermometer.medium': 'thermometer',
  timer: 'timer-outline',
  'wand.and.stars': 'magic-staff',
  'waterbottle.fill': 'bottle-soda-classic',
  xmark: 'close',
};

export function Text({ variant = 'body', color = colors.charcoal, style, ...props }: TextProps & { variant?: TextVariant; color?: string }) {
  return <NativeText allowFontScaling maxFontSizeMultiplier={2} style={[typography[variant], { color }, style]} {...props} />;
}

export function Icon({ name, size = 22, color = colors.espresso, weight = 'regular' }: { name: SymbolName; size?: number; color?: string; weight?: SymbolViewProps['weight'] }) {
  if (Platform.OS === 'web') {
    return <MaterialCommunityIcons accessible={false} importantForAccessibility="no-hide-descendants" name={webIconNames[String(name)] ?? 'circle-small'} size={size} color={color} />;
  }
  return <SymbolView accessible={false} name={name} size={size} tintColor={color} weight={weight} fallback={<NativeText accessible={false} style={{ color, fontSize: size }}>•</NativeText>} />;
}

export function BrandMark({ size = 30 }: { size?: number; inverted?: boolean }) {
  return <Image accessible={false} source={require('../../assets/brand/app-icon-reference.png')} resizeMode="contain" style={{ width: size, height: size, borderRadius: size * 0.24 }} />;
}

const hiddenNavPaths = ['/','/brew'];

export function Screen({ children, scroll = true, contentContainerStyle, showNavigation, ...props }: ScrollViewProps & { children: ReactNode; scroll?: boolean; showNavigation?: boolean }) {
  const pathname = usePathname();
  const navigationVisible = showNavigation ?? !hiddenNavPaths.some((path) => pathname === path || (path !== '/' && pathname.startsWith(path)));
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', ...(navigationVisible ? [] : ['bottom'] as const)]}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          style={styles.scroller}
          contentContainerStyle={[styles.content, !navigationVisible && styles.contentNoNav, contentContainerStyle]}
          {...props}
        >
          {children}
        </ScrollView>
      ) : <View style={[styles.content, styles.staticContent, !navigationVisible && styles.contentNoNav, contentContainerStyle]}>{children}</View>}
      {navigationVisible ? <AppNavigation /> : null}
    </SafeAreaView>
  );
}

export function Card({ children, style, accessibilityLabel, tone = 'plain' }: { children: ReactNode; style?: ViewStyle; accessibilityLabel?: string; tone?: 'plain' | 'tinted' | 'dark' }) {
  return <View accessible={Boolean(accessibilityLabel)} accessibilityLabel={accessibilityLabel} style={[styles.card, tone === 'tinted' && styles.cardTinted, tone === 'dark' && styles.cardDark, style]}>{children}</View>;
}

export function Button({
  label,
  variant = 'primary',
  loading,
  disabled,
  style,
  accessibilityLabel,
  icon,
  ...props
}: Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  loading?: boolean;
  icon?: SymbolName;
}) {
  const inactive = disabled || loading;
  const foreground = variant === 'primary' || variant === 'danger' ? colors.cream : colors.espresso;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'tertiary' && styles.buttonTertiary,
        variant === 'danger' && styles.buttonDanger,
        pressed && styles.pressed,
        inactive && styles.disabled,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={foreground} /> : <View style={styles.buttonContent}>{icon ? <Icon name={icon} size={19} color={foreground} weight="semibold" /> : null}<Text variant="label" style={styles.buttonText} color={foreground}>{label}</Text></View>}
    </Pressable>
  );
}

export function IconButton({ name, label, onPress, variant = 'ghost' }: { name: SymbolName; label: string; onPress: () => void; variant?: 'ghost' | 'outlined' | 'filled' }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, variant === 'outlined' && styles.iconOutlined, variant === 'filled' && styles.iconFilled, pressed && styles.pressed]}>
      <Icon name={name} color={variant === 'filled' ? colors.cream : colors.espresso} weight="semibold" />
    </Pressable>
  );
}

export const Field = forwardRef<TextInput, TextInputProps & { label: string; error?: string; hint?: string }>(
  function Field({ label, error, hint, style, ...props }, ref) {
    const messageId = `${label.replace(/\s/g, '-')}-message`;
    return (
      <View style={styles.fieldWrap}>
        <Text variant="label" nativeID={`${messageId}-label`}>{label}</Text>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          allowFontScaling
          maxFontSizeMultiplier={2}
          placeholderTextColor={colors.neutral600}
          style={[styles.input, error && styles.inputError, style]}
          {...props}
        />
        {error ? <Text nativeID={messageId} accessibilityRole="alert" variant="caption" color={colors.error}>{error}</Text> : null}
        {!error && hint ? <Text nativeID={messageId} variant="caption" color={colors.neutral800}>{hint}</Text> : null}
      </View>
    );
  },
);

export function Chip({ label, selected, onPress, accessibilityLabel, icon }: { label: string; selected?: boolean; onPress?: () => void; accessibilityLabel?: string; icon?: SymbolName }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
    >
      {selected ? <Icon name="checkmark" size={13} color={colors.cream} weight="bold" /> : icon ? <Icon name={icon} size={14} color={colors.espresso} /> : null}
      <Text variant="label" color={selected ? colors.cream : colors.charcoal}>{label}</Text>
    </Pressable>
  );
}

export function PageHeader({ eyebrow, title, description, action, backLabel }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; backLabel?: string }) {
  return (
    <View style={styles.headerWrap}>
      {backLabel ? <Pressable accessibilityRole="button" accessibilityLabel={`${backLabel}${directionParticle(backLabel)} 돌아가기`} onPress={() => router.back()} style={styles.backRow}><Icon name="chevron.left" size={18} /><Text variant="label">{backLabel}</Text></Pressable> : null}
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          {eyebrow ? <Text variant="caption" color={colors.neutral600} style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text variant="title1" accessibilityRole="header">{title}</Text>
          {description ? <Text variant="bodyLarge" color={colors.neutral800}>{description}</Text> : null}
        </View>
        {action}
      </View>
    </View>
  );
}

export function TopBar({ title, backLabel, action }: { title: string; backLabel?: string; action?: ReactNode }) {
  return (
    <View style={styles.topBar}>
      {backLabel ? <Pressable accessibilityRole="button" accessibilityLabel={`${backLabel}${directionParticle(backLabel)} 돌아가기`} onPress={() => router.back()} style={styles.topBarSide}><Icon name="chevron.left" size={18} /><Text variant="label">{backLabel}</Text></Pressable> : <View style={styles.topBarSide} />}
      <Text variant="title3" accessibilityRole="header" numberOfLines={1} style={styles.topBarTitle}>{title}</Text>
      <View style={[styles.topBarSide, styles.topBarRight]}>{action}</View>
    </View>
  );
}

function directionParticle(value: string) {
  const last = value.charCodeAt(value.length - 1);
  return last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? '으로' : '로';
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return <View style={styles.sectionTitle}><Text variant="title2" accessibilityRole="header">{title}</Text>{action}</View>;
}

export function EmptyState({ title, body, action, icon = 'leaf' }: { title: string; body: string; action?: ReactNode; icon?: SymbolName }) {
  return (
    <View accessible accessibilityLabel={`${title}. ${body}`} style={styles.empty}>
      <View style={styles.emptyIcon}><Icon name={icon} size={28} color={colors.espresso} /></View>
      <Text variant="title3">{title}</Text>
      <Text color={colors.neutral800}>{body}</Text>
      {action}
    </View>
  );
}

const navItems: { label: string; path: '/(tabs)' | '/(tabs)/journal' | '/(tabs)/add' | '/(tabs)/collection' | '/(tabs)/profile'; icon: SymbolName; match: string[] }[] = [
  { label: '홈', path: '/(tabs)', icon: 'house.fill', match: ['/(tabs)', '/', '/recipe/guided'] },
  { label: '기록', path: '/(tabs)/journal', icon: 'book.closed.fill', match: ['/journal', '/cup', '/compare'] },
  { label: '추가', path: '/(tabs)/add', icon: 'plus', match: ['/add'] },
  { label: '보관함', path: '/(tabs)/collection', icon: 'archivebox.fill', match: ['/collection', '/bean', '/recipe/manual', '/gear'] },
  { label: '프로필', path: '/(tabs)/profile', icon: 'person.crop.circle', match: ['/profile', '/taste-profile', '/settings'] },
];

export function AppNavigation() {
  const pathname = usePathname();
  return (
    <SafeAreaView edges={['bottom']} style={styles.navSafe}>
      <View accessibilityRole="tablist" style={styles.nav}>
        {navItems.map((item, index) => {
          const selected = item.match.some((value) => pathname === value || (value !== '/' && pathname.startsWith(value)));
          const add = index === 2;
          return (
            <Pressable
              key={item.label}
              accessibilityRole="tab"
              accessibilityLabel={`${item.label} 탭`}
              accessibilityState={{ selected }}
              onPress={() => router.navigate(item.path)}
              style={({ pressed }) => [styles.navItem, add && styles.navAddWrap, pressed && styles.pressed]}
            >
              {add ? <View style={styles.navAdd}><Text variant="label" color={colors.cream}>추가</Text></View> : <><View style={[styles.navIcon, selected && styles.navIconSelected]}><Icon name={item.icon} size={26} color={selected ? colors.espresso : colors.neutral600} weight={selected ? 'semibold' : 'regular'} /></View><Text variant="caption" color={selected ? colors.espresso : colors.neutral600} style={selected && styles.navLabelSelected}>{item.label}</Text></>}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', backgroundColor: colors.cream },
  scroller: { flex: 1 },
  staticContent: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.small, paddingBottom: spacing.large, gap: spacing.roomy },
  contentNoNav: { paddingBottom: spacing.section },
  card: { backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, borderRadius: radius.large, padding: spacing.default, gap: spacing.small, ...shadows.soft },
  cardTinted: { backgroundColor: colors.creamDeep, borderColor: colors.warmBeige },
  cardDark: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  button: { minHeight: 54, minWidth: 54, borderRadius: radius.medium, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: colors.espresso, ...shadows.soft },
  buttonSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  buttonTertiary: { backgroundColor: 'transparent', minHeight: 44, paddingHorizontal: spacing.compact },
  buttonDanger: { backgroundColor: colors.error },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.compact },
  buttonText: { textAlign: 'center', fontSize: 15 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.42 },
  iconButton: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconOutlined: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  iconFilled: { backgroundColor: colors.espresso },
  fieldWrap: { gap: spacing.compact },
  input: { minHeight: 54, borderWidth: 1, borderColor: colors.neutral200, borderRadius: radius.medium, backgroundColor: colors.white, paddingHorizontal: 15, paddingVertical: 13, color: colors.charcoal, fontFamily: fonts.regular, fontSize: 16 },
  inputError: { borderColor: colors.error, borderWidth: 2 },
  chip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200, justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.espresso, borderColor: colors.espresso },
  headerWrap: { gap: spacing.default },
  backRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.default },
  headerCopy: { flex: 1, gap: spacing.compact },
  eyebrow: { letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: fonts.semibold },
  topBar: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -4 },
  topBarSide: { width: 92, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
  topBarRight: { justifyContent: 'flex-end' },
  topBarTitle: { flex: 1, textAlign: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small },
  empty: { paddingVertical: spacing.large, paddingHorizontal: spacing.section, gap: spacing.small, alignItems: 'flex-start', backgroundColor: colors.creamDeep, borderRadius: radius.xl },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  navSafe: { backgroundColor: 'rgba(255,253,249,0.98)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  nav: { height: 76, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  navItem: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navIcon: { width: 44, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  navIconSelected: { backgroundColor: colors.creamDeep },
  navAddWrap: { flex: 1.25 },
  navAdd: { minWidth: 76, height: 52, paddingHorizontal: 14, borderRadius: 26, backgroundColor: colors.espresso, alignItems: 'center', justifyContent: 'center', ...shadows.lifted },
  navLabelSelected: { fontFamily: fonts.bold },
});
