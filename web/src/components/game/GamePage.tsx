import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import Container from "@mui/material/Container";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import { useGame } from "../../hooks/useGame";
import { useClock } from "../../hooks/useClock";
import { useAI } from "../../hooks/useAI";
import { useSettings } from "../../hooks/useSettings";
import { useUIState } from "../../hooks/useUIState";
import { parseBoardCode } from "../../utils/boardCode";
import type { Difficulty, GameMode } from "../../engine/types";
import { tokens } from "../../theme";

// Components
import AppHeader from "../layout/AppHeader";
import GameControls from "./GameControls";
import PlayerBar from "./PlayerBar";
import GameBoard from "./GameBoard";
import TakenTilesPanel, { type HistoryEntry } from "./TakenTilesPanel";
import BoardCodeBar from "./BoardCodeBar";
import RulesPanel from "../dialogs/RulesPanel";
import ClockDialog from "../dialogs/ClockDialog";
import SettingsDialog from "../dialogs/SettingsDialog";
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
  const initialAI = (searchParams.get("ai") as "p1" | "p2") || "p2";
  const initialCodeParam = searchParams.get("code");
  const initialCode = initialCodeParam ? parseInt(initialCodeParam) : undefined;
  
  // Game hooks
  const { state, legalMoves, gameMode, makeMove, newGame, undoMove } = useGame(initialMode, !isNaN(initialCode!) ? initialCode : undefined);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [aiPlayer, setAiPlayer] = useState<"p1" | "p2">(initialAI);
  const [showTip, setShowTip] = useState(false);

  // Show tip on mount for vs-ai
  useEffect(() => {
    if (initialMode === "vs-ai") {
      const timer = setTimeout(() => setShowTip(true), 1000);
      const hideTimer = setTimeout(() => setShowTip(false), 6000);
      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    }
  }, [initialMode]);

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
    if (gameMode === "vs-ai" && state.currentPlayer === aiPlayer && !state.isGameOver && !isThinking) {
      requestMove(state, difficulty);
    }
  }, [gameMode, state, isThinking, difficulty, requestMove, aiPlayer]);

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
    // Reset AI to P2 on new game start? Or keep preference? Keeping preference feels better.
  };

  const handleTileClick = (index: number) => {
    // Only block if it's AI's turn
    if (!legalMoves.includes(index) || state.isGameOver || clock.isExpired) return;
    if (gameMode === "vs-ai" && state.currentPlayer === aiPlayer) return;
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

    }
  };

  const handleUndo = () => {
    // Allow undo even if game over
    if (gameMode === "vs-ai" && state.moveHistory.length >= 2) { 
        // If it's AI turn (e.g. thinking), maybe block? 
        // But usually AI moves fast. If game over, we just undo.
        // If AI played last, undo 2 moves to get back to human.
        // If Human played last (unlikely in vs-ai unless we just switched sides), handle appropriately.
        // Simplest: Undo twice to revert one full round.
        undoMove(); 
        undoMove(); 
    }
    else undoMove();
  };
  
  const handleSwitchSide = (player: "p1" | "p2") => {
      // If we click the AI player, we want to TAKE OVER (make it human).
      // So the AI should become the OTHER player.
      // E.g. AI is P2. Click P2. AI becomes P1.
      if (gameMode !== "vs-ai") return;
      
      const newAiPlayer = player === "p1" ? "p2" : "p1";
      setAiPlayer(newAiPlayer);
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

  // Block interaction if game over OR AI turn
  const canInteract = !state.isGameOver && !clock.isExpired && !(gameMode === "vs-ai" && state.currentPlayer === aiPlayer);

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
            百景 Hyakkei
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
          // Unlimited undo: just check if there is history
          canUndo={state.moveHistory.length > 0} 
          onRestartRandom={() => handleNewGame(gameMode)}
          onRestartSame={() => handleNewGame(gameMode, state.boardCode)}
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
          aiPlayer={aiPlayer}
          onSwitchSide={handleSwitchSide}
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
        onUpdate={(key, value) => updateSetting(key, value)}
        onClose={() => ui.setShowSettingsDialog(false)}
      />

      {ui.showWinOverlay && gameOver && (
        <WinOverlay
          state={state}
          gameMode={gameMode}
          clockExpired={clock.isExpired}
          clockExpiredPlayer={clock.expiredPlayer}
          onDismiss={() => ui.setShowWinOverlay(false)}
          onRestartSame={() => handleNewGame(gameMode, state.boardCode)}
          onRestartRandom={() => handleNewGame(gameMode)}
        />
      )}

      <Snackbar 
        open={showTip} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 80, sm: 40 } }}
      >
        <Alert 
          severity="info" 
          variant="filled"
          onClose={() => setShowTip(false)}
          sx={{ 
            bgcolor: tokens.colors.bgCard, 
            color: tokens.colors.textPrimary,
            border: `1px solid ${tokens.colors.accentAmber}`,
            alignItems: "center"
          }}
          icon={<SmartToyIcon fontSize="small" sx={{ color: tokens.colors.accentAmber }} />}
        >
          Tip: Tap the 🤖 icon to switch sides at any time.
        </Alert>
      </Snackbar>
    </Box>
  );
}
