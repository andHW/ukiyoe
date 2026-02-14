// Consolidated UI state hook for transient dialog/overlay toggles
import { useState, useCallback } from "react";

export interface UseUIStateReturn {
  showRules: boolean;
  toggleRules: () => void;

  showWinOverlay: boolean;
  setShowWinOverlay: (v: boolean) => void;

  showClockDialog: boolean;
  setShowClockDialog: (v: boolean) => void;

  showSettingsDialog: boolean;
  setShowSettingsDialog: (v: boolean) => void;

  boardCodeInput: string;
  setBoardCodeInput: (v: string) => void;

  copied: boolean;
  setCopied: (v: boolean) => void;
}

export function useUIState(): UseUIStateReturn {
  const [showRules, setShowRules] = useState(false);
  const [showWinOverlay, setShowWinOverlay] = useState(false);
  const [showClockDialog, setShowClockDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [boardCodeInput, setBoardCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const toggleRules = useCallback(() => setShowRules((v) => !v), []);

  return {
    showRules,
    toggleRules,
    showWinOverlay,
    setShowWinOverlay,
    showClockDialog,
    setShowClockDialog,
    showSettingsDialog,
    setShowSettingsDialog,
    boardCodeInput,
    setBoardCodeInput,
    copied,
    setCopied,
  };
}
