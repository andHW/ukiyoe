// Game rules: legal moves, win detection, state transitions

import type {
  GameState,
  Player,
  Tile,
} from "./types";
import { WinMethod } from "./types";
import { OPENING_INDICES, WIN_MASKS } from "./constants";

/**
 * Create the initial game state from a board and its code.
 */
export function createInitialState(board: Tile[], boardCode: number): GameState {
  return {
    board,
    boardCode,
    p1Mask: 0,
    p2Mask: 0,
    lastMoveIndex: null,
    currentPlayer: "p1",
    moveHistory: [],
    winner: null,
    isDraw: false,
    isGameOver: false,
  };
}

/**
 * Get all legal move indices for the current game state.
 */
export function getLegalMoves(state: GameState): number[] {
  if (state.isGameOver) return [];

  const takenMask = state.p1Mask | state.p2Mask;
  const moves: number[] = [];

  // First move: must be on edge
  if (state.lastMoveIndex === null) {
    for (const i of OPENING_INDICES) {
      if (!(takenMask & (1 << i))) {
        moves.push(i);
      }
    }
    return moves;
  }

  // Subsequent moves: must match plant or poem of last tile
  const lastTile = state.board[state.lastMoveIndex];
  for (let i = 0; i < 16; i++) {
    if (!(takenMask & (1 << i))) {
      const tile = state.board[i];
      if (tile.plant === lastTile.plant || tile.poem === lastTile.poem) {
        moves.push(i);
      }
    }
  }

  return moves;
}

/**
 * Check if a bitmask contains a winning pattern.
 * Returns the WinResult (method + pattern) or null.
 */
export function checkWin(mask: number): { method: WinMethod; pattern: number } | null {
  for (const [wm, method] of WIN_MASKS) {
    if ((mask & wm) === wm) {
      return { method, pattern: wm };
    }
  }
  return null;
}

/**
 * Apply a move and return the new game state (immutable).
 */
export function applyMove(state: GameState, moveIndex: number): GameState {
  if (state.isGameOver) return state;

  const isP1 = state.currentPlayer === "p1";
  const newP1Mask = isP1 ? state.p1Mask | (1 << moveIndex) : state.p1Mask;
  const newP2Mask = isP1 ? state.p2Mask : state.p2Mask | (1 << moveIndex);
  const nextPlayer: Player = isP1 ? "p2" : "p1";
  const newHistory = [...state.moveHistory, moveIndex];

  const newState: GameState = {
    ...state,
    p1Mask: newP1Mask,
    p2Mask: newP2Mask,
    lastMoveIndex: moveIndex,
    currentPlayer: nextPlayer,
    moveHistory: newHistory,
  };

  // Check if current player just won
  const currentMask = isP1 ? newP1Mask : newP2Mask;
  const winResult = checkWin(currentMask);
  if (winResult) {
    newState.winner = {
      winner: state.currentPlayer,
      method: winResult.method,
      pattern: winResult.pattern,
    };
    newState.isGameOver = true;
    return newState;
  }

  // Check for draw (board full)
  if (newHistory.length === 16) {
    newState.isDraw = true;
    newState.isGameOver = true;
    return newState;
  }

  // Check for blockade (next player has no legal moves)
  const nextMoves = getLegalMoves(newState);
  if (nextMoves.length === 0) {
    // Current player wins by blockade
    newState.winner = {
      winner: state.currentPlayer,
      method: WinMethod.Blockade,
      pattern: 0,
    };
    newState.isGameOver = true;
    return newState;
  }

  return newState;
}
