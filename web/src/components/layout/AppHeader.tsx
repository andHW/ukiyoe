// App header — title + subtitle
import Typography from "@mui/material/Typography";
import { tokens } from "../../theme";

interface AppHeaderProps {
  showSubtitle?: boolean;
}

export default function AppHeader({ showSubtitle = true }: AppHeaderProps) {
  return (
    <>
      <Typography
        variant="h2"
        component="h1"
        sx={{
          color: tokens.colors.accentAmber,
          textAlign: "center",
          textShadow: `0 2px 12px rgba(232, 168, 56, 0.35)`,
          mt: 2,
          mb: 0,
          fontSize: { xs: "2rem", sm: "3rem" },
        }}
      >
        百景 Hyakkei
      </Typography>
      {showSubtitle && (
        <Typography variant="body2" sx={{ color: tokens.colors.textMuted, mt: -1, mb: 2 }}>
          A tile strategy game
        </Typography>
      )}
    </>
  );
}
