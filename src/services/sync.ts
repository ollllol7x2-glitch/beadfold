/**
 * Optional cloud boundary. Core flows never import a vendor SDK and remain fully local.
 * A future Supabase adapter must receive credentials at runtime and preserve entity IDs
 * plus the Cup.brewSessionId uniqueness invariant for idempotent retries.
 */
export interface SyncAdapter {
  readonly kind: 'local-only' | 'supabase';
  push(): Promise<{ uploaded: number }>;
  pull(): Promise<{ downloaded: number }>;
}

export const localOnlySyncAdapter: SyncAdapter = {
  kind: 'local-only',
  async push() { return { uploaded: 0 }; },
  async pull() { return { downloaded: 0 }; },
};
