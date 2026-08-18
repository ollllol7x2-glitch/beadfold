import type { ReactNode } from 'react';
import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
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
import { router, usePathname, type Href } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { LucideIcon } from 'lucide-react-native';
import Archive from 'lucide-react-native/icons/archive';
import ArrowLeftRight from 'lucide-react-native/icons/arrow-left-right';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import Bean from 'lucide-react-native/icons/bean';
import Bell from 'lucide-react-native/icons/bell';
import BellRing from 'lucide-react-native/icons/bell-ring';
import BookOpen from 'lucide-react-native/icons/book-open';
import Camera from 'lucide-react-native/icons/camera';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import ChevronUp from 'lucide-react-native/icons/chevron-up';
import Circle from 'lucide-react-native/icons/circle';
import CircleCheck from 'lucide-react-native/icons/circle-check';
import CircleQuestionMark from 'lucide-react-native/icons/circle-question-mark';
import CircleUserRound from 'lucide-react-native/icons/circle-user-round';
import Clock from 'lucide-react-native/icons/clock';
import Coffee from 'lucide-react-native/icons/coffee';
import Cog from 'lucide-react-native/icons/cog';
import Droplets from 'lucide-react-native/icons/droplets';
import FaceSlightlySmiling from 'lucide-react-native/icons/face-slightly-smiling';
import Flame from 'lucide-react-native/icons/flame';
import Footprints from 'lucide-react-native/icons/footprints';
import Globe from 'lucide-react-native/icons/globe';
import Hand from 'lucide-react-native/icons/hand';
import Heart from 'lucide-react-native/icons/heart';
import Hourglass from 'lucide-react-native/icons/hourglass';
import House from 'lucide-react-native/icons/house';
import Leaf from 'lucide-react-native/icons/leaf';
import ListFilter from 'lucide-react-native/icons/list-filter';
import Pause from 'lucide-react-native/icons/pause';
import Play from 'lucide-react-native/icons/play';
import Plus from 'lucide-react-native/icons/plus';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Search from 'lucide-react-native/icons/search';
import SkipForward from 'lucide-react-native/icons/skip-forward';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Smartphone from 'lucide-react-native/icons/smartphone';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Thermometer from 'lucide-react-native/icons/thermometer';
import ThumbsDown from 'lucide-react-native/icons/thumbs-down';
import Timer from 'lucide-react-native/icons/timer';
import Vibrate from 'lucide-react-native/icons/vibrate';
import Volume2 from 'lucide-react-native/icons/volume-2';
import WandSparkles from 'lucide-react-native/icons/wand-sparkles';
import X from 'lucide-react-native/icons/x';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, shadows, spacing, typography } from '@/design-system/tokens';
import { listBeans } from '@/database/repository';
import type { BeanLot } from '@/domain/types';

