import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type SocialAuthProvider = 'google';

export function isAnonymousUser(user: Pick<User, 'is_anonymous'> | null | undefined) {
  return Boolean(user?.is_anonymous);
}

/** The same callback works in Expo, a standalone mobile build, and the web build. */
export function getAuthRedirectUrl() {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const isHostedUnderBeadfold = window.location.pathname === '/beadfold' || window.location.pathname.startsWith('/beadfold/');
    return `${window.location.origin}${isHostedUnderBeadfold ? '/beadfold' : ''}/auth/callback`;
  }
  return Linking.createURL('/auth/callback');
}

/**
 * Keeps any signed-in user's identity intact. For an anonymous user this preserves
 * private objects that were already uploaded under that user's ID.
 */
export async function startSocialSignIn(provider: SocialAuthProvider) {
  const redirectTo = getAuthRedirectUrl();
  const { data: sessionData } = await supabase.auth.getSession();
  const options = { redirectTo, skipBrowserRedirect: Platform.OS !== 'web' };
  const result = sessionData.session?.user
    ? await supabase.auth.linkIdentity({ provider, options })
    : await supabase.auth.signInWithOAuth({ provider, options });

  if (result.error) throw new Error(describeAuthError(result.error.message));
  if (Platform.OS !== 'web' && result.data.url) await Linking.openURL(result.data.url);
}

export async function completeSocialSignIn(url: string) {
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code;
  if (typeof code !== 'string' || !code) throw new Error('로그인 정보를 확인하지 못했어요. 다시 시도해주세요.');
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw new Error(describeAuthError(error.message));
}

/** Signs out only on this device; a member's data remains available after the next sign-in. */
export async function signOutFromThisDevice() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw new Error(describeAuthError(error.message));
}

/** Removes the authenticated member and their cloud-only label photos. Device records stay on this device. */
export async function withdrawAccount() {
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw new Error(describeAuthError(error.message));
  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
  if (signOutError) throw new Error(describeAuthError(signOutError.message));
}

export function describeAuthError(message: string) {
  if (/manual linking/i.test(message)) return '기존 사진을 계정에 연결하려면 Supabase에서 수동 계정 연결을 켜주세요.';
  if (/provider.*disabled|unsupported provider/i.test(message)) return 'Google 로그인이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.';
  if (/identity.*already exists/i.test(message)) return '이미 다른 계정에 연결된 로그인 방식이에요. 해당 계정으로 로그인해주세요.';
  return message;
}
