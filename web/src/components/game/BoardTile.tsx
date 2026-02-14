// Board tile — single tile with all layout variants, tokens, and state styles
import { styled, keyframes } from "@mui/material/styles";
import type { Tile, Poem as PoemType } from "../../engine/types";
import { Poem } from "../../engine/types";
import { PLANT_EMOJI, POEM_EMOJI, BIRD_VARIANTS } from "../../engine/constants";
import { getTileVariant } from "../../utils/tileVariant";
import { tokens } from "../../theme";

// ---------- Keyframes ----------

const tokenPlace = keyframes`
  0% { transform: scale(0) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.12) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

// ---------- Styled components ----------

const TileRoot = styled("div")<{ clickable: boolean }>(({ clickable }) => ({
  position: "relative",
  width: "100%",
  aspectRatio: "1",
  borderRadius: tokens.radii.sm,
  cursor: clickable ? "pointer" : "default",
  transition: "border-color 0.2s, box-shadow 0.2s",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: tokens.colors.tileBg,
  border: "2px solid transparent",
  overflow: "hidden",
  userSelect: "none",
  minWidth: 70,
}));

const EmojiPlant = styled("span")({
  position: "absolute",
  top: 5,
  left: 7,
  fontSize: "2rem",
  filter: "blur(0.75px) saturate(1.8) brightness(1.05)",
  opacity: 0.95,
  transition: "opacity 0.4s ease, filter 0.4s ease",
  pointerEvents: "none",
});

const EmojiPoem = styled("span")({
  position: "absolute",
  bottom: 5,
  right: 7,
  fontSize: "1.8rem",
  filter: "blur(0.6px) saturate(1.6) brightness(1.05)",
  opacity: 0.95,
  transition: "opacity 0.4s ease, filter 0.4s ease",
  pointerEvents: "none",
});

const Token = styled("div")<{ player: "p1" | "p2" }>(({ player }) => ({
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2.2rem",
  borderRadius: tokens.radii.sm,
  animation: `${tokenPlace} 0.35s ease-out`,
  zIndex: 2,
  pointerEvents: "none",
  background: player === "p1" ? tokens.colors.p1Bg : tokens.colors.p2Bg,
  filter: `drop-shadow(0 0 6px ${player === "p1" ? tokens.colors.p1Glow : tokens.colors.p2Glow})`,
}));

// ---------- Variant style maps ----------

const variantStyles: Record<string, { plant: React.CSSProperties; poem: React.CSSProperties }> = {
  "variant-standard": {
    plant: { top: "auto", bottom: -8, left: -4, fontSize: "2.8rem", opacity: 0.95, transform: "rotate(-10deg)", filter: "blur(0.5px) saturate(1.2) brightness(1.05)", zIndex: 1 },
    poem: { top: 4, right: 4, bottom: "auto", fontSize: "1.4rem", zIndex: 2, filter: "drop-shadow(0 0 4px rgba(240, 221, 197, 0.8))" },
  },
  "variant-reversed": {
    plant: { top: 4, left: 4, fontSize: "1.4rem", zIndex: 2, filter: "drop-shadow(0 0 4px rgba(240, 221, 197, 0.8))" },
    poem: { top: "auto", bottom: -6, right: -2, fontSize: "2.6rem", opacity: 0.95, transform: "rotate(5deg)", filter: "blur(0.5px) saturate(1.2) brightness(1.05)", zIndex: 1 },
  },
  "variant-centered": {
    plant: { top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(1.6)", fontSize: "2.2rem", opacity: 0.6, filter: "blur(0.5px) grayscale(0.2)", zIndex: 1 },
    poem: { top: 4, left: 4, right: "auto", bottom: "auto", transform: "none", fontSize: "1.5rem", zIndex: 2, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" },
  },
  "variant-diagonal": {
    plant: { top: "auto", bottom: 0, left: 0, fontSize: "2rem", transform: "none", zIndex: 1, filter: "saturate(1.1)" },
    poem: { top: 0, right: 0, bottom: "auto", left: "auto", fontSize: "1.8rem", zIndex: 1, filter: "saturate(1.1)" },
  },
};

// ---------- Win cell + legal highlight styles ----------

const winCellSx = {
  border: "2px solid rgba(255, 255, 255, 0.95)",
  boxShadow: `0 0 20px ${tokens.colors.accentAmber}, inset 0 0 15px rgba(232, 168, 56, 0.6)`,
  zIndex: 10,
  animation: "winPulse 1.5s infinite alternate",
  "@keyframes winPulse": {
    from: { boxShadow: `0 0 15px ${tokens.colors.accentAmber}` },
    to: { boxShadow: `0 0 30px ${tokens.colors.accentAmber}, 0 0 10px #fff` },
  },
} as const;

