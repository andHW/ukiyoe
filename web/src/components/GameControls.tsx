// Game controls — action buttons only (mode is handled by Home/Routing)
import Button from "@mui/material/Button";


import Box from "@mui/material/Box";
import TimerIcon from "@mui/icons-material/Timer";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CasinoIcon from "@mui/icons-material/Casino";
import UndoIcon from "@mui/icons-material/Undo";
import type { Difficulty, GameMode } from "../engine/types";
import { tokens } from "../theme";

const outlineSx = { 
  borderColor: tokens.colors.bgBoardDark, 
  color: tokens.colors.textPrimary,
  padding: "10px 0", // Increased padding for touch targets
  width: "100%", // Full width in flex container
  height: "100%",
} as const;

interface GameControlsProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  clockEnabled: boolean;
  clockTime: number;
  canUndo: boolean;
  onRestartRandom: () => void;
  onRestartSame: () => void;
  onCycleDifficulty: () => void;
  onToggleClock: () => void;
  onUndo: () => void;
}

export default function GameControls({
  gameMode,
  difficulty,
  clockEnabled,
  canUndo,
  onRestartRandom,
  onRestartSame,
  onCycleDifficulty,
  onToggleClock,
  onUndo,
}: GameControlsProps) {
  const diffLabel =
    difficulty === "easy" ? "😊 Easy" : difficulty === "medium" ? "🧠 Medium" : "💀 Hard";

  return (
    <Box sx={{ width: "100%", mt: 0.5, mb: 0.5, padding: "0 16px" }}>
      <Box sx={{ display: "flex", gap: 1.5, justifyContent: "space-between" }}>
        
        {/* Difficulty Button (VS AI only) */}
        {gameMode === "vs-ai" && (
          <Box sx={{ flex: 1.5 }}>
            <Button variant="outlined" onClick={onCycleDifficulty} sx={outlineSx}>
              {diffLabel}
            </Button>
          </Box>
        )}

        {/* Clock Toggle (Local only) */}
        {gameMode === "local" && (
            <Box sx={{ flex: 1.5 }}>
            <Button
              variant="outlined"
              onClick={onToggleClock}
              sx={{ ...outlineSx, color: clockEnabled ? tokens.colors.accentAmber : tokens.colors.textPrimary }}
            >
              <TimerIcon /> 
              {/* Removed time display text as requested */}
            </Button>
          </Box>
        )}

        {/* New Random Game (Dice) */}
        <Box sx={{ flex: 1 }}>
          <Button variant="outlined" onClick={onRestartRandom} sx={outlineSx} aria-label="New Random Game">
            <CasinoIcon />
          </Button>
        </Box>

        {/* Restart Same Game (Loop) */}
        <Box sx={{ flex: 1 }}>
          <Button variant="outlined" onClick={onRestartSame} sx={outlineSx} aria-label="Restart Board">
            <RestartAltIcon />
          </Button>
        </Box>

        {/* Undo */}
        <Box sx={{ flex: 1.5 }}>
          <Button variant="outlined" onClick={onUndo} disabled={!canUndo} sx={outlineSx} aria-label="Undo">
            <UndoIcon />
          </Button>
        </Box>
        
      </Box>
    </Box>
  );
}
