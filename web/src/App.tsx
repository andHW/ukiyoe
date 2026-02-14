import { useState, useCallback, useEffect } from "react";
import "./index.css";
import { useGame } from "./hooks/useGame";
import { useClock } from "./hooks/useClock";
import { useAI } from "./hooks/useAI";
import type { Difficulty, GameMode } from "./engine/types";
import { PLANT_EMOJI, POEM_EMOJI, PLAYER_EMOJI } from "./engine/constants";
import { TOTAL_PERMUTATIONS } from "./engine/permutation";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const TIME_OPTIONS = [
  { label: "3 min", value: 180 },
  { label: "5 min", value: 300 },
  { label: "10 min", value: 600 },
];

export default function App() {
  const { state, legalMoves, gameMode, makeMove, newGame, undoMove } = useGame();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [clockTime, setClockTime] = useState(300);
  const [clockEnabled, setClockEnabled] = useState(true);
  const clock = useClock(clockTime);
  const [showRules, setShowRules] = useState(false);
  const [boardCodeInput, setBoardCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);

  // AI move callback
  const onAIMove = useCallback(
    (move: number) => {
      makeMove(move);
    },
    [makeMove]
  );

  const { isThinking, requestMove } = useAI(onAIMove);

  // Trigger AI when it's the AI's turn
  useEffect(() => {
    if (
      gameMode === "vs-ai" &&
      state.currentPlayer === "p2" &&
      !state.isGameOver &&
      !isThinking
    ) {
      const timer = setTimeout(() => {
        requestMove(state, difficulty);
      }, 400); // Small delay for visual feedback
      return () => clearTimeout(timer);
    }
  }, [gameMode, state, isThinking, difficulty, requestMove]);

  // Clock management
  useEffect(() => {
    if (gameMode !== "local" || !clockEnabled) return;
    if (state.isGameOver) {
      clock.pause();
      return;
    }
    if (state.moveHistory.length > 0) {
      clock.switchTo(state.currentPlayer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPlayer, state.isGameOver, state.moveHistory.length, gameMode, clockEnabled]);

  // Clock expired = game over
  useEffect(() => {
    if (clock.isExpired) {
      clock.pause();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock.isExpired]);

  // Show win overlay on game end
  const gameOver = state.isGameOver || clock.isExpired;
  useEffect(() => {
    if (!gameOver) return;
    const timer = setTimeout(() => setShowWinOverlay(true), 300);
    return () => clearTimeout(timer);
  }, [gameOver]);

  const handleNewGame = (mode: GameMode, code?: number) => {
    newGame(mode, code);
    clock.reset(clockTime);
    setShowWinOverlay(false);
  };

  const handleTileClick = (index: number) => {
    if (!legalMoves.includes(index)) return;
    if (state.isGameOver || clock.isExpired) return;
    if (gameMode === "vs-ai" && state.currentPlayer === "p2") return;
    makeMove(index);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.boardCode.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleLoadCode = () => {
    const code = parseInt(boardCodeInput);
    if (!isNaN(code) && code >= 0 && code < TOTAL_PERMUTATIONS) {
      handleNewGame(gameMode, code);
      setBoardCodeInput("");
    }
  };

  const handleUndo = () => {
    if (gameMode === "vs-ai" && state.moveHistory.length >= 2) {
      // In vs-ai mode, undo both AI and player move
      undoMove();
      undoMove();
    } else {
      undoMove();
    }
  };

  const isLegal = (index: number) => legalMoves.includes(index);
  const isTaken = (index: number) => !!((state.p1Mask | state.p2Mask) & (1 << index));
  const isP1Token = (index: number) => !!(state.p1Mask & (1 << index));
  const isP2Token = (index: number) => !!(state.p2Mask & (1 << index));
  const isWinCell = (index: number) =>
    state.winner ? !!(state.winner.pattern & (1 << index)) : false;
  const isLastMove = (index: number) => state.lastMoveIndex === index;

  const canInteract =
    !state.isGameOver &&
    !clock.isExpired &&
    !(gameMode === "vs-ai" && state.currentPlayer === "p2");

  return (
    <div className="app">
      <h1 className="app-title">浮世絵 Ukiyoe</h1>
      <p className="app-subtitle">A tile strategy game</p>

      {/* Mode & Controls */}
      <div className="controls">
        <div className="mode-select">
          <button
            className={`mode-btn ${gameMode === "local" ? "active" : ""}`}
            onClick={() => handleNewGame("local")}
          >
            👥 2 Players
          </button>
          <button
            className={`mode-btn ${gameMode === "vs-ai" ? "active" : ""}`}
            onClick={() => handleNewGame("vs-ai")}
          >
            🤖 vs Computer
          </button>
        </div>

        {gameMode === "vs-ai" && (
          <select
            className="difficulty-select"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        )}

        {gameMode === "local" && (
          <>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <input
                type="checkbox"
                checked={clockEnabled}
                onChange={(e) => {
                  setClockEnabled(e.target.checked);
                  if (!e.target.checked) clock.pause();
                }}
              />
              ⏱ Clock
            </label>
            {clockEnabled && (
              <select
                className="time-select"
                value={clockTime}
                onChange={(e) => {
                  const t = parseInt(e.target.value);
                  setClockTime(t);
                  clock.reset(t);
                }}
              >
                {TIME_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        <button
          className="control-btn"
          onClick={() => handleNewGame(gameMode)}
        >
          🔄 New Board
        </button>
        <button
          className="control-btn"
          onClick={handleUndo}
          disabled={state.moveHistory.length === 0 || state.isGameOver}
        >
          ↩ Undo
        </button>
      </div>

      {/* Player Info */}
      <div className="game-info">
        <div
          className={`player-indicator p1 ${state.currentPlayer === "p1" && !state.isGameOver ? "active" : ""}`}
        >
          <span className="player-emoji">{PLAYER_EMOJI.p1}</span>
          <span>Player 1</span>
          {gameMode === "local" && clockEnabled && (
            <span className={`clock p1 ${clock.activePlayer === "p1" ? "active" : ""} ${clock.expiredPlayer === "p1" ? "expired" : ""}`}>
              {formatTime(clock.p1Time)}
            </span>
          )}
        </div>

        <span className="vs-divider">vs</span>

        <div
          className={`player-indicator p2 ${state.currentPlayer === "p2" && !state.isGameOver ? "active" : ""}`}
        >
          <span className="player-emoji">{PLAYER_EMOJI.p2}</span>
          <span>{gameMode === "vs-ai" ? "Computer" : "Player 2"}</span>
          {gameMode === "local" && clockEnabled && (
            <span className={`clock p2 ${clock.activePlayer === "p2" ? "active" : ""} ${clock.expiredPlayer === "p2" ? "expired" : ""}`}>
              {formatTime(clock.p2Time)}
            </span>
          )}
        </div>
      </div>

      {/* AI Thinking */}
      {isThinking && (
        <div className="thinking-indicator">
          🤖 Thinking
          <span className="thinking-dots">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}

      {/* Board */}
      <div className="board-container">
        <div className="board-grid">
          {state.board.map((tile, i) => {
            const taken = isTaken(i);
            const legal = !taken && isLegal(i) && canInteract;
            const winCell = isWinCell(i);
            const lastMove = isLastMove(i);

            return (
              <div
                key={i}
                className={[
                  "tile",
                  legal ? "legal" : "",
                  taken ? "taken" : "",
                  winCell ? "win-cell" : "",
                  lastMove ? "last-move" : "",
                ].join(" ")}
                onClick={() => legal && handleTileClick(i)}
              >
                <span className="tile-emoji-plant">
                  {PLANT_EMOJI[tile.plant]}
                </span>
                <span className="tile-emoji-poem">
                  {POEM_EMOJI[tile.poem]}
                </span>

                {isP1Token(i) && (
                  <div className="token p1">{PLAYER_EMOJI.p1}</div>
                )}
                {isP2Token(i) && (
                  <div className="token p2">{PLAYER_EMOJI.p2}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Board Code */}
      <div className="board-code">
        <span className="board-code-label">Board:</span>
        <span
          className="board-code-value"
          onClick={handleCopyCode}
          title="Click to copy"
        >
          #{state.boardCode}
        </span>
        {copied && <span className="copied-toast">Copied!</span>}
        <input
          className="board-code-input"
          type="text"
          placeholder="Paste code..."
          value={boardCodeInput}
          onChange={(e) => setBoardCodeInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLoadCode()}
        />
        <button className="board-code-btn" onClick={handleLoadCode}>
          Load
        </button>
      </div>

      {/* Rules */}
      <button
        className="rules-toggle"
        onClick={() => setShowRules((v) => !v)}
      >
        {showRules ? "▾ Hide Rules" : "▸ How to Play"}
      </button>
      {showRules && (
        <div className="rules-panel">
          <h3>Rules</h3>
          <ol>
            <li>The board is a 4×4 grid of unique tiles, each with a <strong>Plant</strong> and a <strong>Poem</strong>.</li>
            <li>Player 1 starts by placing a token on any <strong>edge tile</strong>.</li>
            <li>Each subsequent move must match the <strong>Plant or Poem</strong> of the last tile played.</li>
            <li>
              Win by completing:
              <ul>
                <li>A <strong>row</strong>, <strong>column</strong>, or <strong>diagonal</strong> of 4 tokens</li>
                <li>A <strong>2×2 square</strong> of tokens</li>
                <li>A <strong>blockade</strong> — your opponent has no legal moves</li>
              </ul>
            </li>
            <li>If all tiles are placed with no winner, it's a <strong>draw</strong>.</li>
          </ol>
        </div>
      )}

      {/* Win Overlay */}
      {showWinOverlay && (state.isGameOver || clock.isExpired) && (
        <div className="win-overlay" onClick={() => setShowWinOverlay(false)}>
          <div className="win-modal" onClick={(e) => e.stopPropagation()}>
            <div className="win-emoji">
              {state.isDraw
                ? "🤝"
                : clock.isExpired
                  ? "⏱️"
                  : state.winner?.winner === "p1"
                    ? "🎉"
                    : "🎊"}
            </div>
            <div className="win-title">
              {state.isDraw
                ? "Draw!"
                : clock.isExpired
                  ? `${clock.expiredPlayer === "p1" ? "Player 2" : "Player 1"} wins!`
                  : `${state.winner?.winner === "p1" ? "Player 1" : gameMode === "vs-ai" ? "Computer" : "Player 2"} wins!`}
            </div>
            <div className="win-method">
              {state.isDraw
                ? "All tiles placed — no winner"
                : clock.isExpired
                  ? "Time expired"
                  : state.winner?.method}
            </div>
            <button
              className="control-btn"
              onClick={() => handleNewGame(gameMode)}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        Inspired by{" "}
        <a
          href="https://boardgamegeek.com/boardgame/125311/okiya"
          target="_blank"
          rel="noopener"
        >
          Niya/Okiya
        </a>{" "}
        by Bruno Cathala
      </footer>
    </div>
  );
}
