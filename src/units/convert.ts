/**
 * Client-side unit conversion using server-supplied factors.
 *
 * **Design rule** (`USER-PREFERENCES.md § "Client-side unit
 * conversion"`): conversion factors live on the server's registry
 * (`GET /api/v1/units`). This module carries **no hard-coded
 * tables** — it reads `to_canonical` coefficients off the fetched
 * `UnitRegistry` response and applies them.
 *
 * That keeps the TS side in lockstep with the Rust `uom`-backed
 * registry: a server change to a conversion factor reaches the UI
 * on the next registry fetch, no TS release required.
 *
 * Callers:
 * 1. Fetch the registry once per session (`client.units.get()`) and
 *    cache it.
 * 2. Call `convertUnit(registry, quantity, value, fromId, toId)`
 *    per value they render.
 * 3. Format the result via `Intl.NumberFormat` (locale-aware) or
 *    the unit's `symbol` from the same response.
 *
 * Returns `null` when either unit doesn't appear in the registry
 * for the given quantity, or when affine coefficients are absent.
 * Callers typically fall back to displaying the value as-is (the
 * slot's declared unit) when `null` comes back.
 */

import type { UnitRegistry } from "../schemas/units.js";

/**
 * Convert `value` (in `fromUnit`) to `toUnit` within `quantity`,
 * using coefficients from the registry response.
 *
 * Both units must be in the quantity's `allowed` set. The
 * registry ships affine `to_canonical` coefficients for every
 * allowed unit, so the conversion is:
 *
 * ```text
 * canonical = from.scale * value + from.offset
 * result    = (canonical - to.offset) / to.scale
 * ```
 */
export function convertUnit(
  registry: UnitRegistry,
  quantity: string,
  value: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  if (fromUnit === toUnit) return value;
  const q = registry.quantities.find((entry) => entry.id === quantity);
  if (!q) return null;
  if (!q.allowed.includes(fromUnit) || !q.allowed.includes(toUnit)) return null;

  const from = registry.units.find((u) => u.id === fromUnit)?.to_canonical;
  const to = registry.units.find((u) => u.id === toUnit)?.to_canonical;
  if (!from || !to) return null;

  const canonical = from.scale * value + from.offset;
  return (canonical - to.offset) / to.scale;
}

/**
 * Look up the compact display symbol for a unit — "°C", "psi",
 * "L/s". Returns an empty string for units the registry didn't
 * ship (shouldn't happen under normal flow).
 */
export function unitSymbol(registry: UnitRegistry, unitId: string): string {
  return registry.units.find((u) => u.id === unitId)?.symbol ?? "";
}

/**
 * Look up the human-readable label — "Degrees Celsius", "Pounds
 * per square inch". Returns the raw id when the unit isn't known.
 */
export function unitLabel(registry: UnitRegistry, unitId: string): string {
  return registry.units.find((u) => u.id === unitId)?.label ?? unitId;
}

/**
 * Canonical (storage) unit id for a quantity — useful when the
 * slot's `unit` field is absent on the wire (meaning "stored in
 * canonical"). Returns `undefined` for unknown quantities.
 */
export function canonicalUnitFor(
  registry: UnitRegistry,
  quantity: string,
): string | undefined {
  return registry.quantities.find((q) => q.id === quantity)?.canonical;
}
