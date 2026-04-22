import { describe, it, expect } from "vitest";

import {
  convertUnit,
  unitSymbol,
  unitLabel,
  canonicalUnitFor,
} from "../src/units/convert.js";
import type { UnitRegistry } from "../src/schemas/units.js";

/**
 * Tests for the client-side unit converter.
 *
 * Design rule: the converter reads coefficients off the `UnitRegistry`
 * response — no hardcoded factors in TS. These tests construct a
 * minimal registry with known coefficients (the well-known
 * °C ↔ °F and bar ↔ kPa conversions) and verify:
 *
 * - Linear conversions round-trip exactly through canonical.
 * - Affine (temperature) conversions round-trip through canonical.
 * - Unknown quantity / unit → `null` (not a throw; callers fall
 *   back to displaying as-is).
 * - Same-unit conversion is identity (no precision loss).
 * - `unitSymbol` / `unitLabel` / `canonicalUnitFor` return the
 *   expected values or sensible fallbacks for unknown ids.
 *
 * Alignment with server factors is enforced on the Rust side in
 * `listo-spi::units::tests::affine_coefficients_round_trip_against_registry_convert`.
 * Here we only verify the reader logic.
 */

/** Minimal stand-in registry covering the conversions these tests probe. */
function fixtureRegistry(): UnitRegistry {
  return {
    quantities: [
      {
        id: "temperature",
        label: "Temperature",
        canonical: "celsius",
        allowed: ["celsius", "fahrenheit", "kelvin"],
        symbol: "°C",
      },
      {
        id: "pressure",
        label: "Pressure",
        canonical: "kilopascal",
        allowed: ["kilopascal", "bar", "psi"],
        symbol: "kPa",
      },
    ],
    units: [
      {
        id: "celsius",
        symbol: "°C",
        label: "Degrees Celsius",
        to_canonical: { scale: 1, offset: 0 },
      },
      {
        id: "fahrenheit",
        symbol: "°F",
        label: "Degrees Fahrenheit",
        // °F → °C: (v − 32) × 5/9 = v × 5/9 + (−32 × 5/9)
        to_canonical: { scale: 5 / 9, offset: -32 * (5 / 9) },
      },
      {
        id: "kelvin",
        symbol: "K",
        label: "Kelvin",
        to_canonical: { scale: 1, offset: -273.15 },
      },
      {
        id: "kilopascal",
        symbol: "kPa",
        label: "Kilopascals",
        to_canonical: { scale: 1, offset: 0 },
      },
      {
        id: "bar",
        symbol: "bar",
        label: "Bar",
        to_canonical: { scale: 100, offset: 0 },
      },
      {
        id: "psi",
        symbol: "psi",
        label: "Pounds per square inch",
        to_canonical: { scale: 6.894757293168361, offset: 0 },
      },
    ],
  };
}

describe("convertUnit — temperature (affine)", () => {
  const r = fixtureRegistry();

  it("°C → °F matches known reference values", () => {
    expect(convertUnit(r, "temperature", 0, "celsius", "fahrenheit")).toBeCloseTo(32, 9);
    expect(convertUnit(r, "temperature", 100, "celsius", "fahrenheit")).toBeCloseTo(212, 9);
    expect(convertUnit(r, "temperature", 22, "celsius", "fahrenheit")).toBeCloseTo(71.6, 9);
  });

  it("°F → °C round-trips", () => {
    const c = convertUnit(r, "temperature", 72.4, "fahrenheit", "celsius")!;
    expect(c).toBeCloseTo(22.4444, 4);
    // Round-trip back.
    const f = convertUnit(r, "temperature", c, "celsius", "fahrenheit")!;
    expect(f).toBeCloseTo(72.4, 9);
  });

  it("°C ↔ K uses offset correctly", () => {
    expect(convertUnit(r, "temperature", 0, "celsius", "kelvin")).toBeCloseTo(273.15, 9);
    expect(convertUnit(r, "temperature", 273.15, "kelvin", "celsius")).toBeCloseTo(0, 9);
  });
});

describe("convertUnit — pressure (linear)", () => {
  const r = fixtureRegistry();

  it("bar → kPa is ×100", () => {
    expect(convertUnit(r, "pressure", 1, "bar", "kilopascal")).toBeCloseTo(100, 9);
    expect(convertUnit(r, "pressure", 1.01325, "bar", "kilopascal")).toBeCloseTo(101.325, 9);
  });

  it("kPa → psi matches standard atmosphere", () => {
    // 101.325 kPa ≈ 14.696 psi.
    expect(convertUnit(r, "pressure", 101.325, "kilopascal", "psi")).toBeCloseTo(14.696, 3);
  });

  it("psi → bar via canonical", () => {
    const bar = convertUnit(r, "pressure", 14.696, "psi", "bar")!;
    expect(bar).toBeCloseTo(1.01325, 4);
  });
});

describe("convertUnit — edge cases", () => {
  const r = fixtureRegistry();

  it("same unit returns identity (no precision drift)", () => {
    // Identity path should NOT run through canonical — verify by
    // using a value that would lose precision through an f64
    // round-trip if the scaling were applied.
    expect(convertUnit(r, "temperature", 1.23456789012345, "celsius", "celsius")).toBe(
      1.23456789012345,
    );
  });

  it("unknown quantity returns null", () => {
    expect(convertUnit(r, "wumbology", 1, "celsius", "fahrenheit")).toBeNull();
  });

  it("unknown from-unit returns null", () => {
    expect(convertUnit(r, "temperature", 1, "rankine", "celsius")).toBeNull();
  });

  it("unknown to-unit returns null", () => {
    expect(convertUnit(r, "temperature", 1, "celsius", "rankine")).toBeNull();
  });

  it("unit not in quantity's allowed set returns null", () => {
    // `bar` is pressure, not temperature.
    expect(convertUnit(r, "temperature", 1, "celsius", "bar")).toBeNull();
  });
});

describe("lookup helpers", () => {
  const r = fixtureRegistry();

  it("unitSymbol returns compact symbol", () => {
    expect(unitSymbol(r, "celsius")).toBe("°C");
    expect(unitSymbol(r, "psi")).toBe("psi");
  });

  it("unitSymbol falls back to empty string for unknown id", () => {
    expect(unitSymbol(r, "furlongs_per_fortnight")).toBe("");
  });

  it("unitLabel returns human-readable name", () => {
    expect(unitLabel(r, "celsius")).toBe("Degrees Celsius");
  });

  it("unitLabel falls back to the raw id when unknown", () => {
    expect(unitLabel(r, "furlongs_per_fortnight")).toBe("furlongs_per_fortnight");
  });

  it("canonicalUnitFor returns the quantity's canonical", () => {
    expect(canonicalUnitFor(r, "temperature")).toBe("celsius");
    expect(canonicalUnitFor(r, "pressure")).toBe("kilopascal");
  });

  it("canonicalUnitFor returns undefined for unknown quantity", () => {
    expect(canonicalUnitFor(r, "wumbology")).toBeUndefined();
  });
});
