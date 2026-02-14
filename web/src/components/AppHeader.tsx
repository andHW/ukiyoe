// App header — title + subtitle
import Typography from "@mui/material/Typography";
import { tokens } from "../theme";

export default function AppHeader() {
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
        浮世絵 Ukiyoe
      </Typography>
      <Typography variant="body2" sx={{ color: tokens.colors.textMuted, mt: -1, mb: 2 }}>
        A tile strategy game
      </Typography>
    </>
  );
}
