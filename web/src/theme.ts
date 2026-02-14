// MUI theme configuration for Ukiyoe
import { createTheme } from "@mui/material/styles";

// Design tokens — replaces CSS custom properties from index.css
export const tokens = {
  colors: {
    bgPrimary: "#1a1612",
    bgSecondary: "#2a2420",
    bgCard: "#3a322c",
    bgBoard: "#8B7355",
    bgBoardDark: "#6d5a44",

    textPrimary: "#f5e6d3",
    textSecondary: "#c4a882",
    textMuted: "#8a7a6a",

    accentAmber: "#e8a838",
    accentTerracotta: "#c45a3c",
    accentWarm: "#d4956a",
    accentGreen: "#5bff92",

    p1Color: "#c45a3c",
    p1Bg: "rgba(196, 90, 60, 0.85)",
    p1Glow: "rgba(196, 90, 60, 0.6)",
    p2Color: "#5a5a5a",
    p2Bg: "rgba(40, 40, 40, 0.85)",
    p2Glow: "rgba(120, 120, 120, 0.6)",

    tileBg: "#f0ddc5",
    winHighlight: "rgba(80, 200, 120, 0.35)",
    legalHighlight: "#5bff92",
    legalBorder: "rgba(255, 255, 255, 0.95)",
  },
  radii: {
    sm: "6px",
    md: "10px",
    lg: "16px",
  },
  shadows: {
    sm: "0 1px 3px rgba(0,0,0,0.3)",
    md: "0 4px 12px rgba(0,0,0,0.4)",
    lg: "0 8px 24px rgba(0,0,0,0.5)",
  },
  fonts: {
    display: "'Potta One', cursive",
    body: "'Potta One', cursive",
    sans: "'Inter', sans-serif",
  },
} as const;

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: tokens.colors.accentAmber },
    secondary: { main: tokens.colors.accentTerracotta },
    background: {
      default: tokens.colors.bgPrimary,
      paper: tokens.colors.bgSecondary,
    },
  },
  typography: {
    fontFamily: tokens.fonts.display,
    allVariants: {
      color: tokens.colors.textPrimary,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontFamily: tokens.fonts.display,
          fontWeight: 400,
          borderRadius: 12,
          letterSpacing: "0.5px",
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          fontFamily: tokens.fonts.display,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        "#root": {
          width: "100%",
          maxWidth: 900,
          margin: "0 auto",
          padding: 16,
        },
      },
    },
  },
});

export default theme;
