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
import CalendarDays from 'lucide-react-native/icons/calendar-days';
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
import Copy from 'lucide-react-native/icons/copy';
import Cog from 'lucide-react-native/icons/cog';
import Droplets from 'lucide-react-native/icons/droplets';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import FaceSlightlySmiling from 'lucide-react-native/icons/face-slightly-smiling';
import Flame from 'lucide-react-native/icons/flame';
import Footprints from 'lucide-react-native/icons/footprints';
import Globe from 'lucide-react-native/icons/globe';
import Hand from 'lucide-react-native/icons/hand';
import Heart from 'lucide-react-native/icons/heart';
import Hourglass from 'lucide-react-native/icons/hourglass';
import House from 'lucide-react-native/icons/house';
import Info from 'lucide-react-native/icons/info';
import Leaf from 'lucide-react-native/icons/leaf';
import ListFilter from 'lucide-react-native/icons/list-filter';
import Pause from 'lucide-react-native/icons/pause';
import Pencil from 'lucide-react-native/icons/pencil';
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
import Trash2 from 'lucide-react-native/icons/trash-2';
import Vibrate from 'lucide-react-native/icons/vibrate';
import Volume2 from 'lucide-react-native/icons/volume-2';
import WandSparkles from 'lucide-react-native/icons/wand-sparkles';
import X from 'lucide-react-native/icons/x';
import Svg, { Path } from 'react-native-svg';
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
  'doc.on.doc': Copy,
  'camera.fill': Camera,
  calendar: CalendarDays,
  'dial.medium': SlidersHorizontal,
  'drop.fill': Droplets,
  ellipsis: Ellipsis,
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
  'info.circle': Info,
  iphone: Smartphone,
  leaf: Leaf,
  'leaf.fill': Bean,
  'line.3.horizontal.decrease': ListFilter,
  'mug.fill': Coffee,
  magnifyingglass: Search,
  pause: Pause,
  'pause.fill': Pause,
  pencil: Pencil,
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
  trash: Trash2,
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
  const strokeWidth = weight === 'regular' ? 1.5 : weight === 'semibold' ? 1.75 : 2;
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

/** A compact, consistent treatment for an important constraint or a caution. */
export function InfoNote({ body, icon = 'info.circle', style, accessibilityLabel }: { body: string; icon?: SymbolName; style?: ViewStyle; accessibilityLabel?: string }) {
  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? body} style={[styles.infoNote, style]}>
      <Icon name={icon} size={16} color={colors.neutral600} />
      <Text variant="caption" color={colors.neutral600} style={styles.infoNoteText}>{body}</Text>
    </View>
  );
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
  const foreground = variant === 'primary' ? colors.white : variant === 'danger' ? colors.error : colors.espresso;
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
      {loading ? <ActivityIndicator color={foreground} /> : <View style={styles.buttonContent}>{icon ? <Icon name={icon} size={19} color={foreground} /> : null}<Text variant="label" style={styles.buttonText} color={foreground}>{label}</Text></View>}
    </Pressable>
  );
}

export function IconButton({ name, label, onPress, variant = 'ghost' }: { name: SymbolName; label: string; onPress: () => void; variant?: 'ghost' | 'outlined' | 'filled' }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, variant === 'outlined' && styles.iconOutlined, variant === 'filled' && styles.iconFilled, pressed && styles.pressed]}>
      <Icon name={name} color={variant === 'filled' ? colors.cream : colors.espresso} weight={name === 'xmark' ? 'bold' : variant === 'filled' ? 'semibold' : 'regular'} />
    </Pressable>
  );
}

