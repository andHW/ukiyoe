// React hook for chess clock (dual timer)

import { useState, useRef, useCallback, useEffect } from "react";
import type { Player } from "../engine/types";

interface UseClockReturn {
  p1Time: number;
  p2Time: number;
  activePlayer: Player | null;
  isExpired: boolean;
  expiredPlayer: Player | null;
  start: (player: Player) => void;
  switchTo: (player: Player) => void;
  pause: () => void;
  reset: (timeSeconds: number) => void;
}

export function useClock(initialTimeSeconds: number = 300): UseClockReturn {
  const [p1Time, setP1Time] = useState(initialTimeSeconds);
  const [p2Time, setP2Time] = useState(initialTimeSeconds);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [expiredPlayer, setExpiredPlayer] = useState<Player | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (player: Player) => {
      clearTimer();
      setActivePlayer(player);

      intervalRef.current = window.setInterval(() => {
        if (player === "p1") {
          setP1Time((prev) => {
            if (prev <= 0.1) {
              clearTimer();
              setExpiredPlayer("p1");
              return 0;
            }
            return prev - 0.1;
          });
        } else {
          setP2Time((prev) => {
            if (prev <= 0.1) {
              clearTimer();
              setExpiredPlayer("p2");
              return 0;
            }
            return prev - 0.1;
          });
        }
      }, 100);
    },
    [clearTimer]
  );

  const start = useCallback(
    (player: Player) => {
      startTimer(player);
    },
    [startTimer]
  );

  const switchTo = useCallback(
    (player: Player) => {
      startTimer(player);
    },
    [startTimer]
  );

  const pause = useCallback(() => {
    clearTimer();
    setActivePlayer(null);
  }, [clearTimer]);

  const reset = useCallback(
    (timeSeconds: number) => {
      clearTimer();
      setP1Time(timeSeconds);
      setP2Time(timeSeconds);
      setActivePlayer(null);
      setExpiredPlayer(null);
    },
    [clearTimer]
  );

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    p1Time,
    p2Time,
    activePlayer,
    isExpired: expiredPlayer !== null,
    expiredPlayer,
    start,
    switchTo,
    pause,
    reset,
  };
}
