import Button, { type ButtonProps } from "@mui/material/Button";
import { alpha, styled } from "@mui/material/styles";
import { tokens } from "../../theme";

export type GameButtonVariant = "primary" | "secondary" | "outlined" | "critical" | "ghost";

interface GameButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: GameButtonVariant;
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== "gameVariant",
})<{ gameVariant: GameButtonVariant }>(({ theme, gameVariant }) => {
  const baseStyles = {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    fontSize: "1.05rem",
    boxShadow: tokens.shadows.sm,
    transition: "all 0.2s ease-in-out",
    "&:active": {
      transform: "scale(0.98)",
    },
  };

  switch (gameVariant) {
    case "primary":
      return {
        ...baseStyles,
        backgroundColor: tokens.colors.accentAmber,
        color: tokens.colors.bgPrimary,
        "&:hover": {
          backgroundColor: "#d49730",
          boxShadow: tokens.shadows.md,
        },
      };
    case "secondary":
      return {
        ...baseStyles,
        backgroundColor: tokens.colors.bgBoardDark,
        color: tokens.colors.textPrimary,
        "&:hover": {
          backgroundColor: tokens.colors.bgCard,
          boxShadow: tokens.shadows.md,
        },
      };
    case "critical":
        return {
            ...baseStyles,
            backgroundColor: tokens.colors.accentTerracotta,
            color: "white",
            "&:hover": {
              backgroundColor: "#a3462c",
              boxShadow: tokens.shadows.md,
            },
        };
    case "outlined":
      return {
        ...baseStyles,
        backgroundColor: alpha(tokens.colors.bgPrimary, 0.6),
        backdropFilter: "blur(4px)",
        border: `1px solid ${tokens.colors.border}`,
        color: tokens.colors.textSecondary,
        boxShadow: "none",
        "&:hover": {
          backgroundColor: tokens.colors.bgSecondary,
          borderColor: tokens.colors.textSecondary,
          color: tokens.colors.textPrimary,
        },
      };
    case "ghost":
      return {
        ...baseStyles,
        backgroundColor: "transparent",
        color: tokens.colors.textMuted,
        boxShadow: "none",
        "&:hover": {
          backgroundColor: alpha(tokens.colors.textMuted, 0.1),
          color: tokens.colors.textPrimary,
        },
      }
    default:
      return baseStyles;
  }
});

export default function GameButton({ variant = "primary", sx, ...props }: GameButtonProps) {
  // Map our gameVariant to MUI variant for accessibility/DOM structure if needed,
  // but we are overriding styles heavily so we primarily use the styled component.
  // We pass 'contained' for solid buttons and 'outlined' for outlined to keep MUI happyish.
  const muiVariant = variant === "outlined" ? "outlined" : (variant === "ghost" ? "text" : "contained");

  return <StyledButton gameVariant={variant} variant={muiVariant} sx={sx} {...props} />;
}
