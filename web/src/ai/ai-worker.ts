// Web Worker for AI computation (prevents UI freezing)

import { findBestMove, findRandomMove } from "./minimax";
import type { GameState, Difficulty } from "../engine/types";

export interface AIWorkerMessage {
  state: GameState;
  difficulty: Difficulty;
}

export interface AIWorkerResponse {
  move: number;
}

// Depth limits per difficulty
const DEPTH_LIMITS: Record<Difficulty, number> = {
  easy: 0,    // Not used (random)
  medium: 6,  // ~6 moves ahead
  hard: 0,    // Unlimited (full solve)
};

self.onmessage = (e: MessageEvent<AIWorkerMessage>) => {
  const { state, difficulty } = e.data;

  let move: number;

  if (difficulty === "easy") {
    move = findRandomMove(state).move;
  } else {
    const maxDepth =
      difficulty === "medium"
        ? state.moveHistory.length + DEPTH_LIMITS[difficulty]
        : 0;
    move = findBestMove(state, maxDepth).move;
  }

  self.postMessage({ move } satisfies AIWorkerResponse);
};
