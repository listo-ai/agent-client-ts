import { z } from "zod";

import type { RequestTransport } from "../transport/request.js";

/**
 * Ad-hoc analytical compute — `POST /api/v1/analyze`.
 *
 * Thin wrapper over the analytics-engine sidecar's Zenoh queryable
 * with `dry_run = true`. The wire shape is locked against
 * `docs/design/ANALYTICS.md` § "Global search — the two-endpoint
 * split"; today the agent returns `503 analytics_unavailable` until
 * the sidecar is deployed.
 *
 * Callers should treat `503 { code: "analytics_unavailable" }` as
 * "analytics is not enabled on this agent" (surface gracefully), not
 * as a transient failure.
 */

export interface AnalyzeRequest {
  /** Named Dataset references or inline Dataset bodies keyed by the
   *  table name the SQL stage references. */
  inputs?: Record<string, unknown>;
  /** DataFusion SQL. Optional. */
  sql?: string;
  /** Rhai script. Optional. */
  rhai?: string;
  /** Post-SQL row cap. Omit to use server default. */
  row_cap?: number;
  /** Per-call timeout in milliseconds. Omit to use server default. */
  timeout_ms?: number;
}

export const AnalyzeMetaSchema = z.object({
  rows_in: z.number().int().nonnegative(),
  rows_out: z.number().int().nonnegative(),
  duration_ms: z.number().int().nonnegative(),
  /** Always `true` on this endpoint — writes happen through the flow
   *  engine, not here. */
  dry_run: z.boolean(),
});

export const AnalyzeResponseSchema = z.object({
  rows: z.array(z.unknown()),
  meta: AnalyzeMetaSchema,
});

export type AnalyzeMeta = z.infer<typeof AnalyzeMetaSchema>;
export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

export interface AnalyzeApi {
  /** Execute an ad-hoc rule. Throws if analytics-engine is not
   *  deployed — catch and inspect `error.code === "analytics_unavailable"`. */
  run(req: AnalyzeRequest): Promise<AnalyzeResponse>;
}

export function createAnalyzeApi(http: RequestTransport, apiVersion: number): AnalyzeApi {
  const base = `/api/v${apiVersion}/analyze`;
  return {
    async run(req: AnalyzeRequest): Promise<AnalyzeResponse> {
      const raw = await http.post<unknown>(base, req);
      return AnalyzeResponseSchema.parse(raw);
    },
  };
}
