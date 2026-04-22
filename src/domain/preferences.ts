import type { RequestTransport } from "../transport/request.js";
import {
  OrgPreferencesSchema,
  PreferencesPatchSchema,
  ResolvedPreferencesSchema,
} from "../schemas/preferences.js";
import type {
  OrgPreferences,
  PreferencesPatch,
  ResolvedPreferences,
} from "../schemas/preferences.js";

export interface PreferencesApi {
  /**
   * Resolved preferences for the current caller, scoped to `orgId`
   * (or the active tenant in the caller's auth context when omitted).
   */
  getMine(orgId?: string): Promise<ResolvedPreferences>;
  /**
   * Patch the user-per-org layer. Returns the fresh resolved view so
   * callers don't need a follow-up GET. An omitted key means "leave
   * stored value unchanged"; `null` means "clear and inherit".
   */
  patchMine(orgId: string | undefined, patch: PreferencesPatch): Promise<ResolvedPreferences>;
  /** Read the org-layer row. Admin only. */
  getOrg(orgId: string): Promise<OrgPreferences>;
  /** Patch the org-layer row. Admin only. */
  patchOrg(orgId: string, patch: PreferencesPatch): Promise<OrgPreferences>;
}

export function createPreferencesApi(
  http: RequestTransport,
  apiVersion: number,
): PreferencesApi {
  const base = `/api/v${apiVersion}`;

  return {
    async getMine(orgId?: string): Promise<ResolvedPreferences> {
      const path = orgId
        ? `${base}/me/preferences?org=${encodeURIComponent(orgId)}`
        : `${base}/me/preferences`;
      const raw = await http.get<unknown>(path);
      return ResolvedPreferencesSchema.parse(raw);
    },
    async patchMine(
      orgId: string | undefined,
      patch: PreferencesPatch,
    ): Promise<ResolvedPreferences> {
      const body = PreferencesPatchSchema.parse(patch);
      const path = orgId
        ? `${base}/me/preferences?org=${encodeURIComponent(orgId)}`
        : `${base}/me/preferences`;
      const raw = await http.patch<unknown>(path, body);
      return ResolvedPreferencesSchema.parse(raw);
    },
    async getOrg(orgId: string): Promise<OrgPreferences> {
      const raw = await http.get<unknown>(
        `${base}/orgs/${encodeURIComponent(orgId)}/preferences`,
      );
      return OrgPreferencesSchema.parse(raw);
    },
    async patchOrg(orgId: string, patch: PreferencesPatch): Promise<OrgPreferences> {
      const body = PreferencesPatchSchema.parse(patch);
      const raw = await http.patch<unknown>(
        `${base}/orgs/${encodeURIComponent(orgId)}/preferences`,
        body,
      );
      return OrgPreferencesSchema.parse(raw);
    },
  };
}
