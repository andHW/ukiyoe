// Consolidated settings hook
import { useState, useCallback } from "react";

export interface Settings {
  blurEnabled: boolean;
  showLegalHints: boolean;
  simpleBirds: boolean;
  overlappingTiles: boolean;
  showLastTakenOnly: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  blurEnabled: true,
  showLegalHints: false,
  simpleBirds: false,
  overlappingTiles: true,
  showLastTakenOnly: false,
};

export interface UseSettingsReturn {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return { settings, updateSetting };
}