export const Field = forwardRef<TextInput, TextInputProps & { label: string; error?: string; hint?: string }>(
  function Field({ label, error, hint, style, inputMode, keyboardType, onChangeText, ...props }, ref) {
    const messageId = `${label.replace(/\s/g, '-')}-message`;
    const numericInputMode = keyboardType === 'decimal-pad' || keyboardType === 'numeric' ? 'decimal' : keyboardType === 'number-pad' ? 'numeric' : undefined;
    const numericOnly = keyboardType === 'decimal-pad' || keyboardType === 'numeric' || keyboardType === 'number-pad';
    return (
      <View style={styles.fieldWrap}>
        <Text variant="label" nativeID={`${messageId}-label`}>{label}</Text>
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          allowFontScaling
          maxFontSizeMultiplier={2}
          inputMode={inputMode ?? numericInputMode}
          keyboardType={keyboardType}
          onChangeText={(nextValue) => onChangeText?.(numericOnly ? normalizeNumericInput(nextValue, keyboardType === 'decimal-pad' || keyboardType === 'numeric') : nextValue)}
          placeholderTextColor={colors.neutral600}
          style={[styles.input, error && styles.inputError, style]}
          {...props}
        />
        {error ? <Text nativeID={messageId} accessibilityRole="alert" variant="caption" color={colors.error}>{error}</Text> : null}
        {!error && hint ? <Text nativeID={messageId} variant="caption" color={colors.neutral600}>{hint}</Text> : null}
      </View>
    );
  },
);

function normalizeNumericInput(value: string, allowDecimal: boolean) {
  const digits = value.replace(/[^0-9.]/g, '');
  if (!allowDecimal) return digits.replace(/\./g, '');
  const [whole = '', ...fraction] = digits.split('.');
  return fraction.length ? `${whole}.${fraction.join('')}` : whole;
}

