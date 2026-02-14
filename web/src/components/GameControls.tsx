// Game controls — mode buttons + action row
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SettingsIcon from "@mui/icons-material/Settings";
import type { Difficulty, GameMode } from "../engine/types";
import { tokens } from "../theme";
import { formatTime } from "../utils/formatting";

const outlineSx = { borderColor: tokens.colors.bgBoardDark, color: tokens.colors.textPrimary } as const;

function modeButtonSx(isActive: boolean) {
  return {
    borderColor: tokens.colors.bgBoardDark,
    color: isActive ? tokens.colors.bgPrimary : tokens.colors.textPrimary,
    backgroundColor: isActive ? tokens.colors.accentAmber : "transparent",
    "&:hover": {
      backgroundColor: isActive ? "#d49730" : "rgba(232,168,56,0.1)",
      borderColor: tokens.colors.accentAmber,
    },
  } as const;
}

interface GameControlsProps {
  gameMode: GameMode;
  difficulty: Difficulty;
  clockEnabled: boolean;
  clockTime: number;
  canUndo: boolean;
  onNewGame: (mode: GameMode) => void;
  onCycleDifficulty: () => void;
  onToggleClock: () => void;
  onUndo: () => void;
  onOpenSettings: () => void;
}

export default function GameControls({
  gameMode,
  difficulty,
  clockEnabled,
  clockTime,
  canUndo,
  onNewGame,
  onCycleDifficulty,
  onToggleClock,
  onUndo,
  onOpenSettings,
}: GameControlsProps) {
  const diffLabel =
    difficulty === "easy" ? "😊 Easy" : difficulty === "medium" ? "🧠 Medium" : "💀 Hard";

  return (
    <>
      {/* Row 1: Mode */}
      <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
        <Button variant={gameMode === "local" ? "contained" : "outlined"} onClick={() => onNewGame("local")} sx={modeButtonSx(gameMode === "local")}>
          👥 2 Players
        </Button>
        <Button variant={gameMode === "vs-ai" ? "contained" : "outlined"} onClick={() => onNewGame("vs-ai")} sx={modeButtonSx(gameMode === "vs-ai")}>
          🤖 vs Computer
        </Button>
      </Stack>

      {/* Row 2: Actions */}
      <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap" sx={{ mt: 2 }}>
        {gameMode === "vs-ai" && (
          <Button variant="outlined" onClick={onCycleDifficulty} sx={outlineSx}>
            {diffLabel}
          </Button>
        )}

        {gameMode === "local" && (
          <Button
            variant="outlined"
            onClick={onToggleClock}
            sx={{ ...outlineSx, color: clockEnabled ? tokens.colors.accentAmber : tokens.colors.textPrimary }}
            startIcon={!clockEnabled ? <AccessTimeIcon /> : undefined}
          >
            {clockEnabled ? `⏱ ${formatTime(clockTime)}` : "Clock"}
          </Button>
        )}

        <Button variant="outlined" onClick={() => onNewGame(gameMode)} sx={outlineSx}>
          🎲 New Board
        </Button>
        <Button variant="outlined" onClick={onUndo} disabled={!canUndo} sx={outlineSx}>
          ↩ Undo
        </Button>

        <IconButton
          onClick={onOpenSettings}
          sx={{ border: `1px solid ${tokens.colors.bgBoardDark}`, borderRadius: "12px", color: tokens.colors.textPrimary }}
        >
          <SettingsIcon />
        </IconButton>
      </Stack>
    </>
  );
}
