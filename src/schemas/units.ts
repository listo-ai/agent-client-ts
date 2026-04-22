import { z } from "zod";

/**
 * One entry in the unit registry. Mirror of `spi::QuantityEntry`
 * (Rust) — kept as plain strings on the wire so adding a new variant
 * on the server doesn't break old TS clients.
 */
export const QuantityEntrySchema = z
  .object({
    id: z.string(),
    canonical: z.string(),
    allowed: z.array(z.string()),
    symbol: z.string(),
  })
  .strict();

/**
 * Response from `GET /api/v1/units`. See
 * `agent/docs/design/USER-PREFERENCES.md` § "API surface".
 */
export const UnitRegistrySchema = z
  .object({
    quantities: z.array(QuantityEntrySchema),
  })
  .strict();

export type QuantityEntry = z.infer<typeof QuantityEntrySchema>;
export type UnitRegistry = z.infer<typeof UnitRegistrySchema>;
