import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import HomeIcon from "@mui/icons-material/Home";
import SettingsIcon from "@mui/icons-material/Settings";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import { useNavigate } from "react-router-dom";
import { Plant, Poem } from "../../engine/types";
import type { Tile } from "../../engine/types";
import { PLANT_EMOJI, POEM_EMOJI } from "../../engine/constants";
import { codeFromBoard } from "../../engine/permutation";
import BoardTile from "../game/BoardTile";
import SettingsDialog from "../dialogs/SettingsDialog";
import { useSettings } from "../../hooks/useSettings";
import { tokens } from "../../theme";

type ElementType = "plant" | "poem";

interface BuilderStep {
  type: ElementType;
  value: Plant | Poem;
  label: string;
  emoji: string;
}

const STEPS: BuilderStep[] = [
  // Plants
  { type: "plant", value: Plant.Maple, label: "Maple", emoji: PLANT_EMOJI[Plant.Maple] },
  { type: "plant", value: Plant.Cherry, label: "Cherry", emoji: PLANT_EMOJI[Plant.Cherry] },
  { type: "plant", value: Plant.Pine, label: "Pine", emoji: PLANT_EMOJI[Plant.Pine] },
  { type: "plant", value: Plant.Iris, label: "Iris", emoji: PLANT_EMOJI[Plant.Iris] },
  // Poems
  { type: "poem", value: Poem.RisingSun, label: "Sun", emoji: POEM_EMOJI[Poem.RisingSun] },
  { type: "poem", value: Poem.PoemFlag, label: "Ribbon", emoji: POEM_EMOJI[Poem.PoemFlag] },
  { type: "poem", value: Poem.Rain, label: "Willow/Rain", emoji: POEM_EMOJI[Poem.Rain] },
  { type: "poem", value: Poem.Bird, label: "Bird", emoji: "🐦" },
];

