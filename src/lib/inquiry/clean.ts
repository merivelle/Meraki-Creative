import { dropUnknownChoices } from "@/lib/forms/sanitize";
import type { Answers, FormDefinition } from "@/lib/forms/types";

/**
 * Retired options are dropped (older drafts), and a design direction can't be both preferred
 * and avoided: if both arrive, the preference wins.
 */
export function cleanAnswers(def: FormDefinition, raw: Answers): Answers {
  const a = dropUnknownChoices(def, raw);
  if (Array.isArray(a.brief_styles) && Array.isArray(a.brief_styles_avoid)) {
    const chosen = new Set(a.brief_styles as string[]);
    const avoid = (a.brief_styles_avoid as string[]).filter((x) => !chosen.has(x));
    if (avoid.length) a.brief_styles_avoid = avoid;
    else delete a.brief_styles_avoid;
  }
  return a;
}
