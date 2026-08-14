import type { RoastLevel } from '@/domain/types';

export type BeanLabelOcrResult = {
  fullText: string;
  confidence: number;
  candidates: {
    beanName?: string;
    roaster?: string;
    roastDate?: string;
    roastLevel?: RoastLevel;
    tastingNotes?: string[];
  };
};

const endpoint = process.env.EXPO_PUBLIC_BEANFOLD_OCR_URL?.replace(/\/$/, '') ?? '';

export function isBeanLabelOcrAvailable() {
  return Boolean(endpoint);
}

export async function recognizeBeanLabel(imageBase64: string): Promise<BeanLabelOcrResult> {
  if (!endpoint) throw new Error('자동 인식 서비스가 아직 연결되지 않았어요.');
  if (!imageBase64) throw new Error('사진 데이터를 읽지 못했어요. 다시 촬영하거나 직접 입력해주세요.');

  const response = await fetch(`${endpoint}/v1/bean-label/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 }),
  });
  const payload = await response.json().catch(() => null) as BeanLabelOcrResult | { error?: string } | null;
  if (!response.ok || !payload || !('fullText' in payload)) {
    throw new Error(payload && 'error' in payload && payload.error ? payload.error : '봉투 글자를 읽지 못했어요.');
  }
  return payload;
}
