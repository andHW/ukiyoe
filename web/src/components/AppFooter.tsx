// App footer — credits
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { tokens } from "../theme";

export default function AppFooter() {
  return (
    <Box
      component="footer"
      sx={{ textAlign: "center", mt: 4, mb: 2, color: tokens.colors.textMuted, fontSize: "0.8rem" }}
    >
      <Typography variant="caption" display="block" sx={{ fontFamily: tokens.fonts.display }}>
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
      <Typography variant="caption" display="block" sx={{ fontFamily: tokens.fonts.display }}>
        Illustrations by Cyril Bouquet
      </Typography>
    </Box>
  );
}
