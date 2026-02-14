// Core game types for Ukiyoe

export const Plant = {
  Maple: 0,
  Cherry: 1,
  Pine: 2,
  Iris: 3,
} as const;

export type Plant = (typeof Plant)[keyof typeof Plant];

export const Poem = {
  RisingSun: 0,
  Bird: 1,
  Rain: 2,
  PoemFlag: 3,
} as const;

export type Poem = (typeof Poem)[keyof typeof Poem];

export interface Tile {
  plant: Plant;
  poem: Poem;
}

export type Player = "p1" | "p2";

export const WinMethod = {
  Row: "Row",
  Column: "Column",
  MainDiagonal: "Main Diagonal",
  AntiDiagonal: "Anti Diagonal",
  Square: "Square",
  Blockade: "Blockade",
} as const;

export type WinMethod = (typeof WinMethod)[keyof typeof WinMethod];

export type GameMode = "local" | "vs-ai";

export type Difficulty = "easy" | "medium" | "hard";

export interface WinResult {
  winner: Player;
  method: WinMethod;
  /** Bitmask of the winning cells (for highlighting) */
  pattern: number;
}

export interface GameState {
  board: Tile[];
  boardCode: number;
  p1Mask: number;
  p2Mask: number;
  lastMoveIndex: number | null;
  currentPlayer: Player;
  moveHistory: number[];
  winner: WinResult | null;
  isDraw: boolean;
  isGameOver: boolean;
}
