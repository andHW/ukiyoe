// React hook for AI player (Web Worker communication)

import { useState, useRef, useCallback, useEffect } from "react";
import type { GameState, Difficulty } from "../engine/types";
import type { AIWorkerResponse } from "../ai/ai-worker";

interface UseAIReturn {
  isThinking: boolean;
  requestMove: (state: GameState, difficulty: Difficulty) => void;
}

export function useAI(onMoveReady: (move: number) => void): UseAIReturn {
  const [isThinking, setIsThinking] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../ai/ai-worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current.onmessage = (e: MessageEvent<AIWorkerResponse>) => {
      setIsThinking(false);
      onMoveReady(e.data.move);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [onMoveReady]);

  const requestMove = useCallback(
    (state: GameState, difficulty: Difficulty) => {
      if (!workerRef.current) return;
      setIsThinking(true);
      workerRef.current.postMessage({ state, difficulty });
    },
    []
  );

  return { isThinking, requestMove };
}
