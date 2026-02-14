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

const Indicator = styled("div")<{ player: Player; isActive: boolean }>(({ player, isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  borderRadius: tokens.radii.md,
  background: tokens.colors.bgCard,
  border: "2px solid transparent",
  fontSize: "1rem",
  fontFamily: tokens.fonts.display,
  fontWeight: 400,
  transition: "all 0.3s",
  ...(isActive && player === "p1" && {
    borderColor: tokens.colors.p1Color,
    boxShadow: `0 0 12px ${tokens.colors.p1Glow}`,
  }),
  ...(isActive && player === "p2" && {
    borderColor: tokens.colors.textMuted,
    boxShadow: `0 0 12px ${tokens.colors.p2Glow}`,
  }),
}));

const PlayerEmoji = styled("span")({
  fontSize: "1.5rem",
});

const Clock = styled("span")<{
  player: Player;
  isActive: boolean;
  isExpired: boolean;
}>(({ player, isActive, isExpired }) => ({
  fontFamily: tokens.fonts.sans,
  fontSize: "1.4rem",
  fontWeight: 600,
  padding: "8px 16px",
  borderRadius: tokens.radii.md,
  background: tokens.colors.bgCard,
  border: "2px solid transparent",
  minWidth: 80,
  textAlign: "center" as const,
  transition: "all 0.3s",
  ...(isActive && player === "p1" && {
    borderColor: tokens.colors.p1Color,
    boxShadow: `0 0 12px ${tokens.colors.p1Glow}`,
    color: tokens.colors.p1Color,
  }),
  ...(isActive && player === "p2" && {
    borderColor: tokens.colors.textMuted,
    boxShadow: `0 0 12px ${tokens.colors.p2Glow}`,
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
}: PlayerBarProps) {
  const showClock = gameMode === "local" && clockEnabled;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 3, mb: 2 }}>
      <Indicator player="p1" isActive={currentPlayer === "p1" && !isGameOver}>
        <PlayerEmoji>{PLAYER_EMOJI.p1}</PlayerEmoji>
        <span>Player 1</span>
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

      <Typography variant="body1" sx={{ color: tokens.colors.textMuted, fontWeight: 600 }}>
        vs
      </Typography>

      <Indicator player="p2" isActive={currentPlayer === "p2" && !isGameOver}>
        <PlayerEmoji>{PLAYER_EMOJI.p2}</PlayerEmoji>
        <span>{gameMode === "vs-ai" ? "Computer" : "Player 2"}</span>
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
