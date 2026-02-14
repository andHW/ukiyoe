// Board code bar — copy, paste, load board codes
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PublishIcon from "@mui/icons-material/Publish";
import { tokens } from "../../theme";
import type { GameMode } from "../../engine/types";

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
    <Box sx={{ 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      gap: 2, 
      mt: 3, 
      mb: 4,
      color: tokens.colors.textMuted 
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>Board #</Typography>
        <Chip
          label={boardCode.toString()}
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
            fontSize: "0.9rem",
            borderColor: tokens.colors.bgBoardDark,
            color: tokens.colors.textPrimary,
            height: 32,
            "& .MuiChip-label": { paddingLeft: 1.5, paddingRight: 1.5 },
          }}
        />
      </Box>

      <TextField
        size="small"
        placeholder="Load Code..."
        value={boardCodeInput}
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onLoad()}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={onLoad} edge="end" size="small">
                  <PublishIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{
          width: 180,
          "& .MuiInputBase-root": { 
              fontSize: "0.9rem", 
              fontFamily: "monospace", 
              height: 40,
              borderRadius: "20px",
              paddingRight: 1
          },
          "& .MuiOutlinedInput-input": { padding: "4px 12px" },
        }}
      />
    </Box>
  );
}
