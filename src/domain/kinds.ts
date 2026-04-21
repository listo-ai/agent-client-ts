import type { RequestTransport } from "../transport/request.js";
import { KindSchema } from "../schemas/kind.js";
import type { Kind } from "../schemas/kind.js";

/**
 * Query options accepted by `/api/v1/kinds`. All fields are optional
 * and compose — e.g. `{ facet: "isCompute", filter: "org==com.listo" }`
 * returns compute-faceted kinds published by `com.listo`.
 *
 * The `filter` / `sort` strings are RSQL expressions over the palette's
 * exposed fields (see the agent's `kinds_query_schema`):
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
   * everything (same as the bare `GET /api/v1/kinds` from v1.
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

function buildQueryString(opts: ListKindsOptions): string {
  const qs = new URLSearchParams();
  if (opts.filter) qs.set("filter", opts.filter);
  if (opts.sort) qs.set("sort", opts.sort);
  if (opts.facet) qs.set("facet", opts.facet);
  if (opts.placeableUnder) qs.set("placeable_under", opts.placeableUnder);
  const rendered = qs.toString();
  return rendered ? `?${rendered}` : "";
}

export function createKindsApi(http: RequestTransport, apiVersion: number): KindsApi {
  const base = `/api/v${apiVersion}/kinds`;

  const list = async (opts: ListKindsOptions = {}): Promise<Kind[]> => {
    const raw = await http.get<unknown[]>(`${base}${buildQueryString(opts)}`);
    return raw.map((entry) => KindSchema.parse(entry));
  };

  return {
    list,
    listPlaceableUnder(parentPath: string): Promise<Kind[]> {
      return list({ placeableUnder: parentPath });
    },
  };
}
