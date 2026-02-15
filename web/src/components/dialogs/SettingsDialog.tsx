// Settings dialog — toggle switches for game settings
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import type { Settings } from "../../hooks/useSettings";
import { tokens } from "../../theme";

const paperSx = {
  background: tokens.colors.bgSecondary,
  border: `1px solid ${tokens.colors.bgBoard}`,
  borderRadius: tokens.radii.lg,
  minWidth: 280,
  p: 1,
} as const;

interface SettingsDialogProps {
  open: boolean;
  settings: Settings;
  onUpdate: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onClose: () => void;
  hiddenKeys?: (keyof Settings)[];
}

const toggles: { key: keyof Settings; label: string }[] = [
  { key: "blurEnabled", label: "Blurry Tiles Effect" },
  { key: "showLegalHints", label: "Show Next Move Hints" },
  { key: "simpleBirds", label: "Simple Bird Icons (🐦)" },
  { key: "showLastTakenOnly", label: "Show Last Taken Tile Only" },
  { key: "overlappingTiles", label: "Artistic Tiles" },
];

export default function SettingsDialog({ open, settings, onUpdate, onClose, hiddenKeys = [] }: SettingsDialogProps) {
  const visibleToggles = toggles.filter(t => !hiddenKeys.includes(t.key));

  return (
    <Dialog open={open} onClose={onClose} slotProps={{ paper: { sx: paperSx } }}>
      <DialogTitle sx={{ fontFamily: tokens.fonts.display, color: tokens.colors.textPrimary, textAlign: "center" }}>
        ⚙️ Settings
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {visibleToggles.map(({ key, label }) => (
          <FormControlLabel
            key={key}
            control={
              <Switch
                checked={settings[key]}
                onChange={(e) => onUpdate(key, e.target.checked)}
                color="primary"
              />
            }
            label={label}
          />
        ))}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderColor: tokens.colors.bgBoardDark, color: tokens.colors.textPrimary }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
