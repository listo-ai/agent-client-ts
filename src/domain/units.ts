import type { RequestTransport } from "../transport/request.js";
import { UnitRegistrySchema } from "../schemas/units.js";
import type { UnitRegistry } from "../schemas/units.js";

export interface UnitsApi {
  /**
   * Read the full quantity / unit registry. Safe to cache for the
   * lifetime of the platform version — the registry is static per
   * release.
   */
  get(): Promise<UnitRegistry>;
}

export function createUnitsApi(http: RequestTransport, apiVersion: number): UnitsApi {
  const base = `/api/v${apiVersion}`;
  return {
    async get(): Promise<UnitRegistry> {
      const raw = await http.get<unknown>(`${base}/units`);
      return UnitRegistrySchema.parse(raw);
    },
  };
}
