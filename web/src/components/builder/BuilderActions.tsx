import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import GameButton from "../common/GameButton";
import { tokens } from "../../theme";
import type { BuilderStep } from "../../hooks/useBoardBuilder";

interface BuilderActionsProps {
  activeStep: BuilderStep;
  currentCount: number;
  canAutoFill: boolean;
  isValidBoard: boolean;
  onAutoFill: () => void;
  onFinish: () => void;
}

export default function BuilderActions({
  activeStep,
  currentCount,
  canAutoFill,
  isValidBoard,
  onAutoFill,
  onFinish
}: BuilderActionsProps) {
  return (
    <Box sx={{ textAlign: "center" }}>
       <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
         {`Tap grid to place ALL ${activeStep.label} (${activeStep.emoji})`}
       </Typography>

       {/* Generic Auto-fill helper */}
       {currentCount < 4 && canAutoFill && (
           <GameButton 
             variant="outlined" 
             fullWidth 
             sx={{ mb: 2 }} 
             onClick={onAutoFill}
           >
             Auto-fill remaining with {activeStep.label} {activeStep.emoji}
           </GameButton>
       )}

       <GameButton
         variant="primary"
         fullWidth
         size="large"
         disabled={!isValidBoard}
         onClick={onFinish}
         sx={{ 
            bgcolor: isValidBoard ? tokens.colors.success : undefined,
         }}
       >
         {isValidBoard ? "Start Game using this Board" : "Incomplete Board"}
       </GameButton>
    </Box>
  );
}
