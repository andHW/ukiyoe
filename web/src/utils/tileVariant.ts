/** Deterministic tile layout variant based on plant/poem combination */
const STYLES = [
  "variant-standard",
  "variant-reversed",
  "variant-centered",
  "variant-diagonal",
] as const;

export type TileVariant = (typeof STYLES)[number];

export function getTileVariant(plant: number, poem: number): TileVariant {
  // (plant * 3 + poem) % 4 distributes styles, preventing row/col patterns
  return STYLES[(plant * 3 + poem) % 4];
}
