import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, TaskHeader, Text } from '@/components/ui';
import { colors, spacing } from '@/design-system/tokens';

const documents = {
  terms: { title: '이용약관', updated: '시행일: 2026년 8월 20일', sections: [['서비스 소개', 'BEANFOLD는 원두, 브루잉 레시피와 커피 기록을 관리할 수 있는 서비스입니다.'], ['이용자의 책임', '이용자는 자신의 계정 정보를 안전하게 관리해야 하며, 타인의 권리를 침해하는 방식으로 서비스를 이용할 수 없습니다.'], ['서비스 변경', '서비스 기능은 개선을 위해 변경되거나 종료될 수 있습니다. 중요한 변경은 앱 또는 서비스 화면을 통해 알립니다.']] },
  privacy: { title: '개인정보처리방침', updated: '시행일: 2026년 8월 20일', sections: [['수집하는 정보', 'Google 로그인 시 이메일 주소, 이름과 프로필 사진을 계정 식별을 위해 처리합니다. 원두·레시피·커피 기록은 기본적으로 이 기기에 저장됩니다.'], ['사진 보관', '로그인한 회원이 봉투 사진 보관을 선택한 경우에만 사진을 암호화된 접근 정책이 적용된 클라우드 저장소에 보관합니다.'], ['보유 및 삭제', '회원 탈퇴 시 클라우드에 보관한 봉투 사진과 로그인 계정을 삭제합니다. 이 기기에 저장된 원두와 커피 기록은 사용자가 직접 삭제하거나 앱 데이터를 삭제하기 전까지 남습니다.'], ['문의', '개인정보와 서비스 관련 문의는 정식 연락처가 개설되면 이 문서에 안내합니다.']] },
} as const;

export default function LegalScreen() {
  const { document } = useLocalSearchParams<{ document?: keyof typeof documents }>();
  const content = documents[document === 'privacy' ? 'privacy' : 'terms'];
  return <Screen header={<TaskHeader title={content.title} onClose={() => router.back()} />}><ScrollView contentContainerStyle={styles.content}>{content.sections.map(([heading, body]) => <View key={heading} style={styles.section}><Text variant="title3">{heading}</Text><Text color={colors.neutral600}>{body}</Text></View>)}<Text variant="caption" color={colors.neutral400}>{content.updated}</Text></ScrollView></Screen>;
}

const styles = StyleSheet.create({ content: { gap: spacing.section, paddingBottom: spacing.section }, section: { gap: spacing.compact } });
