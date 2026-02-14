// Game constants: win masks, opening indices, emoji mappings

import { Plant, Poem, WinMethod } from "./types";

// WIN_MASKS: [bitmask, WinMethod, patternMask]
// Each bitmask is a 16-bit int representing a winning pattern on the 4×4 grid.
const _winMasks: [number, WinMethod][] = [];

// Rows & Columns
for (let i = 0; i < 4; i++) {
  let rowMask = 0;
  let colMask = 0;
  for (let j = 0; j < 4; j++) {
    rowMask |= 1 << (i * 4 + j);
    colMask |= 1 << (j * 4 + i);
  }
  _winMasks.push([rowMask, WinMethod.Row]);
  _winMasks.push([colMask, WinMethod.Column]);
}

// Diagonals
const diag1 = (1 << 0) | (1 << 5) | (1 << 10) | (1 << 15); // ↘
const diag2 = (1 << 3) | (1 << 6) | (1 << 9) | (1 << 12); // ↙
_winMasks.push([diag1, WinMethod.MainDiagonal]);
_winMasks.push([diag2, WinMethod.AntiDiagonal]);

// 2×2 Squares
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    const idx = r * 4 + c;
    const square =
      (1 << idx) | (1 << (idx + 1)) | (1 << (idx + 4)) | (1 << (idx + 5));
    _winMasks.push([square, WinMethod.Square]);
  }
}

export const WIN_MASKS: readonly [number, WinMethod][] = _winMasks;

// Edge indices: Player 1 must start on the periphery
export const OPENING_INDICES: ReadonlySet<number> = new Set([
  0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15,
]);

// Emoji mappings
export const PLANT_EMOJI: Record<Plant, string> = {
  [Plant.Maple]: "🍁",
  [Plant.Cherry]: "🌸",
  [Plant.Pine]: "🌲",
  [Plant.Iris]: "💐",
};

export const POEM_EMOJI: Record<Poem, string> = {
  [Poem.Sun]: "☀️",
  [Poem.Bird]: "🐦",
  [Poem.Rain]: "🌧️",
  [Poem.Cloud]: "☁️",
};

export const PLANT_NAMES: Record<Plant, string> = {
  [Plant.Maple]: "Maple",
  [Plant.Cherry]: "Cherry",
  [Plant.Pine]: "Pine",
  [Plant.Iris]: "Iris",
};

export const POEM_NAMES: Record<Poem, string> = {
  [Poem.Sun]: "Sun",
  [Poem.Bird]: "Bird",
  [Poem.Rain]: "Rain",
  [Poem.Cloud]: "Cloud",
};

// Player tokens
export const PLAYER_EMOJI: Record<"p1" | "p2", string> = {
  p1: "🧑‍🌾",
  p2: "🧑‍🎨",
};
