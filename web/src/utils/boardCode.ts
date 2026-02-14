import { TOTAL_PERMUTATIONS } from "../engine/permutation";

/** Validate and parse board code input */
export function parseBoardCode(input: string): number | null {
  const code = parseInt(input);
  if (!isNaN(code) && code >= 0 && code < TOTAL_PERMUTATIONS) return code;
  return null;
}
