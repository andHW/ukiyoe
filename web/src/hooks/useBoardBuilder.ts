import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plant, Poem } from "../engine/types";
import { PLANT_EMOJI, POEM_EMOJI } from "../engine/constants";
import type { Tile } from "../engine/types";
import { codeFromBoard } from "../engine/permutation";
import { useSettings } from "./useSettings";

export type ElementType = "plant" | "poem";

export interface BuilderStep {
  type: ElementType;
  value: Plant | Poem;
  label: string;
  emoji: string;
}

export const STEPS: BuilderStep[] = [
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

export function useBoardBuilder() {
  const navigate = useNavigate();
  const [board, setBoard] = useState<(Partial<Tile>)[]>(Array(16).fill({}));
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorTileIndex, setErrorTileIndex] = useState<number | null>(null);
  const [conflictingTile, setConflictingTile] = useState<Partial<Tile> | null>(null);

  const { settings, updateSetting } = useSettings();

  // Set builder defaults on mount
  useEffect(() => {
    updateSetting("simpleBirds", true);
    updateSetting("overlappingTiles", false);
  }, [updateSetting]);

  const activeStep = STEPS[activeStepIndex];
  const prevBoardRef = useRef(board);

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
    
    const prevCount = getCountForStep(activeStep, prevBoard);
    const currentCount = getCountForStep(activeStep, board);

    prevBoardRef.current = board;

    if (prevCount < 4 && currentCount === 4) {
      let nextIndex = -1;
      for (let i = 1; i < STEPS.length; i++) {
        const idx = (activeStepIndex + i) % STEPS.length;
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
    setConflictingTile(null);
  };

  const handleTileClick = (index: number) => {
    setBoard(prev => {
      const newBoard = [...prev];
      const tile = { ...newBoard[index] };
      const step = activeStep;

      const currentCount = newBoard.filter(t => 
        step.type === "plant" 
          ? t.plant === step.value 
          : t.poem === step.value
      ).length;

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

      if (nextTile.plant !== undefined && nextTile.poem !== undefined) {
          const duplicateIndex = newBoard.findIndex((t, i) => 
              i !== index && 
              t.plant === nextTile.plant && 
              t.poem === nextTile.poem
          );

          if (duplicateIndex !== -1) {
             setConflictingTile(nextTile);
             setSnackbarOpen(true);
             setErrorTileIndex(duplicateIndex);
             setTimeout(() => setErrorTileIndex(null), 1000);

             return prev;
          }
      }

      newBoard[index] = nextTile;
      return newBoard;
    });
  };

  const currentCount = getCountForStep(activeStep);
  
  const isValidBoard = useMemo(() => {
    if (board.some(t => t.plant === undefined || t.poem === undefined)) return false;
    const plantCounts = [0,0,0,0];
    const poemCounts = [0,0,0,0];
    board.forEach(t => {
      if (t.plant !== undefined) plantCounts[t.plant]++;
      if (t.poem !== undefined) poemCounts[t.poem]++;
    });
    return plantCounts.every(c => c === 4) && poemCounts.every(c => c === 4);
  }, [board]);

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

  const handleClearClick = () => setClearDialogOpen(true);

  const handleClearConfirm = () => {
    setBoard(Array(16).fill({}));
    setActiveStepIndex(0);
    setClearDialogOpen(false);
  };

  const handleClearCancel = () => setClearDialogOpen(false);

  return {
    board,
    activeStep,
    activeStepIndex,
    setActiveStepIndex,
    currentCount,
    isValidBoard,
    canAutoFillActiveStep,
    errorTileIndex,
    conflictingTile,
    snackbarOpen,
    clearDialogOpen,
    showSettingsDialog,
    settings,
    setShowSettingsDialog,
    handleTileClick,
    handleFinish,
    handleAutoFillActiveStep,
    handleClearClick,
    handleClearConfirm,
    handleClearCancel,
    handleSnackbarClose,
    updateSetting,
    getCountForStep,
  };
}
