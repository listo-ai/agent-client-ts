import { z } from "zod";

import type { RequestTransport } from "../transport/request.js";
import {
  NodeSchemaSchema,
  NodeSnapshotSchema,
} from "../schemas/node.js";
import type {
  NodeListResponse,
  NodeSchema,
  NodeSnapshot,
} from "../schemas/node.js";

/**
 * Node operations against the agent REST surface. Listing goes through
 * the generic `GET /api/v1/search?scope=nodes` endpoint — this wrapper
 * unwraps the `{ scope, hits, meta }` envelope so callers keep
 * receiving `NodeListResponse`. Single-node reads and writes use
 * dedicated routes (`/api/v1/node`, `POST /api/v1/nodes`).
 */
export interface NodesApi {
  getNodes(): Promise<NodeSnapshot[]>;
  getNodesPage(params?: {
    filter?: string;
    sort?: string;
    page?: number;
    size?: number;
  }): Promise<NodeListResponse>;
  getNode(path: string): Promise<NodeSnapshot>;
  /**
   * Kind-declared slot schemas for one node. Internal bookkeeping
   * slots are filtered out by default; pass `includeInternal: true`
   * to see them. See `GET /api/v1/node/schema?path=...`.
   */
  getNodeSchema(path: string, includeInternal?: boolean): Promise<NodeSchema>;
  createNode(args: {
    parent: string;
    kind: string;
    name: string;
  }): Promise<{ id: string; path: string }>;
  removeNode(path: string): Promise<void>;
}

/**
 * `/api/v1/search` envelope, narrowed to the `nodes` scope. Pagination
 * fields are optional on the generic envelope but always populated by
 * the `nodes` scope.
 */
const NodesSearchEnvelope = z.object({
  scope: z.string(),
  hits: z.array(NodeSnapshotSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive().optional(),
    size: z.number().int().positive().optional(),
    pages: z.number().int().nonnegative().optional(),
  }),
});

export function createNodesApi(http: RequestTransport, apiVersion: number): NodesApi {
  const base = `/api/v${apiVersion}`;
  const getNodesPage = async (params: {
    filter?: string;
    sort?: string;
    page?: number;
    size?: number;
  } = {}): Promise<NodeListResponse> => {
    const qs = new URLSearchParams();
    qs.set("scope", "nodes");
    if (params.filter) qs.set("filter", params.filter);
    if (params.sort) qs.set("sort", params.sort);
    if (params.page !== undefined) qs.set("page", String(params.page));
    if (params.size !== undefined) qs.set("size", String(params.size));
    const raw = await http.get<unknown>(`${base}/search?${qs.toString()}`);
    const env = NodesSearchEnvelope.parse(raw);
    const total = env.meta.total;
    return {
      data: env.hits,
      meta: {
        total,
        page: env.meta.page ?? 1,
        size: env.meta.size ?? Math.max(total, 1),
        pages: env.meta.pages ?? 1,
      },
    };
  };

  return {
    async getNodes(): Promise<NodeSnapshot[]> {
      const page = await getNodesPage();
      return page.data;
    },

    getNodesPage,

    async getNode(path: string): Promise<NodeSnapshot> {
      const raw = await http.get<unknown>(
        `${base}/node?path=${encodeURIComponent(path)}`,
      );
      return NodeSnapshotSchema.parse(raw);
    },

    async getNodeSchema(
      path: string,
      includeInternal = false,
    ): Promise<NodeSchema> {
      const qs = new URLSearchParams({
        path,
        include_internal: String(includeInternal),
      });
      const raw = await http.get<unknown>(`${base}/node/schema?${qs.toString()}`);
      return NodeSchemaSchema.parse(raw);
    },

    async createNode(args): Promise<{ id: string; path: string }> {
      return http.post<{ id: string; path: string }>(`${base}/nodes`, args);
    },

    async removeNode(path: string): Promise<void> {
      await http.delete(`${base}/node?path=${encodeURIComponent(path)}`);
    },
  };
}
