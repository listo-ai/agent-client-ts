import { z } from "zod";

/**
 * One entry in `UnitRegistry.quantities`. Mirror of
 * `spi::QuantityEntry`. Enum values are kept as plain strings on
 * the wire so adding a new variant on the server doesn't break old
 * TS clients.
 */
export const QuantityEntrySchema = z
  .object({
    id: z.string(),
    /**
     * Human-friendly English name — "Temperature", "Flow rate".
     * Added in a later platform version; the schema `.default("")`
     * keeps older servers parseable.
     */
    label: z.string().default(""),
    canonical: z.string(),
    allowed: z.array(z.string()),
    symbol: z.string(),
  })
  .strict();

/**
 * Affine conversion coefficients to the quantity's canonical unit.
 * `canonical = scale * value + offset`. Inverse:
 * `value = (canonical - offset) / scale`.
 *
 * Covers both linear (bar → kPa = ×100 + 0) and the registry's one
 * non-linear conversion (°F → °C = ×5/9 + −17.78…). Mirrors
 * `spi::AffineCoeffs`.
 */
export const AffineCoeffsSchema = z
  .object({
    scale: z.number(),
    offset: z.number(),
  })
  .strict();

/**
 * One entry in `UnitRegistry.units` — flat table of every unit
 * with compact symbol, human label, and conversion coefficients.
 * Clients use these coefficients to render preferences-aware
 * values without a round-trip and without a hard-coded TS table
 * (which would drift from the server's uom-backed registry).
 */
export const UnitEntrySchema = z
  .object({
    id: z.string(),
    symbol: z.string(),
    label: z.string(),
    /**
     * Affine coefficients to the unit's quantity canonical.
     * Absent for units that genuinely have no conversion — none
     * today, but forward-compat room for dimensionless additions.
     */
    to_canonical: AffineCoeffsSchema.optional(),
  })
  .strict();

/**
 * Response from `GET /api/v1/units`. See
 * `agent/docs/design/USER-PREFERENCES.md` § "API surface".
 */
export const UnitRegistrySchema = z
  .object({
    quantities: z.array(QuantityEntrySchema),
    /**
     * Flat unit table — added in a later platform version. Defaults
     * to an empty array when parsing an older server response.
     */
    units: z.array(UnitEntrySchema).default([]),
  })
  .strict();

export type QuantityEntry = z.infer<typeof QuantityEntrySchema>;
export type UnitEntry = z.infer<typeof UnitEntrySchema>;
export type UnitRegistry = z.infer<typeof UnitRegistrySchema>;
export type AffineCoeffs = z.infer<typeof AffineCoeffsSchema>;