export function DateField({ label, value, onChange, error, hint, placeholder = '날짜 선택' }: { label: string; value: string; onChange: (value: string) => void; error?: string; hint?: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const selected = parseCalendarDate(value);
  const [visibleMonth, setVisibleMonth] = useState(() => selected ?? new Date());
  const messageId = `${label.replace(/\s/g, '-')}-message`;
  const openCalendar = () => { setVisibleMonth(selected ?? new Date()); setOpen(true); };
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingDays = new Date(year, month, 1).getDay();
  const monthLabel = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(visibleMonth);
  return (
    <View style={styles.fieldWrap}>
      <Text variant="label" nativeID={`${messageId}-label`}>{label}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}, ${value ? formatCalendarDate(value) : placeholder}. 달력 열기`} accessibilityHint={error ?? hint} onPress={openCalendar} style={({ pressed }) => [styles.dateInput, error && styles.inputError, pressed && styles.pressed]}>
        <Text color={value ? colors.charcoal : colors.neutral600} style={{ flex: 1 }}>{value ? formatCalendarDate(value) : placeholder}</Text>
        <Icon name="calendar" size={20} color={colors.neutral600} />
      </Pressable>
      {error ? <Text nativeID={messageId} accessibilityRole="alert" variant="caption" color={colors.error}>{error}</Text> : null}
      {!error && hint ? <Text nativeID={messageId} variant="caption" color={colors.neutral800}>{hint}</Text> : null}
      <BottomSheet visible={open} title={label} onClose={() => setOpen(false)}>
        <View style={styles.calendar}>
          <View style={styles.calendarHeading}><IconButton name="chevron.left" label="이전 달" onPress={() => setVisibleMonth(new Date(year, month - 1, 1))} /><Text variant="title3">{monthLabel}</Text><IconButton name="chevron.right" label="다음 달" onPress={() => setVisibleMonth(new Date(year, month + 1, 1))} /></View>
          <View style={styles.calendarWeek}>{['일', '월', '화', '수', '목', '금', '토'].map((day) => <Text key={day} variant="caption" color={colors.neutral600} style={styles.calendarWeekday}>{day}</Text>)}</View>
          <View style={styles.calendarGrid}>{Array.from({ length: leadingDays }, (_, index) => <View key={`empty-${index}`} style={styles.calendarDay} />)}{Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const dateValue = toCalendarValue(year, month, day);
            const isSelected = value === dateValue;
            return <Pressable key={dateValue} accessibilityRole="button" accessibilityLabel={`${year}년 ${month + 1}월 ${day}일`} accessibilityState={{ selected: isSelected }} onPress={() => { onChange(dateValue); setOpen(false); }} style={({ pressed }) => [styles.calendarDay, isSelected && styles.calendarDaySelected, pressed && styles.pressed]}><Text variant="label" color={isSelected ? colors.cream : colors.charcoal}>{day}</Text></Pressable>;
          })}</View>
          <Button label="날짜 지우기" variant="tertiary" onPress={() => { onChange(''); setOpen(false); }} />
        </View>
      </BottomSheet>
    </View>
  );
}

function parseCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatCalendarDate(value: string) {
  const date = parseCalendarDate(value);
  return date ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date) : value;
}

function toCalendarValue(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function Chip({ label, selected, onPress, accessibilityLabel, icon, selectedStyle, selectedTextColor = colors.espresso }: { label: string; selected?: boolean; onPress?: () => void; accessibilityLabel?: string; icon?: SymbolName; selectedStyle?: ViewStyle; selectedTextColor?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.chip, selected && styles.chipSelected, selected && selectedStyle, pressed && styles.pressed]}
    >
      {selected ? <Icon name="checkmark" size={13} color={selectedTextColor} weight="bold" /> : icon ? <Icon name={icon} size={14} color={colors.espresso} /> : null}
      <Text variant="label" color={selected ? selectedTextColor : colors.charcoal}>{label}</Text>
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
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={styles.headerSide}><Icon name="xmark" size={22} weight="bold" /></Pressable>
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
      <Text color={colors.neutral600}>{body}</Text>
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

type NavigationIconName = 'house.fill' | 'book.closed.fill' | 'archivebox.fill' | 'person.crop.circle';

const navItems: { label: string; path: '/(tabs)' | '/(tabs)/journal' | '/(tabs)/collection' | '/(tabs)/profile'; icon: NavigationIconName; match: string[] }[] = [
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
            <View style={styles.navAdd}><Icon name="plus" size={24} color={colors.cream} weight="bold" /></View>
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
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={`${item.label} 탭`}
      accessibilityState={{ selected }}
      onPress={() => router.navigate(item.path)}
      style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
    >
      <View style={styles.navItemContent}>
        <View style={styles.navIcon}>
          <NavigationIcon name={item.icon} selected={selected} />
        </View>
        <Text variant="caption" color={selected ? colors.espresso : colors.neutral600} style={selected && styles.navLabelSelected}>{item.label}</Text>
      </View>
    </Pressable>
  );
}

function NavigationIcon({ name, selected }: { name: NavigationIconName; selected: boolean }) {
  const line = { stroke: colors.espresso, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg accessible={false} width={24} height={24} viewBox="0 0 24 24" fill="none">
      {selected && name === 'house.fill' ? <Path d="M10.2236 1.89903C11.1801 1.08476 12.5686 1.03422 13.5791 1.74668L13.7764 1.89903L13.7783 1.90098L20.7734 7.89707C21.3923 8.41974 21.75 9.19002 21.75 10.0006V19.0006C21.7497 20.5145 20.514 21.7506 19 21.7506H5C3.486 21.7506 2.25035 20.5145 2.25 19.0006V10.0006C2.25 9.19002 2.60767 8.41974 3.22656 7.89707L10.2217 1.90098L10.2236 1.89903ZM10 12.9996C9.45018 12.9996 9.00029 13.3596 9 13.7994V20.1998H15V13.7994C14.9997 13.3596 14.5498 12.9996 14 12.9996H10Z" fill={colors.espresso} /> : null}
      {selected && name === 'book.closed.fill' ? <Path d="M8 2.25C9.49122 2.25 10.8364 2.8959 12 3.94922C13.1636 2.8959 14.5088 2.25 16 2.25H20C21.5142 2.25 22.75 3.48579 22.75 5V17C22.75 18.5142 21.5142 19.75 20 19.75H16C14.8109 19.75 13.6453 20.3404 12.5469 21.5127C12.4051 21.6639 12.2073 21.75 12 21.75C11.7927 21.75 11.5949 21.6639 11.4531 21.5127C10.3547 20.3404 9.1891 19.75 8 19.75H4C2.48579 19.75 1.25 18.5142 1.25 17V5C1.25 3.48579 2.48579 2.25 4 2.25H8ZM12 6.34961C11.641 6.34961 11.3496 6.64101 11.3496 7V18C11.3496 18.359 11.641 18.6504 12 18.6504C12.359 18.6504 12.6504 18.359 12.6504 18V7C12.6504 6.64101 12.359 6.34961 12 6.34961Z" fill={colors.espresso} /> : null}
      {selected && name === 'archivebox.fill' ? <><Path d="M21 3H3C2.44772 3 2 3.44772 2 4V7C2 7.55228 2.44772 8 3 8H21C21.5523 8 22 7.55228 22 7V4C22 3.44772 21.5523 3 21 3Z" fill={colors.espresso} stroke={colors.espresso} strokeWidth={1.5} strokeLinejoin="round" /><Path d="M20.75 19C20.75 20.5142 19.5142 21.75 18 21.75H6C4.48579 21.75 3.25 20.5142 3.25 19V9.75H20.75V19ZM10 11.3496C9.64101 11.3496 9.34961 11.641 9.34961 12C9.34961 12.359 9.64101 12.6504 10 12.6504H14C14.359 12.6504 14.6504 12.359 14.6504 12C14.6504 11.641 14.359 11.3496 14 11.3496H10ZM20 7.25C20.4142 7.25 20.75 7.58579 20.75 8V8.75H3.25V8C3.25 7.58579 3.58579 7.25 4 7.25H20Z" fill={colors.espresso} /></> : null}
      {selected && name === 'person.crop.circle' ? <><Path d="M21.25 12C21.25 6.89137 17.1086 2.75 12 2.75C6.89137 2.75 2.75 6.89137 2.75 12C2.75 17.1086 6.89137 21.25 12 21.25C17.1086 21.25 21.25 17.1086 21.25 12ZM22.75 12C22.75 17.9371 17.9371 22.75 12 22.75C6.06294 22.75 1.25 17.9371 1.25 12C1.25 6.06294 6.06294 1.25 12 1.25C17.9371 1.25 22.75 6.06294 22.75 12Z" fill={colors.espresso} /><Path d="M12 2C17.5228 2 22 6.47715 22 12C22 15.3034 20.3969 18.2309 17.9277 20.0518C17.4251 16.586 15.0575 14 12 14C8.94246 14 6.57385 16.5859 6.07129 20.0518C3.60244 18.2308 2 15.3031 2 12C2 6.47715 6.47715 2 12 2ZM12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6Z" fill={colors.espresso} /></> : null}
      {!selected && name === 'house.fill' ? <><Path d="M3 10.0001C3 9.41006 3.26 8.85006 3.71 8.47006L10.71 2.47006C11.45 1.84006 12.55 1.84006 13.29 2.47006L20.29 8.47006C20.74 8.85006 21 9.41006 21 10.0001V19.0001C21 20.1001 20.1 21.0001 19 21.0001H5C3.9 21.0001 3 20.1001 3 19.0001V10.0001Z" {...line} /><Path d="M15 21V13C15 12.45 14.55 12 14 12H10C9.45 12 9 12.45 9 13V21" {...line} /></> : null}
      {!selected && name === 'book.closed.fill' ? <><Path d="M12 5V21" {...line} /><Path d="M20 19C21.1 19 22 18.1 22 17V5C22 3.9 21.1 3 20 3H16C14.54 3 13.19 3.73 12 5C10.81 3.73 9.46 3 8 3H4C2.9 3 2 3.9 2 5V17C2 18.1 2.9 19 4 19H8C9.46 19 10.81 19.73 12 21C13.19 19.73 14.54 19 16 19H20Z" {...line} /></> : null}
      {!selected && name === 'archivebox.fill' ? <><Path d="M21 3H3C2.44772 3 2 3.44772 2 4V7C2 7.55228 2.44772 8 3 8H21C21.5523 8 22 7.55228 22 7V4C22 3.44772 21.5523 3 21 3Z" {...line} /><Path d="M4 8V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V8" {...line} /><Path d="M10 12H14" {...line} /></> : null}
      {!selected && name === 'person.crop.circle' ? <><Path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" {...line} /><Path d="M12 14C14.2091 14 16 12.2091 16 10C16 7.79086 14.2091 6 12 6C9.79086 6 8 7.79086 8 10C8 12.2091 9.79086 14 12 14Z" {...line} /><Path d="M6.07007 20.06C6.57007 16.59 8.94007 14 12.0001 14C15.0601 14 17.4301 16.59 17.9301 20.06" {...line} /></> : null}
    </Svg>
  );
}

function SheetAction({ icon, title, body, onPress }: { icon: SymbolName; title: string; body: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${body}`} onPress={onPress} style={({ pressed }) => [styles.sheetAction, pressed && styles.pressed]}><View style={styles.sheetActionIcon}><Icon name={icon} size={23} /></View><View style={styles.sheetActionCopy}><Text variant="title3" numberOfLines={1}>{title}</Text><Text variant="caption" color={colors.neutral600} numberOfLines={2}>{body}</Text></View><Icon name="chevron.right" size={20} color={colors.neutral600} /></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', backgroundColor: colors.cream },
  screenBackground: { ...StyleSheet.absoluteFill },
  scroller: { flex: 1 },
  staticContent: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.small, paddingBottom: spacing.large, gap: spacing.large },
  contentWithHeader: { paddingTop: spacing.default },
  contentNoNav: { paddingBottom: spacing.section },
  screenHeader: { zIndex: 20, ...(Platform.OS === 'web' ? { position: 'sticky' as never, top: 0 } : {}), paddingHorizontal: 20, paddingTop: spacing.compact, paddingBottom: spacing.small, backgroundColor: colors.cream, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.neutral200 },
  card: { backgroundColor: colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.neutral200, borderRadius: radius.large, padding: spacing.default, gap: spacing.small, ...shadows.soft },
  cardTinted: { backgroundColor: colors.creamDeep, borderColor: colors.neutral200 },
  cardDark: { backgroundColor: colors.action, borderColor: colors.action },
  infoNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  infoNoteText: { flex: 1 },
  button: { minHeight: 54, minWidth: 54, borderRadius: radius.medium, paddingHorizontal: 20, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: colors.action, ...shadows.soft },
  buttonSecondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  buttonTertiary: { backgroundColor: 'transparent', minHeight: 44, paddingHorizontal: spacing.compact },
  buttonDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.error },
  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.compact },
  buttonText: { textAlign: 'center', fontSize: 15 },
  pressed: { opacity: 0.62, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.42 },
  iconButton: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  iconOutlined: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  iconFilled: { backgroundColor: colors.action },
  fieldWrap: { gap: spacing.compact },
  input: { minHeight: 54, borderWidth: 1, borderColor: colors.neutral200, borderRadius: radius.medium, backgroundColor: colors.white, paddingHorizontal: 15, paddingVertical: 13, color: colors.charcoal, fontFamily: fonts.regular, fontSize: 16 },
  dateInput: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.compact, borderWidth: 1, borderColor: colors.neutral200, borderRadius: radius.medium, backgroundColor: colors.white, paddingHorizontal: 15, paddingVertical: 13 },
  inputError: { borderColor: colors.error, borderWidth: 2 },
  chip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.full, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200, justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.terracotta, borderColor: colors.terracotta },
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
  navSafe: { backgroundColor: 'rgba(255,253,252,0.98)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200 },
  nav: { height: 76, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center' },
  navItem: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
  navItemContent: { width: 64, height: 58, position: 'relative', alignItems: 'center', justifyContent: 'center', gap: 3 },
  navIcon: { width: 44, height: 30, alignItems: 'center', justifyContent: 'center' },
  navAddWrap: { flex: 1 },
  navAdd: { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center', ...shadows.lifted },
  navLabelSelected: { fontFamily: fonts.bold },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  sheet: { width: '100%', maxWidth: Platform.OS === 'web' ? 520 : undefined, alignSelf: 'center', gap: spacing.small, paddingHorizontal: 20, paddingTop: spacing.compact, paddingBottom: spacing.small, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.cream },
  sheetHandle: { width: 42, height: 4, alignSelf: 'center', borderRadius: radius.full, backgroundColor: colors.neutral400 },
  sheetHeading: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetActions: { gap: spacing.compact, paddingBottom: spacing.small },
  calendar: { gap: spacing.compact, paddingBottom: spacing.small },
  calendarHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarWeek: { flexDirection: 'row' },
  calendarWeekday: { width: '14.2857%', textAlign: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full },
  calendarDaySelected: { backgroundColor: colors.action },
  sheetAction: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: spacing.small, padding: spacing.small, borderRadius: radius.large, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.neutral200 },
  sheetActionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.creamDeep },
  sheetActionCopy: { flex: 1, gap: 2 },
  actionBar: { flexDirection: 'row', gap: spacing.compact, paddingHorizontal: 20, paddingTop: spacing.small, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.neutral200, backgroundColor: 'rgba(255,253,252,0.98)' },
  actionPrimary: { flex: 1 },
  actionSecondary: { flex: 0.72 },
});
