import { z } from "zod";

/**
 * Fully-resolved preferences for the current caller:
 * `user ?? org ?? system_default`. Every field is populated — the
 * server never returns `null` or `undefined` here. See
 * `agent/docs/design/USER-PREFERENCES.md`.
 */
export const ResolvedPreferencesSchema = z
  .object({
    timezone: z.string(),
    locale: z.string(),
    language: z.string(),
    unit_system: z.string(),
    temperature_unit: z.string(),
    pressure_unit: z.string(),
    date_format: z.string(),
    time_format: z.string(),
    week_start: z.string(),
    number_format: z.string(),
    currency: z.string(),
    theme: z.string(),
  })
  .strict();

/**
 * Organisation-level preferences row. Every field is optional —
 * `null` / absent means "not set at this layer, inherit from system".
 */
export const OrgPreferencesSchema = z
  .object({
    org_id: z.string(),
    timezone: z.string().nullable().optional(),
    locale: z.string().nullable().optional(),
    language: z.string().nullable().optional(),
    unit_system: z.string().nullable().optional(),
    temperature_unit: z.string().nullable().optional(),
    pressure_unit: z.string().nullable().optional(),
    date_format: z.string().nullable().optional(),
    time_format: z.string().nullable().optional(),
    week_start: z.string().nullable().optional(),
    number_format: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    /** UTC epoch milliseconds — see USER-PREFERENCES.md § Time. */
    updated_at: z.number().int().nullable().optional(),
  })
  .strict();

/**
 * Sparse PATCH body. Each field has three valid wire states:
 *
 * | Field value on wire | Effect on server |
 * |---|---|
 * | omitted           | leave stored value unchanged |
 * | `null`            | revert user layer to inherit from org / defaults |
 * | string            | write the provided value |
 *
 * The schema accepts all three states. `omit` semantics are preserved
 * because every field is `.optional()`. `null` is an explicit "clear".
 *
 * Callers typically want one of the helpers below (`patchSet`,
 * `patchClear`) which produce wire-ready objects without requiring
 * the caller to remember the tri-state rules.
 */
export const PreferencesPatchSchema = z
  .object({
    timezone: z.string().nullable().optional(),
    locale: z.string().nullable().optional(),
    language: z.string().nullable().optional(),
    unit_system: z.string().nullable().optional(),
    temperature_unit: z.string().nullable().optional(),
    pressure_unit: z.string().nullable().optional(),
    date_format: z.string().nullable().optional(),
    time_format: z.string().nullable().optional(),
    week_start: z.string().nullable().optional(),
    number_format: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    theme: z.string().nullable().optional(),
  })
  .strict();

export type ResolvedPreferences = z.infer<typeof ResolvedPreferencesSchema>;
export type OrgPreferences = z.infer<typeof OrgPreferencesSchema>;
export type PreferencesPatch = z.infer<typeof PreferencesPatchSchema>;

/** Field names that participate in PATCH. */
export type PreferenceField = keyof PreferencesPatch;
