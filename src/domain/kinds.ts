import type { RequestTransport } from "../transport/request.js";
import { KindSchema } from "../schemas/kind.js";
import type { Kind } from "../schemas/kind.js";

/**
 * Query options accepted by the kind palette — issued against
 * `GET /api/v1/search?scope=kinds`. All fields are optional and
 * compose: `{ facet: "isCompute", filter: "org==com.listo" }` returns
 * compute-faceted kinds published by `com.listo`.
 *
 * `filter` / `sort` are RSQL expressions over the palette's exposed
 * fields (see the agent's `kinds_query_schema`):
 *
 * | Field             | Operators                | Example                        |
 * |-------------------|--------------------------|--------------------------------|
 * | `id`              | eq, ne, prefix, in       | `id==sys.logic.function`       |
 * | `org`             | eq, ne, prefix, in       | `org==com.listo`               |
 * | `display_name`    | eq, ne, prefix           | `display_name=prefix=MQTT`     |
 * | `facets`          | contains, in             | `facets=contains=isCompute`    |
 * | `placement_class` | eq, ne                   | `placement_class==free`        |
 */
export interface ListKindsOptions {
  /** RSQL filter expression. */
  filter?: string;
  /** Comma-separated sort fields. Prefix with `-` for descending. */
  sort?: string;
  /** Concrete-param shortcut — filter to kinds carrying this facet. */
  facet?: string;
  /** Concrete-param shortcut — filter to kinds placeable under this parent path. */
  placeableUnder?: string;
}

export interface KindsApi {
  /**
   * List kinds matching the given options. Omit `opts` to return
   * everything.
   */
  list(opts?: ListKindsOptions): Promise<Kind[]>;

  /**
   * Shortcut for `list({ placeableUnder: parentPath })`. Kept for
   * back-compat with callers that only cared about the placement
   * check. New code should prefer `list({ placeableUnder, ... })`
   * since that composes with `filter`/`sort`.
   */
  listPlaceableUnder(parentPath: string): Promise<Kind[]>;
}

/**
 * Envelope the server emits for every scope. This wrapper unwraps
 * `hits` so callers keep receiving a plain `Kind[]`.
 */
interface SearchEnvelope {
  scope: string;
  hits: unknown[];
  meta: { total: number };
}

function buildQueryString(opts: ListKindsOptions): string {
  const qs = new URLSearchParams();
  qs.set("scope", "kinds");
  if (opts.filter) qs.set("filter", opts.filter);
  if (opts.sort) qs.set("sort", opts.sort);
  if (opts.facet) qs.set("facet", opts.facet);
  if (opts.placeableUnder) qs.set("placeable_under", opts.placeableUnder);
  return `?${qs.toString()}`;
}

export function createKindsApi(http: RequestTransport, apiVersion: number): KindsApi {
  const base = `/api/v${apiVersion}/search`;

  const list = async (opts: ListKindsOptions = {}): Promise<Kind[]> => {
    const envelope = await http.get<SearchEnvelope>(`${base}${buildQueryString(opts)}`);
    return envelope.hits.map((entry) => KindSchema.parse(entry));
  };

  return {
    list,
    listPlaceableUnder(parentPath: string): Promise<Kind[]> {
      return list({ placeableUnder: parentPath });
    },
  };
}
