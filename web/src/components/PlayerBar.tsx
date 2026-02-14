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

const Indicator = styled("div")<{ player: Player; isActive: boolean }>(({ theme, player, isActive }) => ({
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
}: PlayerBarProps) {
  const showClock = gameMode === "local" && clockEnabled;

  const getP2Label = () => {
    if (gameMode !== "vs-ai") return "Player 2";
    if (isThinking) return "Thinking...";
    return "Computer";
  };

  return (
    <Box sx={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 1.5, 
      mt: 1.5, 
      mb: 1, 
      width: "100%", // Ensure container takes full width
      padding: "0 16px", // Add padding matching GameControls
      justifyContent: "space-between" 
      // Removed flexWrap to force side-by-side or use grid if needed. 
      // With flex: 1 they should shrink/grow.
    }}>
      <Indicator player="p1" isActive={currentPlayer === "p1" && !isGameOver}>
        <PlayerEmoji>{PLAYER_EMOJI.p1}</PlayerEmoji>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Player 1</span>
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

      <Indicator player="p2" isActive={currentPlayer === "p2" && !isGameOver}>
        <PlayerEmoji>{gameMode === "vs-ai" && isThinking ? "🤖" : PLAYER_EMOJI.p2}</PlayerEmoji>
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
