import { useState, useCallback, useEffect, useRef } from "react";
import "./index.css";
import { useGame } from "./hooks/useGame";
import { useClock } from "./hooks/useClock";
import { useAI } from "./hooks/useAI";
import type { Difficulty, GameMode } from "./engine/types";
import { PLANT_EMOJI, POEM_EMOJI, PLAYER_EMOJI } from "./engine/constants";
import { TOTAL_PERMUTATIONS } from "./engine/permutation";

// MUI
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Collapse from "@mui/material/Collapse";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import useMediaQuery from "@mui/material/useMediaQuery";

// Icons
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SettingsIcon from "@mui/icons-material/Settings";
import Link from "@mui/material/Link";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#e8a838" },
    secondary: { main: "#c45a3c" },
    background: {
      default: "#1a1612",
      paper: "#2a2420",
    },
  },
  typography: {
    fontFamily: "'Potta One', cursive",
    allVariants: {
      color: "#f5e6d3",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: "'Potta One', cursive",
          fontWeight: 400,
          borderRadius: 12,
          letterSpacing: "0.5px",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: "'Potta One', cursive",
        },
      },
    },
  },
});

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function App() {
  const { state, legalMoves, gameMode, makeMove, newGame, undoMove } = useGame();
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  
  // Clock state - Default 2 minutes
  const [clockTime, setClockTime] = useState(120);
  const [customMinutes, setCustomMinutes] = useState("2");
  const [clockEnabled, setClockEnabled] = useState(false);
  const clock = useClock(clockTime);

  // UI state
  const [showRules, setShowRules] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // Taken tiles are now always shown
  
  const [boardCodeInput, setBoardCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showClockDialog, setShowClockDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Settings
  const [blurEnabled, setBlurEnabled] = useState(true);
  const [showLegalHints, setShowLegalHints] = useState(false);

  const historyEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width:900px)"); // Breakpoint for layout shift

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
      }, 400);
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

  // Clock expired
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

  // Auto-scroll history to bottom
  useEffect(() => {
    if (showHistory) {
      historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [state.moveHistory.length, showHistory]);

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

  const canInteract =
    !state.isGameOver &&
    !clock.isExpired &&
    !(gameMode === "vs-ai" && state.currentPlayer === "p2");

  // Build move history entries
  const moveHistoryEntries = state.moveHistory.map((moveIdx, turn) => {
    const tile = state.board[moveIdx];
    const player = turn % 2 === 0 ? "p1" : "p2";
    return { moveIdx, tile, player, turn };
  });

  // Calculate taken tiles for display
  const takenTiles = state.board.filter((_, i) => isTaken(i));

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <div className={`app ${blurEnabled ? "" : "no-blur"}`}>
        <Typography
          variant="h2"
          component="h1"
          sx={{
            color: "#e8a838",
            textAlign: "center",
            textShadow: "0 2px 12px rgba(232, 168, 56, 0.35)",
            mt: 2,
            mb: 0,
            fontSize: { xs: "2rem", sm: "3rem" },
          }}
        >
          浮世絵 Ukiyoe
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--text-muted)", mt: -1, mb: 2 }}>
          A tile strategy game
        </Typography>

        {/* Controls Row 1: Mode */}
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant={gameMode === "local" ? "contained" : "outlined"}
            onClick={() => handleNewGame("local")}
            sx={{
              borderColor: "#6d5a44",
              color: gameMode === "local" ? "#1a1612" : "#f5e6d3",
              backgroundColor: gameMode === "local" ? "#e8a838" : "transparent",
              "&:hover": {
                backgroundColor: gameMode === "local" ? "#d49730" : "rgba(232,168,56,0.1)",
                borderColor: "#e8a838",
              },
            }}
          >
            👥 2 Players
          </Button>
          <Button
            variant={gameMode === "vs-ai" ? "contained" : "outlined"}
            onClick={() => handleNewGame("vs-ai")}
            sx={{
              borderColor: "#6d5a44",
              color: gameMode === "vs-ai" ? "#1a1612" : "#f5e6d3",
              backgroundColor: gameMode === "vs-ai" ? "#e8a838" : "transparent",
              "&:hover": {
                backgroundColor: gameMode === "vs-ai" ? "#d49730" : "rgba(232,168,56,0.1)",
                borderColor: "#e8a838",
              },
            }}
          >
            🤖 vs Computer
          </Button>
        </Stack>

        {/* Controls Row 2: Actions */}
        <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 2 }}>
          {gameMode === "vs-ai" && (
            <Button
              variant="outlined"
              onClick={() => {
                const levels: Difficulty[] = ["easy", "medium", "hard"];
                const next = levels[(levels.indexOf(difficulty) + 1) % levels.length];
                setDifficulty(next);
              }}
              sx={{ borderColor: "#6d5a44", color: "#f5e6d3" }}
            >
              {difficulty === "easy" ? "😊 Easy" : difficulty === "medium" ? "🧠 Medium" : "💀 Hard"}
            </Button>
          )}

          {gameMode === "local" && (
            <Button
              variant="outlined"
              onClick={() => {
                if (clockEnabled) {
                  setClockEnabled(false);
                  clock.pause();
                } else {
                  setShowClockDialog(true);
                }
              }}
              sx={{ borderColor: "#6d5a44", color: clockEnabled ? "#e8a838" : "#f5e6d3" }}
              startIcon={!clockEnabled && <AccessTimeIcon />}
            >
              {clockEnabled ? `⏱ ${formatTime(clockTime)}` : "Clock"}
            </Button>
          )}

          <Button
            variant="outlined"
            onClick={() => handleNewGame(gameMode)}
            sx={{ borderColor: "#6d5a44", color: "#f5e6d3" }}
          >
            🎲 New Board
          </Button>
          <Button
            variant="outlined"
            onClick={handleUndo}
            disabled={state.moveHistory.length === 0 || state.isGameOver}
            sx={{ borderColor: "#6d5a44", color: "#f5e6d3" }}
          >
            ↩ Undo
          </Button>
          
          <IconButton 
            onClick={() => setShowSettingsDialog(true)}
            sx={{ border: "1px solid #6d5a44", borderRadius: "12px", color: "#f5e6d3" }}
          >
            <SettingsIcon />
          </IconButton>
        </Stack>

        {/* Player Info */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 3, mb: 2 }}>
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

          <Typography variant="body1" sx={{ color: "var(--text-muted)", fontWeight: 600 }}>
            vs
          </Typography>

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
        </Box>

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

        {/* Layout Container */}
        <div className="layout-container" style={{ position: "relative", width: "100%", maxWidth: "1000px", display: "flex", justifyContent: "center" }}>
            
            {/* Center Column: Board + Taken Tiles */}
            <div className="center-column" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", zIndex: 1 }}>
                
                {/* Board */}
                <div className="board-container">
                    <div className="board-grid">
                    {state.board.map((tile, i) => {
                        const taken = isTaken(i);
                        const legal = !taken && isLegal(i) && canInteract;
                        const winCell = isWinCell(i);
                        
                        // Styling logic
                        const classes = ["tile"];
                        if (taken) classes.push("taken");
                        if (winCell) classes.push("win-cell");
                        if (legal) {
                            if (showLegalHints) classes.push("legal-highlight");
                            else classes.push("legal-hidden");
                        }

                        return (
                        <div
                            key={i}
                            className={classes.join(" ")}
                            onClick={() => legal && handleTileClick(i)}
                        >
                            {/* Tile emoji: fade when taken */}
                            <span className={`tile-emoji-plant ${taken ? "faded" : ""}`}>
                            {PLANT_EMOJI[tile.plant]}
                            </span>
                            <span className={`tile-emoji-poem ${taken ? "faded" : ""}`}>
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

                {/* Taken Tiles Panel (Below Board) */}
                <div className="taken-panel" style={{ width: "100%", maxWidth: "450px", background: "var(--bg-card)", borderRadius: "var(--radius-md)", padding: "12px", border: "1px solid var(--bg-board-dark)" }}>
                    <div className="history-title" style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "8px" }}>
                        Taken Tiles ({takenTiles.length})
                    </div>
                    <div className="taken-grid" style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", minHeight: "60px" }}>
                        {takenTiles.length === 0 && (
                            <div className="history-empty" style={{ width: "100%" }}>No taken tiles yet</div>
                        )}
                        {takenTiles.map((tile, i) => (
                            <div key={i} className="mini-tile">
                                <span className="tile-emoji-plant">{PLANT_EMOJI[tile.plant]}</span>
                                <span className="tile-emoji-poem">{POEM_EMOJI[tile.poem]}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

             {/* Move History (Right Overlay on Desktop) */}
             <Collapse in={showHistory} orientation="horizontal" timeout={300} 
                sx={{ 
                    position: isMobile ? "static" : "absolute", 
                    right: 0, 
                    top: 0,
                    height: "100%", /* match board height or just flow naturally */
                    zIndex: 2,
                    mt: isMobile ? 2 : 0
                }}
             >
                <div className="history-panel" style={{ 
                    height: isMobile ? "auto" : "100%", 
                    maxHeight: isMobile ? "200px" : "500px",
                    marginLeft: isMobile ? 0 : "20px" 
                }}>
                  <div className="history-title">Moves</div>
                  <div className="history-list">
                    {moveHistoryEntries.length === 0 && (
                      <div className="history-empty">No moves yet</div>
                    )}
                    {moveHistoryEntries.map((entry, i) => (
                      <div
                        key={i}
                        className={`history-entry ${entry.player} ${i === moveHistoryEntries.length - 1 ? "latest" : ""}`}
                      >
                        <span className="history-turn">{i + 1}</span>
                        <span className="history-player-emoji">
                          {entry.player === "p1" ? PLAYER_EMOJI.p1 : PLAYER_EMOJI.p2}
                        </span>
                        <span className="history-tile-emoji">
                          {PLANT_EMOJI[entry.tile.plant]}{POEM_EMOJI[entry.tile.poem]}
                        </span>
                      </div>
                    ))}
                    <div ref={historyEndRef} />
                  </div>
                </div>
              </Collapse>

        </div>

        {/* Board Code */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 3, color: "var(--text-muted)" }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>Board</Typography>
          <Chip
            label={`#${state.boardCode}`}
            onClick={handleCopyCode}
            onDelete={handleCopyCode}
            deleteIcon={
              <Tooltip title={copied ? "Copied!" : "Copy"}>
                <ContentCopyIcon sx={{ fontSize: 14 }} />
              </Tooltip>
            }
            variant="outlined"
            size="small"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.8rem",
              borderColor: "#6d5a44",
              color: "var(--text-muted)",
              height: 24,
            }}
          />
          <TextField
            size="small"
            placeholder="Paste code..."
            value={boardCodeInput}
            onChange={(e) => setBoardCodeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoadCode()}
            sx={{
              width: 120,
              "& .MuiInputBase-root": { fontSize: "0.8rem", fontFamily: "monospace", height: 28 },
              "& .MuiOutlinedInput-input": { padding: "4px 8px" }
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={handleLoadCode}
            sx={{
              borderColor: "#6d5a44",
              color: "#f5e6d3",
              fontSize: "0.75rem",
              minWidth: 40,
              height: 28,
              padding: "0 10px"
            }}
          >
            Load
          </Button>
        </Box>

        {/* Rules */}
        <Button
          onClick={() => setShowRules((v) => !v)}
          endIcon={showRules ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          size="small"
          sx={{ color: "var(--text-muted)", mt: 1 }}
        >
          How to Play
        </Button>
        <Collapse in={showRules}>
          <div className="rules-panel">
            <Typography variant="h6" sx={{ fontFamily: "'Potta One', cursive", color: "var(--text-primary)", mb: 1 }}>
              Rules
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0, color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              <li>The board is a 4×4 grid of unique tiles, each with a <strong>Plant</strong> and a <strong>Poem</strong>.</li>
              <li>Player 1 starts by placing a token on any <strong>edge tile</strong>.</li>
              <li>Each subsequent move must match the <strong>Plant or Poem</strong> of the last tile played.</li>
              <li>
                Win by completing:
                <Box component="ul" sx={{ pl: 2, my: 0.5 }}>
                  <li>A <strong>row</strong>, <strong>column</strong>, or <strong>diagonal</strong> of 4 tokens</li>
                  <li>A <strong>2×2 square</strong> of tokens</li>
                  <li>A <strong>blockade</strong> — your opponent has no legal moves</li>
                </Box>
              </li>
              <li>If all tiles are placed with no winner, it's a <strong>draw</strong>.</li>
            </Box>
          </div>
        </Collapse>

        {/* Clock Settings Dialog */}
        <Dialog
          open={showClockDialog}
          onClose={() => setShowClockDialog(false)}
          slotProps={{
            paper: {
              sx: {
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-board)",
                borderRadius: "var(--radius-lg)",
                minWidth: 300,
                p: 1
              },
            },
          }}
        >
          <DialogTitle sx={{ fontFamily: "'Potta One', cursive", color: "var(--accent-amber)", textAlign: "center" }}>
            ⏱ Clock Settings
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <Typography variant="body2" align="center" sx={{ color: "#f5e6d3" }}>
              Per player time (minutes):
            </Typography>
            <TextField
              type="number"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              fullWidth
              slotProps={{
                htmlInput: { min: 1, max: 60, style: { textAlign: "center" } }
              }}
              sx={{
                input: { color: "#f5e6d3" },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#6d5a44" },
                  "&:hover fieldset": { borderColor: "#e8a838" },
                  "&.Mui-focused fieldset": { borderColor: "#e8a838" },
                },
              }}
            />
            <Typography variant="caption" align="center" sx={{ color: "var(--text-muted)", mt: -1 }}>
               Recommended: 2 minutes
            </Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                const mins = parseInt(customMinutes);
                if (!isNaN(mins) && mins > 0) {
                  setClockTime(mins * 60);
                  setClockEnabled(true);
                  clock.reset(mins * 60);
                  setShowClockDialog(false);
                }
              }}
              sx={{ color: "#1a1612", minWidth: 120 }}
            >
              Start Clock
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Settings Dialog */}
        <Dialog
          open={showSettingsDialog}
          onClose={() => setShowSettingsDialog(false)}
          slotProps={{
            paper: {
              sx: {
                background: "var(--bg-secondary)",
                border: "1px solid var(--bg-board)",
                borderRadius: "var(--radius-lg)",
                minWidth: 280,
                p: 1
              },
            },
          }}
        >
          <DialogTitle sx={{ fontFamily: "'Potta One', cursive", color: "var(--text-primary)", textAlign: "center" }}>
            ⚙️ Settings
          </DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
             <FormControlLabel
                control={
                  <Switch
                    checked={blurEnabled}
                    onChange={(e) => setBlurEnabled(e.target.checked)}
                    color="primary"
                  />
                }
                label="Blurry Tiles Effect"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showLegalHints}
                    onChange={(e) => setShowLegalHints(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Next Move Hints"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={showHistory}
                    onChange={(e) => setShowHistory(e.target.checked)}
                    color="primary"
                  />
                }
                label="Show Move History"
              />
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
             <Button
              variant="outlined"
              onClick={() => setShowSettingsDialog(false)}
              sx={{ borderColor: "#6d5a44", color: "#f5e6d3" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Win Overlay */}
        {showWinOverlay && (state.isGameOver || clock.isExpired) && (
          <div className="win-overlay" onClick={() => setShowWinOverlay(false)}>
            <div className="win-modal" onClick={(e) => e.stopPropagation()}>
              <IconButton
                onClick={() => setShowWinOverlay(false)}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  color: "var(--text-muted)",
                }}
                size="small"
              >
                <CloseIcon />
              </IconButton>
              <div className="win-emoji">
                {state.isDraw
                  ? "🤝"
                  : clock.isExpired
                    ? "⏱️"
                    : state.winner?.winner === "p1"
                      ? "🎉"
                      : "🎊"}
              </div>
              <Typography variant="h4" sx={{ color: "var(--accent-amber)", mb: 1 }}>
                {state.isDraw
                  ? "Draw!"
                  : clock.isExpired
                    ? `${clock.expiredPlayer === "p1" ? "Player 2" : "Player 1"} wins!`
                    : `${state.winner?.winner === "p1" ? "Player 1" : gameMode === "vs-ai" ? "Computer" : "Player 2"} wins!`}
              </Typography>
              <Typography variant="body1" sx={{ color: "var(--text-secondary)", mb: 3 }}>
                {state.isDraw
                  ? "All tiles placed - no winner"
                  : clock.isExpired
                    ? "Time expired"
                    : state.winner?.method}
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="outlined"
                  onClick={() => setShowWinOverlay(false)}
                  sx={{ borderColor: "#6d5a44", color: "#f5e6d3" }}
                >
                  View Board
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleNewGame(gameMode)}
                  sx={{ color: "#1a1612" }}
                >
                  Play Again
                </Button>
              </Stack>
            </div>
          </div>
        )}

        {/* Footer */}
        <Box component="footer" sx={{ textAlign: "center", mt: 4, mb: 2, color: "var(--text-muted)", fontSize: "0.8rem" }}>
          <Typography variant="caption" display="block" sx={{ fontFamily: "'Potta One', cursive" }}>
            Inspired by{" "}
            <Link 
              href="https://boardgamegeek.com/boardgame/125311/okiya" 
              target="_blank" 
              rel="noopener" 
              color="inherit"
              underline="hover"
            >
              Niya/Okiya
            </Link>{" "}
            by Bruno Cathala
          </Typography>
          <Typography variant="caption" display="block" sx={{ fontFamily: "'Potta One', cursive" }}>
            Illustrations by Cyril Bouquet
          </Typography>
        </Box>
      </div>
    </ThemeProvider>
  );
}
