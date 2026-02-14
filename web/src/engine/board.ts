// Board generation utilities

import type { Tile } from "./types";
import { boardFromCode, codeFromBoard, TOTAL_PERMUTATIONS } from "./permutation";

/**
 * Create a random board and return its code + tile layout.
 */
export function createRandomBoard(): { board: Tile[]; code: number } {
  const code = Math.floor(Math.random() * TOTAL_PERMUTATIONS);
  const board = boardFromCode(code)!;
  return { board, code };
}

/**
 * Create a board from a specific code.
 * Returns null if the code is invalid.
 */
export function createBoardFromCode(
  code: number
): { board: Tile[]; code: number } | null {
  const board = boardFromCode(code);
  if (!board) return null;
  return { board, code };
}

/**
 * Get the board code for a given tile layout.
 */
export function getBoardCode(board: Tile[]): number {
  return codeFromBoard(board);
}