const legalHighlightSx = {
  border: `2px solid ${tokens.colors.legalBorder}`,
  boxShadow: `0 0 0 .5px ${tokens.colors.legalHighlight}, 0 0 10px color-mix(in srgb, ${tokens.colors.legalHighlight}, transparent 20%), 0 0 20px color-mix(in srgb, ${tokens.colors.legalHighlight}, transparent 20%), inset 0 0 15px color-mix(in srgb, ${tokens.colors.legalHighlight}, transparent 60%)`,
  "&:hover": { transform: "scale(1.05)" },
} as const;

// ---------- Props ----------

interface BoardTileProps {
  tile: Tile;
  index?: number;
  isTaken?: boolean;
  isP1?: boolean;
  isP2?: boolean;
  isWin?: boolean;
  isLegalHinted?: boolean; // legal + hints enabled
  isLegalHidden?: boolean; // legal + hints disabled
  canInteract?: boolean;
  overlapping?: boolean;
  noBlur?: boolean;
  simpleBirds?: boolean;
  playerEmoji?: { p1: string; p2: string };
  onClick?: (index: number) => void;
  // New prop to force a specific variant style (for falling tiles)
  forceVariant?: string;
  style?: React.CSSProperties;
}

export default function BoardTile({
  tile,
  index = 0,
  isTaken = false,
  isP1 = false,
  isP2 = false,
  isWin = false,
  isLegalHinted = false,
  canInteract = false,
  overlapping = true,
  noBlur = false,
  simpleBirds = false,
  playerEmoji = { p1: "🔴", p2: "⚫" },
  onClick,
  forceVariant,
  style,
}: BoardTileProps) {
  const clickable = canInteract && (isLegalHinted || !isTaken) && !!onClick;
  
  // Use forced variant if provided, otherwise calculate based on overlapping logic
  const variantKey = forceVariant || (overlapping ? getTileVariant(tile.plant, tile.poem) : null);
  const vStyles = variantKey ? variantStyles[variantKey] : null;

  const noBlurFilter = { filter: "none" };
  const plantStyle: React.CSSProperties = {
    ...(vStyles?.plant),
    ...(noBlur ? noBlurFilter : {}),
  };
  const poemStyle: React.CSSProperties = {
    ...(vStyles?.poem),
    ...(noBlur ? noBlurFilter : {}),
  };

  const poemEmoji =
    tile.poem === Poem.Bird
      ? simpleBirds
        ? POEM_EMOJI[Poem.Bird]
        : BIRD_VARIANTS[tile.plant]
      : POEM_EMOJI[tile.poem as PoemType];

  return (
    <TileRoot
      clickable={clickable}
      onClick={() => clickable && onClick?.(index)}
      style={style}
      sx={{
        ...(isTaken && { cursor: "default" }),
        ...(isWin && winCellSx),
        ...(isLegalHinted && legalHighlightSx),
      }}
    >
      <EmojiPlant style={plantStyle}>{PLANT_EMOJI[tile.plant]}</EmojiPlant>
      <EmojiPoem style={poemStyle}>{poemEmoji}</EmojiPoem>

      {isP1 && <Token player="p1">{playerEmoji.p1}</Token>}
      {isP2 && <Token player="p2">{playerEmoji.p2}</Token>}
    </TileRoot>
  );
}
