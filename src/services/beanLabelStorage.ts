import { supabase } from './supabase';

const bucket = 'bean-labels';
const storedUriPrefix = 'beanfold-storage://';
const signedUrlLifetimeSec = 60 * 60 * 6;

type PhotoSource = 'camera' | 'gallery';

export function isStoredBeanLabelUri(uri: string | null | undefined): uri is string {
  return Boolean(uri?.startsWith(storedUriPrefix));
}

export async function uploadBeanLabelPhoto(input: {
  base64: string;
  beanId?: string;
  mimeType?: string | null;
  source: PhotoSource;
}) {
  const user = await requireMember();
  const mimeType = allowedMimeType(input.mimeType);
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const objectPath = `${user.id}/bean-label-${Date.now()}-${randomToken()}.${extension}`;
  const payload = base64ToArrayBuffer(input.base64);
  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, payload, { contentType: mimeType, upsert: false });
  if (uploadError) throw new Error(`사진을 안전하게 보관하지 못했어요. ${uploadError.message}`);

  const { error: recordError } = await supabase.from('bean_label_photos').insert({
    local_bean_id: input.beanId ?? null,
    object_path: objectPath,
    source: input.source,
  });
  if (recordError) {
    await supabase.storage.from(bucket).remove([objectPath]);
    throw new Error(`사진 기록을 저장하지 못했어요. ${recordError.message}`);
  }
  return toStoredBeanLabelUri(objectPath);
}

export async function resolveBeanLabelPhotoUri(uri: string | null | undefined): Promise<string | null> {
  if (!uri) return null;
  if (!isStoredBeanLabelUri(uri)) return uri;
  await requireAuthenticatedUser();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(fromStoredBeanLabelUri(uri), signedUrlLifetimeSec);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function toStoredBeanLabelUri(path: string) {
  return `${storedUriPrefix}${bucket}/${path}`;
}

function fromStoredBeanLabelUri(uri: string) {
  return uri.slice(storedUriPrefix.length + bucket.length + 1);
}

async function requireMember() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user || user.is_anonymous) throw new Error('봉투 사진을 안전하게 보관하려면 로그인해주세요.');
  return user;
}

async function requireAuthenticatedUser() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) throw new Error('사진을 확인하려면 이 기기에서 사용하던 계정으로 로그인해주세요.');
  return sessionData.session.user;
}

function allowedMimeType(value: string | null | undefined) {
  return value === 'image/png' || value === 'image/webp' ? value : 'image/jpeg';
}

function base64ToArrayBuffer(base64: string) {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}
