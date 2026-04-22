import { z } from "zod";
import { LifecycleSchema } from "./events.js";

/**
 * Node + slot snapshots as returned by `GET /api/v1/search?scope=nodes` and
 * `GET /api/v1/node?path=...`. Mirrors the Rust `NodeDto` in
 * `crates/transport-rest/src/routes.rs`.
 */

export const SlotSchema = z.object({
  name: z.string(),
  value: z.unknown(),
  generation: z.number().int().nonnegative(),
  /**
   * Physical quantity declared on the slot, if any (snake_case string
   * form of `spi::Quantity`, e.g. `"temperature"`, `"pressure"`).
   * Absent for dimensionless slots. Clients pair with user
   * preferences to decide which display unit to render.
   */
  quantity: z.string().optional(),
  /**
   * Unit the stored `value` is expressed in. `undefined` means
   * "canonical for `quantity`" — resolved via `GET /api/v1/units`.
   */
  unit: z.string().optional(),
});

export const NodeSnapshotSchema = z.object({
  id: z.string(),
  kind: z.string(),
  /** Slash-separated materialised path, e.g. `/station/floor3/ahu-1`. */
  path: z.string(),
  /**
   * Materialised parent path. `"/"` for depth-1 nodes, `null` for root.
   * Use with `filter=parent_path==<path>` to list direct children only.
   */
  parent_path: z.string().nullable(),
  parent_id: z.string().nullable(),
  /**
   * Whether the node has at least one child. Lets tree UIs render expand
   * chevrons without issuing a speculative child query.
   */
  has_children: z.boolean(),
  lifecycle: LifecycleSchema,
  slots: z.array(SlotSchema),
});

export const PageMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  size: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
});

export const NodeListResponseSchema = z.object({
  data: z.array(NodeSnapshotSchema),
  meta: PageMetaSchema,
});

/**
 * One slot's manifest declaration — mirrors Rust `NodeSchema.slots[]`
 * / `spi::SlotSchema`. Field-for-field with the wire.
 */
export const NodeSlotSchemaSchema = z.object({
  name: z.string(),
  role: z.enum(["config", "input", "output", "status"]),
  value_kind: z
    .enum(["null", "bool", "number", "string", "json", "binary"])
    .default("null"),
  /** JSON Schema for values written to this slot. Shape is open. */
  value_schema: z.unknown(),
  writable: z.boolean().default(false),
  trigger: z.boolean().default(false),
  is_internal: z.boolean().default(false),
  emit_on_init: z.boolean().default(false),
  /** Physical quantity declared by the slot, if any. */
  quantity: z.string().optional(),
  /** Sensor-native unit (pre-ingest-conversion). */
  sensor_unit: z.string().optional(),
  /** Unit the stored value is expressed in. */
  unit: z.string().optional(),
});

/**
 * `GET /api/v1/node/schema?path=<path>` response — the kind-declared
 * slot schemas for one node. Lets callers answer "what slots does
 * this node have and what does each carry?" in one request, no
 * cross-reference against `/kinds` needed.
 */
export const NodeSchemaSchema = z.object({
  id: z.string(),
  kind: z.string(),
  path: z.string(),
  slots: z.array(NodeSlotSchemaSchema),
});

export type Slot = z.infer<typeof SlotSchema>;
export type NodeSnapshot = z.infer<typeof NodeSnapshotSchema>;
export type PageMeta = z.infer<typeof PageMetaSchema>;
export type NodeListResponse = z.infer<typeof NodeListResponseSchema>;
export type NodeSlotSchema = z.infer<typeof NodeSlotSchemaSchema>;
export type NodeSchema = z.infer<typeof NodeSchemaSchema>;
