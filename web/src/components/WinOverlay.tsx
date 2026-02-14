// Win overlay — game over modal
import { styled, keyframes } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CasinoIcon from "@mui/icons-material/Casino";
import type { GameState, GameMode } from "../engine/types";
import { tokens } from "../theme";

// ---------- Keyframes ----------

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// ---------- Styled ----------

const Overlay = styled("div")({
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 100,
  animation: `${fadeIn} 0.3s ease-out`,
  backdropFilter: "blur(4px)",
});

const Modal = styled("div")({
  position: "relative",
  background: tokens.colors.bgSecondary,
  borderRadius: tokens.radii.lg,
  padding: "32px 40px",
  textAlign: "center",
  boxShadow: tokens.shadows.lg,
  border: `1px solid ${tokens.colors.bgBoard}`,
  animation: `${slideUp} 0.4s ease-out`,
  maxWidth: 400,
  minWidth: 300,
});

const Emoji = styled("div")({
  fontSize: "4rem",
  marginBottom: 8,
});

// ---------- Component ----------

interface WinOverlayProps {
  state: GameState;
  gameMode: GameMode;
  clockExpired: boolean;
  clockExpiredPlayer: "p1" | "p2" | null;
  onDismiss: () => void;
  onRestartSame: () => void;
  onRestartRandom: () => void;
}

export default function WinOverlay({
  state,
  gameMode,
  clockExpired,
  clockExpiredPlayer,
  onDismiss,
  onRestartSame,
  onRestartRandom,
}: WinOverlayProps) {
  // Determine display strings
  let emoji: string;
  let title: string;
  let subtitle: string;

  if (state.isDraw) {
    emoji = "🤝";
    title = "Draw!";
    subtitle = "All tiles placed - no winner";
  } else if (clockExpired) {
    emoji = "⏱️";
    title = `${clockExpiredPlayer === "p1" ? "Player 2" : "Player 1"} wins!`;
    subtitle = "Time expired";
  } else {
    const isP1 = state.winner?.winner === "p1";
    emoji = isP1 ? "🎉" : "🎊";
    title = `${isP1 ? "Player 1" : gameMode === "vs-ai" ? "Computer" : "Player 2"} wins!`;
    subtitle = state.winner?.method ?? "";
  }

  return (
    <Overlay onClick={onDismiss}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <IconButton
          onClick={onDismiss}
          sx={{ position: "absolute", top: 8, right: 8, color: tokens.colors.textMuted }}
          size="small"
        >
          <CloseIcon />
        </IconButton>
        <Emoji>{emoji}</Emoji>
        <Typography variant="h4" sx={{ color: tokens.colors.accentAmber, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ color: tokens.colors.textSecondary, mb: 3 }}>
          {subtitle}
        </Typography>

        <Typography variant="subtitle1" sx={{ color: tokens.colors.textPrimary, mb: 1.5, fontWeight: 600 }}>
          Play Again
        </Typography>

        <Stack spacing={2} sx={{ width: "100%" }}>
          <Button
            variant="contained" 
            onClick={onRestartSame}
            startIcon={<RestartAltIcon />}
            fullWidth
            sx={{ color: tokens.colors.bgPrimary, bgcolor: tokens.colors.accentCyan, '&:hover': { bgcolor: tokens.colors.accentCyanDark } }}
          >
            Same Board
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={onRestartRandom}
            startIcon={<CasinoIcon />}
            fullWidth
            sx={{ color: tokens.colors.bgPrimary }}
          >
            New Board
          </Button>
          
          <Button
            variant="text"
            onClick={onDismiss}
            fullWidth
            sx={{ color: tokens.colors.textMuted }}
          >
            View Board
          </Button>
        </Stack>
      </Modal>
    </Overlay>
  );
}
