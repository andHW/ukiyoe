// Board code bar — copy, paste, load board codes
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { tokens } from "../theme";
import type { GameMode } from "../engine/types";

interface BoardCodeBarProps {
  boardCode: number;
  boardCodeInput: string;
  copied: boolean;
  gameMode: GameMode;
  onCopy: () => void;
  onInputChange: (value: string) => void;
  onLoad: () => void;
}

export default function BoardCodeBar({
  boardCode,
  boardCodeInput,
  copied,
  onCopy,
  onInputChange,
  onLoad,
}: BoardCodeBarProps) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 3, color: tokens.colors.textMuted }}>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>Board</Typography>
      <Chip
        label={`#${boardCode}`}
        onClick={onCopy}
        onDelete={onCopy}
        deleteIcon={
          <Tooltip title={copied ? "Copied!" : "Copy"}>
            <ContentCopyIcon sx={{ fontSize: 14 }} />
          </Tooltip>
        }
        variant="outlined"
        size="small"
        sx={{
          fontFamily: "monospace",
          fontSize: "0.8rem",
          borderColor: tokens.colors.bgBoardDark,
          color: tokens.colors.textMuted,
          height: 24,
        }}
      />
      <TextField
        size="small"
        placeholder="Paste code..."
        value={boardCodeInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onLoad()}
        sx={{
          width: 120,
          "& .MuiInputBase-root": { fontSize: "0.8rem", fontFamily: "monospace", height: 28 },
          "& .MuiOutlinedInput-input": { padding: "4px 8px" },
        }}
      />
      <Button
        variant="outlined"
        size="small"
        onClick={onLoad}
        sx={{
          borderColor: tokens.colors.bgBoardDark,
          color: tokens.colors.textPrimary,
          fontSize: "0.75rem",
          minWidth: 40,
          height: 28,
          padding: "0 10px",
        }}
      >
        Load
      </Button>
    </Box>
  );
}
