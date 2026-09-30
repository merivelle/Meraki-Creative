/**
 * Readable, self-contained descriptions of design-brief answers for the review screen, the
 * studio email, and the admin view: palettes carry their hex values, pairings their roles.
 */
import { paletteById, paletteSummary } from "./palettes";
import { pairingById, pairingRoles } from "./typography";

const PALETTE_QUESTIONS = new Set(["brief_palette", "brief_palette_alt"]);
const PAIRING_QUESTIONS = new Set(["brief_type_pair", "brief_type_alt"]);

/** A fuller label for one stored value, or undefined to use the plain option label. */
export function describeDesignValue(questionId: string, value: string): string | undefined {
  if (PALETTE_QUESTIONS.has(questionId)) {
    const p = paletteById(value);
    return p ? paletteSummary(p) : undefined;
  }
  if (PAIRING_QUESTIONS.has(questionId)) {
    const p = pairingById(value);
    return p ? pairingRoles(p) : undefined;
  }
  return undefined;
}