type TextVariant = keyof typeof typography;
const iconMap = {
  'arrow.left.arrow.right': ArrowLeftRight,
  'arrow.right': ArrowRight,
  'arrow.clockwise': RefreshCw,
  'arrow.triangle.2.circlepath': RefreshCw,
  'archivebox.fill': Archive,
  'bell.badge.fill': BellRing,
  bell: Bell,
  'book.closed.fill': BookOpen,
  'book.pages.fill': BookOpen,
  checkmark: Check,
  'checkmark.circle.fill': CircleCheck,
  'chevron.down': ChevronDown,
  'chevron.left': ChevronLeft,
  'chevron.right': ChevronRight,
  'chevron.up': ChevronUp,
  circle: Circle,
  clock: Clock,
  'clock.fill': Clock,
  'cup.and.saucer': Coffee,
  'cup.and.saucer.fill': Coffee,
  'cup.and.heat.waves.fill': Coffee,
  'camera.fill': Camera,
  'dial.medium': SlidersHorizontal,
  'drop.fill': Droplets,
  'face.smiling': FaceSlightlySmiling,
  'fast.forward.fill': SkipForward,
  'figure.walk.motion': Footprints,
  'flame.fill': Flame,
  'forward.fill': SkipForward,
  'gearshape.fill': Cog,
  'globe.asia.australia.fill': Globe,
  'hand.tap.fill': Hand,
  'iphone.vibrate': Vibrate,
  'hand.thumbsdown.fill': ThumbsDown,
  'heart.fill': Heart,
  hourglass: Hourglass,
  'house.fill': House,
  iphone: Smartphone,
  leaf: Leaf,
  'leaf.fill': Bean,
  'line.3.horizontal.decrease': ListFilter,
  'mug.fill': Coffee,
  magnifyingglass: Search,
  pause: Pause,
  'pause.fill': Pause,
  play: Play,
  'play.fill': Play,
  plus: Plus,
  'person.crop.circle': CircleUserRound,
  questionmark: CircleQuestionMark,
  'slider.horizontal.3': SlidersHorizontal,
  'speaker.wave.2.fill': Volume2,
  sparkles: Sparkles,
  'thermometer.medium': Thermometer,
  timer: Timer,
  'wand.and.stars': WandSparkles,
  'waterbottle.fill': Droplets,
  xmark: X,
} satisfies Record<string, LucideIcon>;

export type SymbolName = keyof typeof iconMap;

export function Text({ variant = 'body', color = colors.charcoal, style, ...props }: TextProps & { variant?: TextVariant; color?: string }) {
  return <NativeText allowFontScaling maxFontSizeMultiplier={2} style={[typography[variant], { color }, style]} {...props} />;
}

export function Icon({ name, size = 22, color = colors.espresso, weight = 'regular' }: { name: SymbolName; size?: number; color?: string; weight?: 'regular' | 'semibold' | 'bold' }) {
  const Lucide = iconMap[name];
  const strokeWidth = weight === 'regular' ? 1.75 : 2;
  return <Lucide accessible={false} color={color} size={size} strokeWidth={strokeWidth} />;
}

export function BrandMark({ size = 30 }: { size?: number; inverted?: boolean }) {
  return <Image accessible={false} source={require('../../assets/brand/app-icon-reference.png')} resizeMode="contain" style={{ width: size, height: size, borderRadius: size * 0.24 }} />;
}

const hiddenNavPaths = ['/','/brew'];

export function Screen({ children, scroll = true, contentContainerStyle, showNavigation, footer, header, background, backgroundColor = colors.cream, ...props }: ScrollViewProps & { children: ReactNode; scroll?: boolean; showNavigation?: boolean; footer?: ReactNode; header?: ReactNode; background?: ReactNode; backgroundColor?: string }) {
  const pathname = usePathname();
  const navigationVisible = showNavigation ?? !hiddenNavPaths.some((path) => pathname === path || (path !== '/' && pathname.startsWith(path)));
  const hasHeader = Boolean(header);
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={['top', 'left', 'right', ...(navigationVisible ? [] : ['bottom'] as const)]}>
      {background ? <View pointerEvents="none" style={styles.screenBackground}>{background}</View> : null}
      {header ? <View style={styles.screenHeader}>{header}</View> : null}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          style={styles.scroller}
          contentContainerStyle={[styles.content, !navigationVisible && styles.contentNoNav, hasHeader && styles.contentWithHeader, contentContainerStyle]}
          {...props}
        >
          {children}
        </ScrollView>
      ) : <View style={[styles.content, styles.staticContent, !navigationVisible && styles.contentNoNav, hasHeader && styles.contentWithHeader, contentContainerStyle]}>{children}</View>}
      {footer ?? (navigationVisible ? <AppNavigation /> : null)}
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

