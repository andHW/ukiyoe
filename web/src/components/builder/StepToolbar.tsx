import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { tokens } from "../../theme";
import type { BuilderStep } from "../../hooks/useBoardBuilder";

interface StepToolbarProps {
  steps: BuilderStep[];
  activeStepIndex: number;
  currentCount: number;
  onStepClick: (index: number) => void;
  getCountForStep: (step: BuilderStep) => number;
}

export default function StepToolbar({ 
  steps, 
  activeStepIndex, 
  currentCount, 
  onStepClick, 
  getCountForStep 
}: StepToolbarProps) {
  return (
    <Paper sx={{ p: 2, borderRadius: tokens.radii.lg, bgcolor: tokens.colors.bgCard }}>
       <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: "center" }}>
          Select Element to Place ({currentCount}/4)
       </Typography>
       <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
          {steps.map((step, idx) => {
             const isActive = idx === activeStepIndex;
             const count = getCountForStep(step);
             const isDone = count === 4;
             return (
               <Box key={idx}>
                  <Box 
                    onClick={() => onStepClick(idx)}
                    sx={{
                       width: 44,
                       height: 44,
                       borderRadius: tokens.radii.md,
                       border: `2px solid ${isActive ? tokens.colors.accentAmber : isDone ? tokens.colors.success : tokens.colors.border}`,
                       bgcolor: isActive ? "rgba(232, 168, 56, 0.1)" : "transparent",
                       display: "flex",
                       alignItems: "center",
                       justifyContent: "center",
                       fontSize: "1.5rem",
                       cursor: "pointer",
                       position: "relative",
                       opacity: (count === 4 && !isActive) ? 0.5 : 1
                    }}
                  >
                    {step.emoji}
                    {isDone && (
                        <CheckCircleIcon sx={{ position: "absolute", top: -4, right: -4, fontSize: 14, color: tokens.colors.success, bgcolor: "white", borderRadius: "50%" }} />
                    )}
                  </Box>
               </Box>
             );
          })}
       </Box>
    </Paper>
  );
}
