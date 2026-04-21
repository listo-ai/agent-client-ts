import { z } from "zod";

/**
 * Wire shape for `GET /api/v1/search?scope=links` and
 * `POST /api/v1/links`. Mirrors `LinkDto` / `EndpointDto` in
 * `crates/graph/src/links/dto.rs`.
 */

export const LinkEndpointSchema = z.object({
  node_id: z.string(),
  path: z.string().nullable().optional(),
  slot: z.string(),
});

export const LinkSchema = z.object({
  id: z.string(),
  source: LinkEndpointSchema,
  target: LinkEndpointSchema,
  /** Shared parent path of both endpoints; `null`/absent when the
   *  endpoints diverge at the root. */
  scope_path: z.string().nullable().optional(),
});

export type LinkEndpoint = z.infer<typeof LinkEndpointSchema>;
export type Link = z.infer<typeof LinkSchema>;
