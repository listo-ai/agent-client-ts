// @generated — DO NOT EDIT BY HAND
// Regenerate via: mani run codegen --projects contracts
// Source: listo-ai/contracts (0.1.0)

import { z } from "zod";

export const FacetSchema = z.enum([
  "isProtocol",
  "isDriver",
  "isDevice",
  "isPoint",
  "isCompute",
  "isContainer",
  "isSystem",
  "isIdentity",
  "isEphemeral",
  "isWritable",
  "isFlow",
  "isIO",
  "isAnywhere",
]);

export type Facet = z.infer<typeof FacetSchema>;

export const FACET_VALUES = FacetSchema.options;
