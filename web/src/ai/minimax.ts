// Minimax solver with alpha-beta pruning (ported from Python solver)

import type { GameState } from "../engine/types";
import type { WinMethod } from "../engine/types";
import { WIN_MASKS, OPENING_INDICES } from "../engine/constants";

interface AIResult {
  move: number;
  score: number;
}

const P1_WINS = 1;
const P1_LOSES = -1;
const DRAW_SCORE = 0;

function checkWinMask(mask: number): WinMethod | null {
  for (const [wm, method] of WIN_MASKS) {
    if ((mask & wm) === wm) return method;
  }
  return null;
}

function getLegalMovesRaw(
  board: GameState["board"],
  takenMask: number,
  lastMoveIdx: number | null
): number[] {
  const moves: number[] = [];

  if (lastMoveIdx === null) {
    for (const i of OPENING_INDICES) {
      if (!(takenMask & (1 << i))) moves.push(i);
    }
    return moves;
  }

  const lastTile = board[lastMoveIdx];
  for (let i = 0; i < 16; i++) {
    if (!(takenMask & (1 << i))) {
      const tile = board[i];
      if (tile.plant === lastTile.plant || tile.poem === lastTile.poem) {
        moves.push(i);
      }
    }
  }
  return moves;
}

function minimax(
  board: GameState["board"],
  p1Mask: number,
  p2Mask: number,
  lastMoveIdx: number,
  isP1Turn: boolean,
  alpha: number,
  beta: number,
  depth: number,
  maxDepth: number,
  cache: Map<string, number>
): number {
  // Cache lookup
  const key = `${p1Mask},${p2Mask},${lastMoveIdx},${isP1Turn ? 1 : 0}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  // Check if previous move won
  const prevMask = isP1Turn ? p2Mask : p1Mask;
  if (checkWinMask(prevMask) !== null) {
    const score = isP1Turn ? P1_LOSES : P1_WINS;
    cache.set(key, score);
    return score;
  }

  // Full board = draw
  if (depth === 16) {
    cache.set(key, DRAW_SCORE);
    return DRAW_SCORE;
  }

  // Depth limit for medium difficulty
  if (maxDepth > 0 && depth >= maxDepth) {
    cache.set(key, DRAW_SCORE);
    return DRAW_SCORE;
  }

  // Legal moves
  const takenMask = p1Mask | p2Mask;
  const moves = getLegalMovesRaw(board, takenMask, lastMoveIdx);

  // Blockade
  if (moves.length === 0) {
    const score = isP1Turn ? P1_LOSES : P1_WINS;
    cache.set(key, score);
    return score;
  }

  let bestScore: number;

  if (isP1Turn) {
    bestScore = -Infinity;
    for (const move of moves) {
      const score = minimax(
        board, p1Mask | (1 << move), p2Mask, move, false,
        alpha, beta, depth + 1, maxDepth, cache
      );
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
  } else {
    bestScore = Infinity;
    for (const move of moves) {
      const score = minimax(
        board, p1Mask, p2Mask | (1 << move), move, true,
        alpha, beta, depth + 1, maxDepth, cache
      );
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
  }

  cache.set(key, bestScore);
  return bestScore;
}

/**
 * Find the best move for the current player.
 *
 * @param state Current game state
 * @param maxDepth 0 = unlimited (hard), >0 = depth-limited (medium)
 */
export function findBestMove(state: GameState, maxDepth: number = 0): AIResult {
  const cache = new Map<string, number>();
  const isP1 = state.currentPlayer === "p1";
  const takenMask = state.p1Mask | state.p2Mask;
  const moves = getLegalMovesRaw(state.board, takenMask, state.lastMoveIndex);

  let bestMove = moves[0];
  let bestScore = isP1 ? -Infinity : Infinity;

  for (const move of moves) {
    const newP1 = isP1 ? state.p1Mask | (1 << move) : state.p1Mask;
    const newP2 = isP1 ? state.p2Mask : state.p2Mask | (1 << move);
    const depth = state.moveHistory.length + 1;

    const score = minimax(
      state.board, newP1, newP2, move, !isP1,
      -Infinity, Infinity, depth, maxDepth, cache
    );

    if (isP1 ? score > bestScore : score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return { move: bestMove, score: bestScore };
}

/**
 * Pick a random legal move (for easy difficulty).
 */
export function findRandomMove(state: GameState): AIResult {
  const takenMask = state.p1Mask | state.p2Mask;
  const moves = getLegalMovesRaw(state.board, takenMask, state.lastMoveIndex);
  const move = moves[Math.floor(Math.random() * moves.length)];
  return { move, score: 0 };
}
