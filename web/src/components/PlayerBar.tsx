// Player bar — player indicators with optional clock
import { styled, keyframes } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Player, GameMode } from "../engine/types";
import { PLAYER_EMOJI } from "../engine/constants";
import { tokens } from "../theme";
import { formatTime } from "../utils/formatting";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Added clickable prop for styling interactivity
const Indicator = styled("div")<{ player: Player; isActive: boolean; clickable?: boolean }>(({ theme, player, isActive, clickable }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center", // Center content
  gap: 6,
  padding: "6px 12px",
  borderRadius: tokens.radii.md,
  background: tokens.colors.bgCard,
  border: "2px solid transparent",
  color: tokens.colors.textPrimary,
  fontSize: "0.9rem",
  fontFamily: tokens.fonts.display,
  fontWeight: 400,
  transition: "all 0.3s",
  flex: 1, // Take available space
  width: "100%", // Ensure full width in flex item
  cursor: clickable ? "pointer" : "default", // Pointer if clickable
  
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.8rem",
    padding: "4px 8px",
    gap: 4,
  },
  ...(isActive && player === "p1" && {
    borderColor: tokens.colors.p1Color,
    boxShadow: `0 0 12px ${tokens.colors.p1Glow}`,
  }),
  ...(isActive && player === "p2" && {
    borderColor: tokens.colors.textMuted,
    boxShadow: `0 0 12px ${tokens.colors.p2Glow}`,
  }),
  // Hover effect for switching sides
  ...(clickable && {
    "&:hover": {
      background: tokens.colors.bgBoard, // Slight highlight
    }
  })
}));

const PlayerEmoji = styled("span")(({ theme }) => ({
  fontSize: "1.2rem",
  [theme.breakpoints.down("sm")]: {
    fontSize: "1rem",
  },
}));

const Clock = styled("span")<{
  player: Player;
  isActive: boolean;
  isExpired: boolean;
}>(({ theme, player, isActive, isExpired }) => ({
  fontFamily: tokens.fonts.sans,
  fontSize: "1rem",
  fontWeight: 600,
  padding: "4px 8px",
  borderRadius: tokens.radii.sm,
  background: tokens.colors.bgCard,
  border: "1px solid transparent",
  minWidth: 50,
  textAlign: "center" as const,
  marginLeft: 4,
  transition: "all 0.3s",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.85rem",
    minWidth: 40,
    padding: "2px 6px",
  },
  ...(isActive && player === "p1" && {
    borderColor: tokens.colors.p1Color,
    boxShadow: `0 0 8px ${tokens.colors.p1Glow}`,
    color: tokens.colors.p1Color,
  }),
  ...(isActive && player === "p2" && {
    borderColor: tokens.colors.textMuted,
    boxShadow: `0 0 8px ${tokens.colors.p2Glow}`,
    color: tokens.colors.textMuted,
  }),
  ...(isExpired && {
    borderColor: tokens.colors.accentTerracotta,
    color: tokens.colors.accentTerracotta,
    animation: `${pulse} 1s infinite`,
  }),
}));

interface PlayerBarProps {
  currentPlayer: Player;
  isGameOver: boolean;
  gameMode: GameMode;
  clockEnabled: boolean;
  clockActivePlayer: Player | null;
  clockExpiredPlayer: Player | null;
  p1Time: number;
  p2Time: number;
  isThinking?: boolean;
  aiPlayer?: "p1" | "p2";
  onSwitchSide?: (player: "p1" | "p2") => void;
}

export default function PlayerBar({
  currentPlayer,
  isGameOver,
  gameMode,
  clockEnabled,
  clockActivePlayer,
  clockExpiredPlayer,
  p1Time,
  p2Time,
  isThinking = false,
  aiPlayer = "p2", // Default to p2 for backward compatibility
  onSwitchSide,
}: PlayerBarProps) {
  const showClock = gameMode === "local" && clockEnabled;

  const getP1Label = () => {
      if (gameMode !== "vs-ai") return "Player 1";
      if (aiPlayer === "p1") return isThinking ? "Thinking..." : "Computer";
      return "You";
  };

  const getP2Label = () => {
    if (gameMode !== "vs-ai") return "Player 2";
    if (aiPlayer === "p2") return isThinking ? "Thinking..." : "Computer";
    return "You";
  };

  const isP1AI = gameMode === "vs-ai" && aiPlayer === "p1";
  const isP2AI = gameMode === "vs-ai" && aiPlayer === "p2";

  return (
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 1.5, 
      mt: 1.5, 
      mb: 1, 
      width: "100%", 
      padding: "0 16px", 
      justifyContent: "space-between" 
    }}>
      <Indicator 
        player="p1" 
        isActive={currentPlayer === "p1" && !isGameOver}
        clickable={gameMode === "vs-ai"}
        onClick={() => onSwitchSide?.("p1")}
        title={gameMode === "vs-ai" ? "Click to switch side" : undefined}
      >
        <PlayerEmoji>{isP1AI ? "🤖" : PLAYER_EMOJI.p1}</PlayerEmoji>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getP1Label()}</span>
        {showClock && (
          <Clock
            player="p1"
            isActive={clockActivePlayer === "p1"}
            isExpired={clockExpiredPlayer === "p1"}
          >
            {formatTime(p1Time)}
          </Clock>
        )}
      </Indicator>

      <Typography variant="body2" sx={{ color: tokens.colors.textMuted, fontWeight: 600, fontSize: "0.8rem", minWidth: "fit-content" }}>
        vs
      </Typography>

      <Indicator 
        player="p2" 
        isActive={currentPlayer === "p2" && !isGameOver}
        clickable={gameMode === "vs-ai"}
        onClick={() => onSwitchSide?.("p2")}
        title={gameMode === "vs-ai" ? "Click to switch side" : undefined}
      >
        <PlayerEmoji>{isP2AI ? "🤖" : PLAYER_EMOJI.p2}</PlayerEmoji>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getP2Label()}</span>
        {showClock && (
          <Clock
            player="p2"
            isActive={clockActivePlayer === "p2"}
            isExpired={clockExpiredPlayer === "p2"}
          >
            {formatTime(p2Time)}
          </Clock>
        )}
      </Indicator>
    </Box>
  );
}
