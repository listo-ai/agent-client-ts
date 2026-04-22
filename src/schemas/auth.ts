import { z } from "zod";

/**
 * Scope atoms — snake_case strings matching Rust's
 * `#[serde(rename_all = "snake_case")]` on `spi::Scope`.
 */
export const ScopeSchema = z.enum([
  "read_nodes",
  "write_nodes",
  "write_slots",
  "write_config",
  "manage_plugins",
  "manage_fleet",
  "admin",
]);

/**
 * Response from `GET /api/v1/auth/whoami`. Mirrors the Rust DTO in
 * `crates/transport-rest/src/auth_routes.rs` and `clients/rs/src/types.rs`.
 * Field order is load-bearing — do not alphabetize.
 */
export const WhoAmISchema = z
  .object({
    actor_kind: z.enum(["user", "machine", "dev_null"]),
    actor_id: z.string().nullable(),
    actor_display: z.string(),
    tenant: z.string(),
    scopes: z.array(ScopeSchema),
    provider: z.string(),
  })
  .strict();

export type Scope = z.infer<typeof ScopeSchema>;
export type WhoAmI = z.infer<typeof WhoAmISchema>;

/**
 * Request body for `POST /api/v1/auth/setup`. Discriminated union on
 * `mode` — must match the agent's `/agent/setup.mode` slot or the
 * server returns 400 mode_mismatch.
 *
 * `admin_password` is accepted in Phase A but ignored — no login-by-
 * password path exists until Phase B lands Zitadel. See
 * `docs/design/SYSTEM-BOOTSTRAP.md` § "Transport security
 * requirement".
 */
export const SetupRequestSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("cloud"),
      org_name: z.string().min(1),
      admin_email: z.string().email(),
      admin_password: z.string().optional(),
    })
    .strict(),
  z.object({ mode: z.literal("edge") }).strict(),
  z.object({ mode: z.literal("standalone") }).strict(),
]);

/** Response from a successful `POST /api/v1/auth/setup`. */
export const SetupResponseSchema = z
  .object({
    status: z.string(),
    token: z.string(),
    advice: z.string(),
    /**
     * Populated only when the operator launched with `--config`. If
     * present, the agent refused to rewrite their config file; the
     * operator must paste this snippet themselves for the token to
     * survive a restart.
     */
    config_snippet: z.string().optional(),
  })
  .strict();

/** Request body for `POST /api/v1/auth/enroll`. Edge-only. */
export const EnrollRequestSchema = z
  .object({
    cloud_url: z.string().url(),
    enrollment_token: z.string().min(1),
  })
  .strict();

/** Response from a successful `POST /api/v1/auth/enroll` (Phase B). */
export const EnrollResponseSchema = z
  .object({
    status: z.string(),
    tenant_id: z.string(),
    agent_id: z.string(),
  })
  .strict();

export type SetupRequest = z.infer<typeof SetupRequestSchema>;
export type SetupResponse = z.infer<typeof SetupResponseSchema>;
export type EnrollRequest = z.infer<typeof EnrollRequestSchema>;
export type EnrollResponse = z.infer<typeof EnrollResponseSchema>;