export default function BoardBuilder() {
  const navigate = useNavigate();
  const [board, setBoard] = useState<(Partial<Tile>)[]>(Array(16).fill({}));
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const { settings, updateSetting } = useSettings();

  // Set builder defaults on mount (Regular birds, No artistic tiles)
  useEffect(() => {
    updateSetting("simpleBirds", true);
    updateSetting("overlappingTiles", false);
  }, [updateSetting]);

  const activeStep = STEPS[activeStepIndex];
  const prevBoardRef = useRef(board);

  // Count placed for each step
  const getCountForStep = useCallback((step: BuilderStep, boardState = board) => {
    return boardState.filter(t => 
      step.type === "plant" 
        ? t.plant === step.value 
        : t.poem === step.value
    ).length;
  }, [board]);

  // Auto-advance logic
  useEffect(() => {
    const prevBoard = prevBoardRef.current;
    
    // Calculate counts
    const prevCount = getCountForStep(activeStep, prevBoard);
    const currentCount = getCountForStep(activeStep, board);

    // Update ref
    prevBoardRef.current = board;

    // Only advance if we JUST reached 4
    if (prevCount < 4 && currentCount === 4) {
      // Find next incomplete step (cycling)
      let nextIndex = -1;
      for (let i = 1; i < STEPS.length; i++) {
        const idx = (activeStepIndex + i) % STEPS.length;
        // Check if this step is incomplete in the CURRENT board
        const step = STEPS[idx];
        const stepCount = board.filter(t => 
             step.type === "plant" 
               ? t.plant === step.value 
               : t.poem === step.value
           ).length;
           
        if (stepCount < 4) {
          nextIndex = idx;
          break;
        }
      }

      if (nextIndex !== -1) {
        const timer = setTimeout(() => {
          setActiveStepIndex(nextIndex);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [board, activeStep, activeStepIndex, getCountForStep]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Helper to update board
  const handleTileClick = (index: number) => {
    setBoard(prev => {
      const newBoard = [...prev];
      const tile = { ...newBoard[index] }; // Copy tile
      const step = activeStep;

      // Toggle logic
      const currentCount = newBoard.filter(t => 
        step.type === "plant" 
          ? t.plant === step.value 
          : t.poem === step.value
      ).length;

      // Construct proposed tile
      const nextTile = { ...tile };
      if (step.type === "plant") {
        if (nextTile.plant === step.value) {
           delete nextTile.plant; 
        } else if (currentCount < 4) {
           nextTile.plant = step.value as Plant;
        }
      } else {
         if (nextTile.poem === step.value) {
            delete nextTile.poem;
         } else if (currentCount < 4) {
            nextTile.poem = step.value as Poem;
         }
      }

      // Check for duplicates
      // Only matters if both plant and poem are present
      if (nextTile.plant !== undefined && nextTile.poem !== undefined) {
          const duplicate = newBoard.some((t, i) => 
              i !== index && 
              t.plant === nextTile.plant && 
              t.poem === nextTile.poem
          );
          if (duplicate) {
             const pEmoji = PLANT_EMOJI[nextTile.plant];
             const poEmoji = POEM_EMOJI[nextTile.poem];
             // We can use emojis or labels. 
             // We need to look up label for plant/poem
             setSnackbarMessage(`The tile [ ${pEmoji} + ${poEmoji} ] already exists on the board!`);
             setSnackbarOpen(true);
             return prev; // Return original state, no change
          }
      }

      // Apply change
      newBoard[index] = nextTile;
      return newBoard;
    });
  };

  // Derived state: Counts
  const currentCount = getCountForStep(activeStep);
  
  // Check if entire board is valid
  const isValidBoard = useMemo(() => {
    if (board.some(t => t.plant === undefined || t.poem === undefined)) return false;
    // Check constraints (4 of each)
    const plantCounts = [0,0,0,0];
    const poemCounts = [0,0,0,0];
    board.forEach(t => {
      if (t.plant !== undefined) plantCounts[t.plant]++;
      if (t.poem !== undefined) poemCounts[t.poem]++;
    });
    return plantCounts.every(c => c === 4) && poemCounts.every(c => c === 4);
  }, [board]);

  // Check if all OTHER categories (7 out of 8) are completely placed
  const canAutoFillActiveStep = useMemo(() => {
    return STEPS.every((step, idx) => {
      if (idx === activeStepIndex) return true;
      return getCountForStep(step) === 4;
    });
  }, [activeStepIndex, getCountForStep]);

  const handleFinish = () => {
    if (!isValidBoard) return;
    const fullBoard = board as Tile[];
    const code = codeFromBoard(fullBoard);
    if (code !== -1) {
      navigate(`/play?mode=vs-ai&code=${code}&ai=p2`); 
    } else {
      alert("Invalid board configuration.");
    }
  };

  const handleAutoFillActiveStep = () => {
    setBoard(prev => prev.map(t => {
      if (activeStep.type === "plant" && t.plant === undefined) {
        return { ...t, plant: activeStep.value as Plant };
      }
      if (activeStep.type === "poem" && t.poem === undefined) {
        return { ...t, poem: activeStep.value as Poem };
      }
      return t;
    }));
  };


  const handleClearClick = () => {
    setClearDialogOpen(true);
  };

  const handleClearConfirm = () => {
    setBoard(Array(16).fill({}));
    setActiveStepIndex(0);
    setClearDialogOpen(false);
  };

  const handleClearCancel = () => {
    setClearDialogOpen(false);
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      pb: 4
    }}>
      {/* Top Navigation Bar */}
      <AppBar position="static" elevation={0} sx={{bgcolor: "transparent"}}>
        <Toolbar sx={{ px: 2, display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
            <IconButton onClick={() => navigate("/")} size="medium">
              <HomeIcon />
            </IconButton>
          </Box>
          
          <Typography variant="h6" sx={{ 
            fontFamily: tokens.fonts.display, 
            color: tokens.colors.accentAmber,
            textAlign: "center",
            whiteSpace: "nowrap"
          }}>
            Board Builder
          </Typography>

          <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={handleClearClick} size="medium" sx={{ color: tokens.colors.textSecondary }}>
              <RotateLeftIcon />
            </IconButton>
            <IconButton onClick={() => setShowSettingsDialog(true)} size="medium">
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column", py: 3, gap: 3 }}>
        
        {/* Step Toolbar */}
        <Paper sx={{ p: 2, borderRadius: tokens.radii.lg, bgcolor: tokens.colors.bgCard }}>
           <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textAlign: "center" }}>
              Select Element to Place ({currentCount}/4)
           </Typography>
           <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 1 }}>
              {STEPS.map((step, idx) => {
                 const isActive = idx === activeStepIndex;
                 const count = getCountForStep(step);
                 const isDone = count === 4;
                 return (
                   <Box key={idx}>
                      <Box 
                        onClick={() => setActiveStepIndex(idx)}
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

        {/* Board Grid */}
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
                      (activeStep.type === "plant" && tile.plant === undefined) ||
                      (activeStep.type === "poem" && tile.poem === undefined);

                   return (
                     <BoardTile
                       key={i}
                       index={i}
                       tile={tile}
                       canInteract={true}
                       isLegalHinted={isEligible} 
                       overlapping={settings.overlappingTiles}
                       simpleBirds={settings.simpleBirds}
                       noBlur={!settings.blurEnabled}
                       onClick={() => handleTileClick(i)}
                       style={{
                          border: isHighlighted
                             ? `2px solid ${tokens.colors.accentAmber}` 
                             : undefined,
                          boxShadow: isHighlighted
                             ? `0 0 15px ${tokens.colors.accentAmber}`
                             : undefined,
                          transform: isHighlighted ? "scale(1.08)" : "scale(1)",
                          zIndex: isHighlighted ? 1 : 0,
                          transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                       }}
                     />
                   );
                })}
              </Box>
          </Box>
        </Box>

        {/* Instructions / Actions */}
        <Box sx={{ textAlign: "center" }}>
           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
             {activeStep.type === "plant" 
                ? `Tap grid to place ALL ${activeStep.label} (${activeStep.emoji})`
                : `Tap grid to place ALL ${activeStep.label} (${activeStep.emoji})`
             }
           </Typography>

           {/* Generic Auto-fill helper */}
           {currentCount < 4 && canAutoFillActiveStep && (
               <Button 
                 variant="outlined" 
                 fullWidth 
                 sx={{ mb: 2 }} 
                 onClick={handleAutoFillActiveStep}
               >
                 Auto-fill remaining with {activeStep.label} {activeStep.emoji}
               </Button>
           )}

           <Button
             variant="contained"
             fullWidth
             size="large"
             disabled={!isValidBoard}
             onClick={handleFinish}
             sx={{ 
                bgcolor: isValidBoard ? tokens.colors.success : undefined,
                py: 1.5,
                fontSize: "1.1rem"
             }}
           >
             {isValidBoard ? "Start Game using this Board" : "Incomplete Board"}
           </Button>
        </Box>

      </Container>

      <SettingsDialog
        open={showSettingsDialog}
        settings={settings}
        onUpdate={(key, value) => updateSetting(key, value)}
        onClose={() => setShowSettingsDialog(false)}
        hiddenKeys={['showLegalHints', 'showLastTakenOnly']}
      />

      {/* Clear Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={handleClearCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
            sx: { borderRadius: tokens.radii.lg, bgcolor: tokens.colors.bgCard }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.display }}>
          {"Clear entire board?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: tokens.colors.textSecondary }}>
            This will remove all placed tiles and reset your progress to the beginning.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClearCancel} sx={{ color: tokens.colors.textSecondary }}>Cancel</Button>
          <Button onClick={handleClearConfirm} color="error" variant="contained" autoFocus>
            Clear Board
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Warning Snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity="warning" variant="filled" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