export function PageHeader({ eyebrow, title, action, backLabel, backHref }: { eyebrow?: string; title: string; action?: ReactNode; backLabel?: string; backHref?: Href }) {
  if (backLabel) {
    return (
      <View style={styles.headerWrap}>
        <View style={styles.compactHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${backLabel}${directionParticle(backLabel)} 돌아가기`} onPress={() => goBackOrReplace(backHref ?? '/(tabs)')} style={styles.headerSide}><Icon name="chevron.left" size={24} /></Pressable>
          <Text variant="title3" accessibilityRole="header" numberOfLines={1} style={styles.compactHeaderTitle}>{title}</Text>
          <View style={[styles.headerSide, styles.headerAction]}>{action}</View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.headerWrap}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          {eyebrow ? <Text variant="caption" color={colors.neutral600} style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text variant="title1" accessibilityRole="header">{title}</Text>
        </View>
        {action}
      </View>
    </View>
  );
}

/** A consistent header for full-screen creation and editing tasks. */
export function TaskHeader({ title, onClose, closeLabel = '닫기' }: { title: string; onClose: () => void; closeLabel?: string }) {
  return (
    <View style={styles.headerWrap}>
      <View style={styles.compactHeader}>
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={styles.headerSide}><Icon name="xmark" size={22} /></Pressable>
        <Text variant="title3" accessibilityRole="header" numberOfLines={1} style={styles.compactHeaderTitle}>{title}</Text>
        <View style={styles.headerSide} />
      </View>
    </View>
  );
}

export function TopBar({ title, backLabel, backHref, action }: { title: string; backLabel?: string; backHref?: Href; action?: ReactNode }) {
  return (
    <View style={styles.compactHeader}>
      {backLabel ? <Pressable accessibilityRole="button" accessibilityLabel={`${backLabel}${directionParticle(backLabel)} 돌아가기`} onPress={() => goBackOrReplace(backHref ?? '/(tabs)')} style={styles.headerSide}><Icon name="chevron.left" size={24} /></Pressable> : <View style={styles.headerSide} />}
      <Text variant="title3" accessibilityRole="header" numberOfLines={1} style={styles.compactHeaderTitle}>{title}</Text>
      <View style={[styles.headerSide, styles.headerAction]}>{action}</View>
    </View>
  );
}

function directionParticle(value: string) {
  const last = value.charCodeAt(value.length - 1);
  if (last < 0xac00 || last > 0xd7a3) return '로';
  const finalConsonant = (last - 0xac00) % 28;
  return finalConsonant !== 0 && finalConsonant !== 8 ? '으로' : '로';
}

/** Preserve the actual previous context when it exists, but never strand a direct URL visit. */
export function goBackOrReplace(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
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

/** A non-blocking action sheet for choices that should not become a new destination. */
export function BottomSheet({ visible, title, children, onClose }: { visible: boolean; title: string; children: ReactNode; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="메뉴 닫기" style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView edges={['bottom']} accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeading}><Text variant="title2" accessibilityRole="header">{title}</Text><IconButton name="xmark" label="닫기" onPress={onClose} /></View>
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/** Stays visible below a scrolling task so completion is never hidden at the end of a form. */
export function BottomActionBar({ primaryLabel, onPrimaryPress, primaryDisabled, primaryLoading, secondaryLabel, onSecondaryPress }: { primaryLabel: string; onPrimaryPress: () => void; primaryDisabled?: boolean; primaryLoading?: boolean; secondaryLabel?: string; onSecondaryPress?: () => void }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.actionBar}>
      {secondaryLabel && onSecondaryPress ? <Button label={secondaryLabel} variant="secondary" onPress={onSecondaryPress} style={styles.actionSecondary} /> : null}
      <Button label={primaryLabel} onPress={onPrimaryPress} disabled={primaryDisabled} loading={primaryLoading} style={styles.actionPrimary} />
    </SafeAreaView>
  );
}

const navItems: { label: string; path: '/(tabs)' | '/(tabs)/journal' | '/(tabs)/collection' | '/(tabs)/profile'; icon: SymbolName; match: string[] }[] = [
  { label: '홈', path: '/(tabs)', icon: 'house.fill', match: ['/(tabs)', '/', '/recipe/guided', '/notifications'] },
  { label: '기록', path: '/(tabs)/journal', icon: 'book.closed.fill', match: ['/journal', '/cup', '/compare'] },
  { label: '보관함', path: '/(tabs)/collection', icon: 'archivebox.fill', match: ['/collection', '/bean', '/recipe/manual', '/gear'] },
  { label: '마이페이지', path: '/(tabs)/profile', icon: 'person.crop.circle', match: ['/profile', '/taste-profile', '/settings'] },
];

export function AppNavigation() {
  const pathname = usePathname();
  const db = useSQLiteContext();
  const [addOpen, setAddOpen] = useState(false);
  const [beanChoiceOpen, setBeanChoiceOpen] = useState(false);
  const [beans, setBeans] = useState<BeanLot[]>([]);

  useEffect(() => {
    if (!addOpen && !beanChoiceOpen) return;
    void listBeans(db).then(setBeans);
  }, [addOpen, beanChoiceOpen, db]);

  const closeAdd = () => { setAddOpen(false); setBeanChoiceOpen(false); };
  const openHomeBrew = () => {
    setAddOpen(false);
    if (!beans.length) {
      router.push('/add-bean');
      return;
    }
    if (beans.length === 1) {
      router.push(`/recipe/guided?beanId=${beans[0]!.id}`);
      return;
    }
    setBeanChoiceOpen(true);
  };
  return (
    <>
      <SafeAreaView edges={['bottom']} style={styles.navSafe}>
        <View accessibilityRole="tablist" style={styles.nav}>
          {navItems.slice(0, 2).map((item) => {
            const selected = item.match.some((value) => pathname === value || (value !== '/' && pathname.startsWith(value)));
            return <NavigationItem key={item.label} item={item} selected={selected} />;
          })}
          <Pressable accessibilityRole="button" accessibilityLabel="원두 추가, 브루잉 시작, 카페 기록 메뉴 열기" onPress={() => setAddOpen(true)} style={({ pressed }) => [styles.navItem, styles.navAddWrap, pressed && styles.pressed]}>
            <View style={styles.navAdd}><Text variant="label" color={colors.cream}>원두·기록</Text></View>
          </Pressable>
          {navItems.slice(2).map((item) => {
          const selected = item.match.some((value) => pathname === value || (value !== '/' && pathname.startsWith(value)));
            return <NavigationItem key={item.label} item={item} selected={selected} />;
          })}
        </View>
      </SafeAreaView>
      <BottomSheet visible={addOpen} title="무엇을 할까요?" onClose={closeAdd}>
        <View style={styles.sheetActions}>
          <SheetAction icon="leaf.fill" title="원두 추가" body="이름과 남은 양만으로 빠르게 시작해요" onPress={() => { closeAdd(); router.push('/add-bean'); }} />
          <SheetAction icon="cup.and.heat.waves.fill" title="집에서 내리기" body={beans.length ? '원두를 고르고 단계 안내를 시작해요' : '먼저 원두 하나를 추가해주세요'} onPress={openHomeBrew} />
          <SheetAction icon="cup.and.saucer.fill" title="카페 커피 기록" body="밖에서 마신 한 잔을 간단히 남겨요" onPress={() => { closeAdd(); router.push('/record-cafe'); }} />
        </View>
      </BottomSheet>
      <BottomSheet visible={beanChoiceOpen} title="어떤 원두로 내릴까요?" onClose={closeAdd}>
        <View style={styles.sheetActions}>
          {beans.map((bean) => <SheetAction key={bean.id} icon="leaf.fill" title={bean.name} body={`${bean.remainingWeightG}g 남음${bean.roaster ? ` · ${bean.roaster}` : ''}`} onPress={() => { closeAdd(); router.push(`/recipe/guided?beanId=${bean.id}`); }} />)}
        </View>
      </BottomSheet>
    </>
  );
}

function NavigationItem({ item, selected }: { item: (typeof navItems)[number]; selected: boolean }) {
  return <Pressable accessibilityRole="tab" accessibilityLabel={`${item.label} 탭`} accessibilityState={{ selected }} onPress={() => router.navigate(item.path)} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}><View style={[styles.navIcon, selected && styles.navIconSelected]}><Icon name={item.icon} size={26} color={selected ? colors.espresso : colors.neutral600} weight={selected ? 'semibold' : 'regular'} /></View><Text variant="caption" color={selected ? colors.espresso : colors.neutral600} style={selected && styles.navLabelSelected}>{item.label}</Text></Pressable>;
}

function SheetAction({ icon, title, body, onPress }: { icon: SymbolName; title: string; body: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${body}`} onPress={onPress} style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}><View style={styles.sheetActionIcon}><Icon name={icon} size={23} /></View><View style={styles.sheetActionCopy}><Text variant="title3" numberOfLines={1}>{title}</Text><Text variant="caption" color={colors.neutral800} numberOfLines={2}>{body}</Text></View><Icon name="chevron.right" size={20} color={colors.neutral600} /></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', backgroundColor: colors.cream },
  screenBackground: { ...StyleSheet.absoluteFill },
  scroller: { flex: 1 },
  staticContent: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.small, paddingBottom: spacing.large, gap: spacing.roomy },
  contentWithHeader: { paddingTop: spacing.default },
  contentNoNav: { paddingBottom: spacing.section },
  screenHeader: { zIndex: 20, ...(Platform.OS === 'web' ? { position: 'sticky' as never, top: 0 } : {}), paddingHorizontal: 20, paddingTop: spacing.compact, paddingBottom: spacing.small, backgroundColor: colors.cream, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral200 },
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
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.default },
  headerCopy: { flex: 1, gap: spacing.compact },
  compactHeader: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: -4 },
  compactHeaderTitle: { flex: 1, textAlign: 'center' },
  headerSide: { width: 48, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  headerAction: { alignItems: 'flex-end' },
  eyebrow: { letterSpacing: 1.4, textTransform: 'uppercase', fontFamily: fonts.semibold },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.small },
  empty: { paddingVertical: spacing.large, paddingHorizontal: spacing.section, gap: spacing.small, alignItems: 'flex-start', backgroundColor: colors.creamDeep, borderRadius: radius.xl },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  navSafe: { backgroundColor: 'rgba(255,253,249,0.98)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  nav: { height: 76, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  navItem: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navIcon: { width: 44, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  navIconSelected: { backgroundColor: colors.creamDeep },
  navAddWrap: { flex: 1.25 },
  navAdd: { minWidth: 102, height: 52, paddingHorizontal: 14, borderRadius: 26, backgroundColor: colors.espresso, alignItems: 'center', justifyContent: 'center', ...shadows.lifted },
  navLabelSelected: { fontFamily: fonts.bold },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', gap: spacing.small, paddingHorizontal: 20, paddingTop: spacing.compact, paddingBottom: spacing.small, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.cream },
  sheetHandle: { width: 42, height: 4, alignSelf: 'center', borderRadius: radius.full, backgroundColor: colors.neutral400 },
  sheetHeading: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetActions: { gap: spacing.compact, paddingBottom: spacing.small },
  sheetAction: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderRadius: radius.large, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  sheetActionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep },
  sheetActionCopy: { flex: 1, gap: 2 },
  actionBar: { flexDirection: 'row', gap: spacing.compact, paddingHorizontal: 20, paddingTop: spacing.small, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200, backgroundColor: 'rgba(255,253,249,0.98)' },
  actionPrimary: { flex: 1 },
  actionSecondary: { flex: 0.72 },
});
