import type { RequestTransport } from "../transport/request.js";
import { LinkSchema } from "../schemas/link.js";
import type { Link } from "../schemas/link.js";
import { z } from "zod";

/**
 * Links API — listing via `GET /api/v1/search?scope=links`, create /
 * remove via dedicated routes.
 */

export type LinkEndpointRef =
  | { path: string; slot: string }
  | { node_id: string; slot: string };

const CreateLinkRespSchema = z.object({ id: z.string() });

const LinksSearchEnvelope = z.object({
  scope: z.string(),
  hits: z.array(LinkSchema),
  meta: z.object({ total: z.number().int().nonnegative() }),
});

export interface LinksApi {
  list(): Promise<Link[]>;
  create(source: LinkEndpointRef, target: LinkEndpointRef): Promise<string>;
  remove(id: string): Promise<void>;
}

export function createLinksApi(http: RequestTransport, apiVersion: number): LinksApi {
  const base = `/api/v${apiVersion}`;
  return {
    async list(): Promise<Link[]> {
      const raw = await http.get<unknown>(`${base}/search?scope=links`);
      return LinksSearchEnvelope.parse(raw).hits;
    },
    async create(source, target): Promise<string> {
      const raw = await http.post<unknown>(`${base}/links`, { source, target });
      return CreateLinkRespSchema.parse(raw).id;
    },
    async remove(id): Promise<void> {
      await http.delete(`${base}/links/${encodeURIComponent(id)}`);
    },
  };
}
