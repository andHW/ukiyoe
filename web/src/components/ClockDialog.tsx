// Clock settings dialog
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { tokens } from "../theme";

const paperSx = {
  background: tokens.colors.bgSecondary,
  border: `1px solid ${tokens.colors.bgBoard}`,
  borderRadius: tokens.radii.lg,
  minWidth: 300,
  p: 1,
} as const;

interface ClockDialogProps {
  open: boolean;
  customMinutes: string;
  onMinutesChange: (value: string) => void;
  onStart: () => void;
  onClose: () => void;
}

export default function ClockDialog({
  open,
  customMinutes,
  onMinutesChange,
  onStart,
  onClose,
}: ClockDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} slotProps={{ paper: { sx: paperSx } }}>
      <DialogTitle sx={{ fontFamily: tokens.fonts.display, color: tokens.colors.accentAmber, textAlign: "center" }}>
        ⏱ Clock Settings
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        <Typography variant="body2" align="center" sx={{ color: tokens.colors.textPrimary }}>
          Per player time (minutes):
        </Typography>
        <TextField
          type="number"
          value={customMinutes}
          onChange={(e) => onMinutesChange(e.target.value)}
          fullWidth
          slotProps={{
            htmlInput: { min: 1, max: 60, style: { textAlign: "center" } },
          }}
          sx={{
            input: { color: tokens.colors.textPrimary },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: tokens.colors.bgBoardDark },
              "&:hover fieldset": { borderColor: tokens.colors.accentAmber },
              "&.Mui-focused fieldset": { borderColor: tokens.colors.accentAmber },
            },
          }}
        />
        <Typography variant="caption" align="center" sx={{ color: tokens.colors.textMuted, mt: -1 }}>
          Recommended: 2 minutes
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onStart}
          sx={{ color: tokens.colors.bgPrimary, minWidth: 120 }}
        >
          Start Clock
        </Button>
      </DialogActions>
    </Dialog>
  );
}
