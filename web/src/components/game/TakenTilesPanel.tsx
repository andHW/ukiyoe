// Taken tiles panel — mini tile history below the board
import { styled, keyframes } from "@mui/material/styles";
import type { Tile } from "../../engine/types";
import { Poem } from "../../engine/types";
import { PLANT_EMOJI, POEM_EMOJI, BIRD_VARIANTS } from "../../engine/constants";
import { getTileVariant } from "../../utils/tileVariant";
import { tokens } from "../../theme";

// ---------- Keyframes ----------

const fadeScaleIn = keyframes`
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
`;

// ---------- Styled ----------

const Panel = styled("div")({
  width: "100%",
  maxWidth: 450,
  background: tokens.colors.bgCard,
  borderRadius: tokens.radii.md,
  padding: 12,
  border: `1px solid ${tokens.colors.bgBoardDark}`,
});

const Title = styled("div")({
  fontSize: "0.9rem",
  color: tokens.colors.textMuted,
  marginBottom: 8,
});

const GridWrapper = styled("div")({
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  justifyContent: "center",
  minHeight: 60,
});

const EmptyMsg = styled("div")({
  width: "100%",
  textAlign: "center",
  color: tokens.colors.textMuted,
  fontStyle: "italic",
  padding: 10,
});

const MiniTileOuter = styled("div")<{ player: "p1" | "p2" }>(({ player }) => ({
  position: "relative",
  width: 44,
  height: 44,
  borderRadius: 6,
  overflow: "hidden",
  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
  animation: `${fadeScaleIn} 0.3s ease-out`,
  background: tokens.colors.tileBg,
  borderBottom: `4px solid ${player === "p1" ? tokens.colors.p1Color : tokens.colors.p2Color}`,
  boxSizing: "content-box",
}));

const MiniTileInner = styled("div")({
  width: 70,
  height: 70,
  transform: "scale(0.63)",
  transformOrigin: "top left",
  position: "relative",
  pointerEvents: "none",
});

const MiniEmojiPlant = styled("span")({
  position: "absolute",
  top: 5,
  left: 7,
  fontSize: "2rem",
  filter: "blur(0.75px) saturate(1.8) brightness(1.05)",
  opacity: 0.95,
  pointerEvents: "none",
});

const MiniEmojiPoem = styled("span")({
  position: "absolute",
  bottom: 5,
  right: 7,
  fontSize: "1.8rem",
  filter: "blur(0.6px) saturate(1.6) brightness(1.05)",
  opacity: 0.95,
  pointerEvents: "none",
});

// ---------- Variant styles (same as BoardTile but applied via inline style) ----------

const variantPlantStyles: Record<string, React.CSSProperties> = {
  "variant-standard": { top: "auto", bottom: -8, left: -4, fontSize: "2.8rem", opacity: 0.95, transform: "rotate(-10deg)", filter: "blur(0.5px) saturate(1.2) brightness(1.05)", zIndex: 1 },
  "variant-reversed": { top: 4, left: 4, fontSize: "1.4rem", zIndex: 2, filter: "drop-shadow(0 0 4px rgba(240, 221, 197, 0.8))" },
  "variant-centered": { top: "50%", left: "50%", transform: "translate(-50%, -50%) scale(1.6)", fontSize: "2.2rem", opacity: 0.6, filter: "blur(0.5px) grayscale(0.2)", zIndex: 1 },
  "variant-diagonal": { top: "auto", bottom: 0, left: 0, fontSize: "2rem", transform: "none", zIndex: 1, filter: "saturate(1.1)" },
};

const variantPoemStyles: Record<string, React.CSSProperties> = {
  "variant-standard": { top: 4, right: 4, bottom: "auto", fontSize: "1.4rem", zIndex: 2, filter: "drop-shadow(0 0 4px rgba(240, 221, 197, 0.8))" },
  "variant-reversed": { top: "auto", bottom: -6, right: -2, fontSize: "2.6rem", opacity: 0.95, transform: "rotate(5deg)", filter: "blur(0.5px) saturate(1.2) brightness(1.05)", zIndex: 1 },
  "variant-centered": { top: 4, left: 4, right: "auto", bottom: "auto", transform: "none", fontSize: "1.5rem", zIndex: 2, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" },
  "variant-diagonal": { top: 0, right: 0, bottom: "auto", left: "auto", fontSize: "1.8rem", zIndex: 1, filter: "saturate(1.1)" },
};

// ---------- Types ----------

export interface HistoryEntry {
  moveIdx: number;
  tile: Tile;
  player: "p1" | "p2";
  turn: number;
}

// ---------- Component ----------

interface TakenTilesPanelProps {
  entries: HistoryEntry[];
  showLastOnly: boolean;
  overlapping: boolean;
  simpleBirds: boolean;
  noBlur: boolean;
}

export default function TakenTilesPanel({
  entries,
  showLastOnly,
  overlapping,
  simpleBirds,
  noBlur,
}: TakenTilesPanelProps) {
  const visible = showLastOnly ? entries.slice(-1) : entries;

  return (
    <Panel>
      <Title>
        {showLastOnly ? "Last Taken Tile" : `Taken Tiles (${entries.length})`}
      </Title>
      <GridWrapper>
        {entries.length === 0 && <EmptyMsg>No taken tiles yet</EmptyMsg>}
        {visible.map((entry, i) => {
          const { tile, player } = entry;
          const variant = overlapping ? getTileVariant(tile.plant, tile.poem) : null;
          const plantStyle: React.CSSProperties = variant ? { ...variantPlantStyles[variant], ...(noBlur ? { filter: "none" } : {}) } : (noBlur ? { filter: "none" } : {});
          const poemStyle: React.CSSProperties = variant ? { ...variantPoemStyles[variant], ...(noBlur ? { filter: "none" } : {}) } : (noBlur ? { filter: "none" } : {});

          const poemEmoji =
            tile.poem === Poem.Bird
              ? simpleBirds ? POEM_EMOJI[Poem.Bird] : BIRD_VARIANTS[tile.plant]
              : POEM_EMOJI[tile.poem];

          return (
            <MiniTileOuter key={i} player={player}>
              <MiniTileInner>
                <MiniEmojiPlant style={plantStyle}>{PLANT_EMOJI[tile.plant]}</MiniEmojiPlant>
                <MiniEmojiPoem style={poemStyle}>{poemEmoji}</MiniEmojiPoem>
              </MiniTileInner>
            </MiniTileOuter>
          );
        })}
      </GridWrapper>
    </Panel>
  );
}
