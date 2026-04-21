import { z } from "zod";

import type { RequestTransport } from "../transport/request.js";
import {
  PluginRuntimeEntrySchema,
  PluginRuntimeStateSchema,
  PluginSummarySchema,
} from "../schemas/block.js";
import type {
  PluginRuntimeEntry,
  PluginRuntimeState,
  PluginSummary,
} from "../schemas/block.js";

/**
 * Block operations against the agent's REST surface. Listing goes
 * through the generic `GET /api/v1/search?scope=blocks` endpoint; the
 * rest hit dedicated `/api/v1/blocks/...` routes.
 */
export interface BlocksApi {
  list(): Promise<PluginSummary[]>;
  get(id: string): Promise<PluginSummary>;
  enable(id: string): Promise<void>;
  disable(id: string): Promise<void>;
  /** Rescan the blocks dir. Dev-loop ergonomics. */
  reload(): Promise<void>;
  /** Runtime state for a single process block. */
  runtime(id: string): Promise<PluginRuntimeState>;
  /** Snapshot of all process-block runtime states. */
  runtimeAll(): Promise<PluginRuntimeEntry[]>;
}

const BlocksSearchEnvelope = z.object({
  scope: z.string(),
  hits: z.array(PluginSummarySchema),
  meta: z.object({ total: z.number().int().nonnegative() }),
});

export function createBlocksApi(http: RequestTransport, apiVersion: number): BlocksApi {
  const base = `/api/v${apiVersion}`;

  return {
    async list(): Promise<PluginSummary[]> {
      const raw = await http.get<unknown>(`${base}/search?scope=blocks`);
      return BlocksSearchEnvelope.parse(raw).hits;
    },

    async get(id: string): Promise<PluginSummary> {
      const raw = await http.get<unknown>(
        `${base}/blocks/${encodeURIComponent(id)}`,
      );
      return PluginSummarySchema.parse(raw);
    },

    async enable(id: string): Promise<void> {
      await http.postNoContent(
        `${base}/blocks/${encodeURIComponent(id)}/enable`,
        {},
      );
    },

    async disable(id: string): Promise<void> {
      await http.postNoContent(
        `${base}/blocks/${encodeURIComponent(id)}/disable`,
        {},
      );
    },

    async reload(): Promise<void> {
      await http.postNoContent(`${base}/blocks/reload`, {});
    },

    async runtime(id: string): Promise<PluginRuntimeState> {
      const raw = await http.get<unknown>(
        `${base}/blocks/${encodeURIComponent(id)}/runtime`,
      );
      return PluginRuntimeStateSchema.parse(raw);
    },

    async runtimeAll(): Promise<PluginRuntimeEntry[]> {
      const raw = await http.get<unknown[]>(`${base}/blocks/runtime`);
      return raw.map((r) => PluginRuntimeEntrySchema.parse(r));
    },
  };
}
