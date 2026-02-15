import Box from "@mui/material/Box";
import { keyframes } from "@mui/material/styles";
import { tokens } from "../../theme";
import { type Tile, Plant, Poem } from "../../engine/types";
import type { BuilderStep } from "../../hooks/useBoardBuilder";
import BoardTile from "../game/BoardTile";

// Define flashing animation
const flashRed = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 transparent; }
  50% { opacity: 0.5; transform: scale(1.1); box-shadow: 0 0 20px ${tokens.colors.p1Color}; }
`;

interface BuilderGridProps {
  board: Partial<Tile>[];
  activeStep: BuilderStep;
  currentCount: number;
  errorTileIndex: number | null;
  settings: {
    overlappingTiles: boolean;
    simpleBirds: boolean;
    blurEnabled: boolean;
  };
  onTileClick: (index: number) => void;
}

export default function BuilderGrid({
  board,
  activeStep,
  currentCount,
  errorTileIndex,
  settings,
  onTileClick
}: BuilderGridProps) {
  return (
    <Box sx={{ 
        display: "flex",
        justifyContent: "center",
        mb: 4 
    }}>
      <Box sx={{ 
          position: "relative",
          background: `linear-gradient(145deg, ${tokens.colors.bgBoard}, ${tokens.colors.bgBoardDark})`,
          borderRadius: tokens.radii.lg,
          padding: "10px",
          boxShadow: `${tokens.shadows.lg}, inset 0 1px 0 rgba(255,255,255,0.08)`,
          width: "fit-content",
      }}>
          <Box sx={{
            display: "grid", 
            gridTemplateColumns: "repeat(4, 1fr)", 
            gap: "5px",
          }}>
            {board.map((tile, i) => {
               const isHighlighted = 
                  (activeStep.type === "plant" && tile.plant === activeStep.value) ||
                  (activeStep.type === "poem" && tile.poem === activeStep.value);

               const isEligible = 
                  currentCount < 4 && (
                    (activeStep.type === "plant" && tile.plant === undefined) ||
                    (activeStep.type === "poem" && tile.poem === undefined)
                  );

               // Check if placing here would create a duplicate
               let wouldBeDuplicate = false;
               if (isEligible) {
                   const hypotheticalTile = { ...tile };
                   if (activeStep.type === "plant") hypotheticalTile.plant = activeStep.value as Plant;
                   else hypotheticalTile.poem = activeStep.value as Poem;
                   
                   // Only check if both parts exist
                   if (hypotheticalTile.plant !== undefined && hypotheticalTile.poem !== undefined) {
                       wouldBeDuplicate = board.some((t, idx) => 
                           idx !== i && 
                           t.plant === hypotheticalTile.plant && 
                           t.poem === hypotheticalTile.poem
                       );
                   }
               }

               // Disable eligibility if it creates a duplicate
               const finalIsEligible = isEligible && !wouldBeDuplicate;
               const isError = i === errorTileIndex;

               return (
                 <BoardTile
                   key={i}
                   index={i}
                   tile={tile}
                   canInteract={true}
                   isLegalHinted={finalIsEligible} 
                   overlapping={settings.overlappingTiles}
                   simpleBirds={settings.simpleBirds}
                   noBlur={!settings.blurEnabled}
                   onClick={() => onTileClick(i)}
                   style={{
                      border: (isHighlighted || isError)
                         ? `2px solid ${isError ? tokens.colors.p1Color : tokens.colors.accentAmber}` 
                         : undefined,
                      boxShadow: (isHighlighted || isError)
                         ? `0 0 ${isError ? '20px' : '15px'} ${isError ? tokens.colors.p1Color : tokens.colors.accentAmber}`
                         : undefined,
                      transform: (isHighlighted || isError) ? "scale(1.08)" : "scale(1)",
                      zIndex: (isHighlighted || isError) ? 10 : 0,
                      transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      opacity: (isEligible && wouldBeDuplicate) ? 0.3 : 1, // Dim invalid duplicates
                      animation: isError ? `${flashRed} 0.4s ease-in-out 3` : undefined, // Blink 3 times quickly
                   }}
                 />
               );
            })}
          </Box>
      </Box>
    </Box>
  );
}
