// Board code ↔ tile layout conversion.
// Uses the same factoradic permutation algorithm as the Python solver's
// get_permutation() so board codes are interchangeable between tools.

import { Plant, Poem } from "./types";
import type { Tile } from "./types";

/** All 16 tiles in canonical order (same as Python's TILES). */
const ALL_TILES: Tile[] = [];
for (let p = 0; p < 4; p++) {
  for (let s = 0; s < 4; s++) {
    ALL_TILES.push({ plant: p as Plant, poem: s as Poem });
  }
}

/**
 * Convert a permutation index (board code) into a tile layout.
 * Identical algorithm to Python's get_permutation() — factoradic decomposition.
 *
 * @param code Permutation index (0 to 16!-1)
 * @returns Array of 16 tiles, or null if code is out of range
 */
export function boardFromCode(code: number): Tile[] | null {
  const n = ALL_TILES.length;

  // Validate range
  if (code < 0) return null;

  const available = [...ALL_TILES];
  const result: Tile[] = [];

  // Factoradic decomposition
  let remaining = code;
  for (let i = n; i > 0; i--) {
    const fact = factorial(i - 1);
    const idx = Math.floor(remaining / fact);
    if (idx >= available.length) return null;
    remaining = remaining % fact;
    result.push(available.splice(idx, 1)[0]);
  }

  return result;
}

/**
 * Convert a tile layout back into a permutation index (board code).
 *
 * @param board Array of 16 tiles
 * @returns Permutation index, or -1 if invalid
 */
export function codeFromBoard(board: Tile[]): number {
  if (board.length !== 16) return -1;

  const available = [...ALL_TILES];
  let code = 0;

  for (let i = 0; i < 16; i++) {
    const tile = board[i];
    const idx = available.findIndex(
      (t) => t.plant === tile.plant && t.poem === tile.poem
    );
    if (idx === -1) return -1;
    code += idx * factorial(15 - i);
    available.splice(idx, 1);
  }

  return code;
}

/** Factorial lookup (precomputed for 0..16). */
const FACTORIALS: number[] = [1];
for (let i = 1; i <= 16; i++) {
  FACTORIALS.push(FACTORIALS[i - 1] * i);
}

function factorial(n: number): number {
  return FACTORIALS[n];
}

/** Total number of permutations (16!). */
export const TOTAL_PERMUTATIONS = FACTORIALS[16];
