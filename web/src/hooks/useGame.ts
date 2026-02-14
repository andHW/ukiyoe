// React hook for game state management

import { useState, useCallback } from "react";
import type { GameState, GameMode, Tile } from "../engine/types";
import { createInitialState, applyMove, getLegalMoves } from "../engine/rules";
import { createRandomBoard, createBoardFromCode } from "../engine/board";

interface UseGameReturn {
  state: GameState;
  legalMoves: number[];
  gameMode: GameMode;
  makeMove: (moveIndex: number) => void;
  newGame: (mode: GameMode, boardCode?: number) => void;
  undoMove: () => void;
}

export function useGame(): UseGameReturn {
  const [gameMode, setGameMode] = useState<GameMode>("local");
  const [stateHistory, setStateHistory] = useState<GameState[]>(() => {
    const { board, code } = createRandomBoard();
    return [createInitialState(board, code)];
  });

  const state = stateHistory[stateHistory.length - 1];
  const legalMoves = getLegalMoves(state);

  const makeMove = useCallback((moveIndex: number) => {
    setStateHistory((prev) => {
      const current = prev[prev.length - 1];
      const newState = applyMove(current, moveIndex);
      return [...prev, newState];
    });
  }, []);

  const newGame = useCallback((mode: GameMode, boardCode?: number) => {
    setGameMode(mode);
    let board: Tile[];
    let code: number;

    if (boardCode !== undefined) {
      const result = createBoardFromCode(boardCode);
      if (result) {
        board = result.board;
        code = result.code;
      } else {
        const random = createRandomBoard();
        board = random.board;
        code = random.code;
      }
    } else {
      const random = createRandomBoard();
      board = random.board;
      code = random.code;
    }

    setStateHistory([createInitialState(board, code)]);
  }, []);

  const undoMove = useCallback(() => {
    setStateHistory((prev) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  return { state, legalMoves, gameMode, makeMove, newGame, undoMove };
}
