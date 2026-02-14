// Core game types for Ukiyoe

export enum Plant {
  Maple = 0,
  Cherry = 1,
  Pine = 2,
  Iris = 3,
}

export enum Poem {
  Sun = 0,
  Bird = 1,
  Rain = 2,
  Cloud = 3,
}

export interface Tile {
  plant: Plant;
  poem: Poem;
}

export type Player = "p1" | "p2";

export enum WinMethod {
  Row = "Row",
  Column = "Column",
  MainDiagonal = "Main Diagonal",
  AntiDiagonal = "Anti Diagonal",
  Square = "Square",
  Blockade = "Blockade",
}

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
