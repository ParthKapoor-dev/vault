/** Shared auth constants and types — safe to import from client or server. */

export const SESSION_COOKIE = "vault_session";
export const OAUTH_STATE_COOKIE = "vault_oauth_state";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  /** GitHub login handle */
  login: string;
  name: string;
  email: string;
  image: string;
  /** True only for the configured GITHUB_ADMIN_EMAIL */
  isAdmin: boolean;
}
