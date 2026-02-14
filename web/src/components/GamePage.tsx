import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import Container from "@mui/material/Container";

import { useGame } from "../hooks/useGame";
import { useClock } from "../hooks/useClock";
import { useAI } from "../hooks/useAI";
import { useSettings } from "../hooks/useSettings";
import { useUIState } from "../hooks/useUIState";
import { parseBoardCode } from "../utils/boardCode";
import type { Difficulty, GameMode } from "../engine/types";
import { tokens } from "../theme";

// Components
import AppHeader from "./AppHeader";
import GameControls from "./GameControls";
import PlayerBar from "./PlayerBar";
import GameBoard from "./GameBoard";
import TakenTilesPanel, { type HistoryEntry } from "./TakenTilesPanel";
import BoardCodeBar from "./BoardCodeBar";
import RulesPanel from "./RulesPanel";
import ClockDialog from "./ClockDialog";
import SettingsDialog from "./SettingsDialog";
import WinOverlay from "./WinOverlay";

// Layout constants
const CenterColumn = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 16,
  zIndex: 1,
  width: "100%",
});

export default function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Get mode from URL, default to local if invalid
  const initialMode = (searchParams.get("mode") as GameMode) || "local";
  
  // Game hooks
  const { state, legalMoves, gameMode, makeMove, newGame, undoMove } = useGame(initialMode);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  // Clock
  const [clockTime, setClockTime] = useState(120);
  const [customMinutes, setCustomMinutes] = useState("2");
  const [clockEnabled, setClockEnabled] = useState(false);
  const clock = useClock(clockTime);

  // Settings & UI
  const { settings, updateSetting } = useSettings();
  const ui = useUIState();

  // AI
  const onAIMove = useCallback((move: number) => makeMove(move), [makeMove]);
  const { isThinking, requestMove } = useAI(onAIMove);

  // --- Effects ---

  // Trigger AI when it's the AI's turn
  useEffect(() => {
    if (gameMode === "vs-ai" && state.currentPlayer === "p2" && !state.isGameOver && !isThinking) {
      requestMove(state, difficulty);
    }
  }, [gameMode, state, isThinking, difficulty, requestMove]);

  // Clock management
  useEffect(() => {
    if (gameMode !== "local" || !clockEnabled) return;
    if (state.isGameOver) { clock.pause(); return; }
    if (state.moveHistory.length > 0) clock.switchTo(state.currentPlayer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentPlayer, state.isGameOver, state.moveHistory.length, gameMode, clockEnabled]);

  useEffect(() => {
    if (clock.isExpired) clock.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock.isExpired]);

  // Win overlay
  const gameOver = state.isGameOver || clock.isExpired;
  useEffect(() => {
    if (!gameOver) return;
    const timer = setTimeout(() => ui.setShowWinOverlay(true), 300);
    return () => clearTimeout(timer);
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Handlers ---

  const handleNewGame = (mode: GameMode, code?: number) => {
    newGame(mode, code);
    clock.reset(clockTime);
    ui.setShowWinOverlay(false);
  };

  const handleTileClick = (index: number) => {
    if (!legalMoves.includes(index) || state.isGameOver || clock.isExpired) return;
    if (gameMode === "vs-ai" && state.currentPlayer === "p2") return;
    makeMove(index);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(state.boardCode.toString());
    ui.setCopied(true);
    setTimeout(() => ui.setCopied(false), 1500);
  };

  const handleLoadCode = () => {
    const code = parseBoardCode(ui.boardCodeInput);
    if (code !== null) {
      handleNewGame(gameMode, code);
      ui.setBoardCodeInput("");
    }
  };

  const handleUndo = () => {
    if (gameMode === "vs-ai" && state.moveHistory.length >= 2) { undoMove(); undoMove(); }
    else undoMove();
  };

  const handleCycleDifficulty = () => {
    const levels: Difficulty[] = ["easy", "medium", "hard"];
    setDifficulty(levels[(levels.indexOf(difficulty) + 1) % levels.length]);
  };

  const handleToggleClock = () => {
    if (clockEnabled) { setClockEnabled(false); clock.pause(); }
    else ui.setShowClockDialog(true);
  };

  const handleStartClock = () => {
    const mins = parseInt(customMinutes);
    if (!isNaN(mins) && mins > 0) {
      setClockTime(mins * 60);
      setClockEnabled(true);
      clock.reset(mins * 60);
      ui.setShowClockDialog(false);
    }
  };

  const handleHome = () => {
     navigate("/");
  };

  // --- Derived ---

  const canInteract = !state.isGameOver && !clock.isExpired && !(gameMode === "vs-ai" && state.currentPlayer === "p2");

  const moveHistoryEntries: HistoryEntry[] = state.moveHistory.map((moveIdx, turn) => ({
    moveIdx,
    tile: state.board[moveIdx],
    player: turn % 2 === 0 ? "p1" : "p2",
    turn,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", pb: 4 }}>
      {/* Top Navigation Bar */}
      <Box sx={{ 
        width: "100%", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        px: 2, 
        py: 1,
      }}>
          <IconButton onClick={handleHome} size="medium">
            <HomeIcon />
          </IconButton>
          
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
             <AppHeader showSubtitle={false} /> 
          </Box>
          <Box sx={{ display: { xs: 'block', sm: 'none' }, fontWeight: 'bold', color: tokens.colors.accentAmber }}>
            浮世絵
          </Box>

          <IconButton onClick={() => ui.setShowSettingsDialog(true)} size="medium">
            <SettingsIcon />
          </IconButton>
      </Box>

      <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <GameControls
          gameMode={gameMode}
          difficulty={difficulty}
          clockEnabled={clockEnabled}
          clockTime={clockTime}
          canUndo={state.moveHistory.length > 0 && !state.isGameOver}
          onNewGame={() => handleNewGame(gameMode)}
          onCycleDifficulty={handleCycleDifficulty}
          onToggleClock={handleToggleClock}
          onUndo={handleUndo}
        />

        <PlayerBar
          currentPlayer={state.currentPlayer}
          isGameOver={state.isGameOver}
          gameMode={gameMode}
          clockEnabled={clockEnabled}
          clockActivePlayer={clock.activePlayer}
          clockExpiredPlayer={clock.expiredPlayer}
          p1Time={clock.p1Time}
          p2Time={clock.p2Time}
          isThinking={isThinking}
        />

        <Box sx={{ position: "relative", width: "100%", mt: 1, display: "flex", justifyContent: "center" }}>
          <CenterColumn>
            <GameBoard
              state={state}
              legalMoves={legalMoves}
              canInteract={canInteract}
              showLegalHints={settings.showLegalHints}
              overlapping={settings.overlappingTiles}
              noBlur={!settings.blurEnabled}
              simpleBirds={settings.simpleBirds}
              onTileClick={handleTileClick}
            />
            <TakenTilesPanel
              entries={moveHistoryEntries}
              showLastOnly={settings.showLastTakenOnly}
              overlapping={settings.overlappingTiles}
              simpleBirds={settings.simpleBirds}
              noBlur={!settings.blurEnabled}
            />
          </CenterColumn>
        </Box>

        <BoardCodeBar
          boardCode={state.boardCode}
          boardCodeInput={ui.boardCodeInput}
          copied={ui.copied}
          gameMode={gameMode}
          onCopy={handleCopyCode}
          onInputChange={ui.setBoardCodeInput}
          onLoad={handleLoadCode}
        />

        <RulesPanel open={ui.showRules} onToggle={ui.toggleRules} />
      </Container>


      <ClockDialog
        open={ui.showClockDialog}
        customMinutes={customMinutes}
        onMinutesChange={setCustomMinutes}
        onStart={handleStartClock}
        onClose={() => ui.setShowClockDialog(false)}
      />

      <SettingsDialog
        open={ui.showSettingsDialog}
        settings={settings}
        onUpdate={updateSetting}
        onClose={() => ui.setShowSettingsDialog(false)}
      />

      {ui.showWinOverlay && gameOver && (
        <WinOverlay
          state={state}
          gameMode={gameMode}
          clockExpired={clock.isExpired}
          clockExpiredPlayer={clock.expiredPlayer}
          onDismiss={() => ui.setShowWinOverlay(false)}
          onPlayAgain={() => handleNewGame(gameMode)}
        />
      )}
    </Box>
  );
}
