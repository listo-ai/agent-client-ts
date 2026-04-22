import type { RequestTransport } from "../transport/request.js";
import {
  EnrollRequestSchema,
  EnrollResponseSchema,
  SetupRequestSchema,
  SetupResponseSchema,
  WhoAmISchema,
} from "../schemas/auth.js";
import type {
  EnrollRequest,
  EnrollResponse,
  SetupRequest,
  SetupResponse,
  WhoAmI,
} from "../schemas/auth.js";

export interface AuthApi {
  whoami(): Promise<WhoAmI>;
  /**
   * Run first-boot setup. Validates the request body client-side via
   * Zod before sending — surface-level field errors are caught here
   * without a round-trip. The returned `token` becomes the bearer for
   * subsequent requests; store it securely.
   *
   * Fails with HTTP 409 if setup already completed — see
   * `docs/design/SYSTEM-BOOTSTRAP.md`.
   */
  setup(req: SetupRequest): Promise<SetupResponse>;
  /**
   * Enroll this edge agent with a cloud controller. Phase A returns
   * HTTP 501 — the cloud-side endpoint and the Zitadel provider are
   * Phase B. Wired now so the surface is stable across the rollout.
   */
  enroll(req: EnrollRequest): Promise<EnrollResponse>;
}

export function createAuthApi(http: RequestTransport, apiVersion: number): AuthApi {
  const base = `/api/v${apiVersion}/auth`;

  return {
    async whoami(): Promise<WhoAmI> {
      const raw = await http.get<unknown>(`${base}/whoami`);
      return WhoAmISchema.parse(raw);
    },
    async setup(req: SetupRequest): Promise<SetupResponse> {
      const body = SetupRequestSchema.parse(req);
      const raw = await http.post<unknown>(`${base}/setup`, body);
      return SetupResponseSchema.parse(raw);
    },
    async enroll(req: EnrollRequest): Promise<EnrollResponse> {
      const body = EnrollRequestSchema.parse(req);
      const raw = await http.post<unknown>(`${base}/enroll`, body);
      return EnrollResponseSchema.parse(raw);
    },
  };
}
