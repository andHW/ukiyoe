import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Typography from "@mui/material/Typography";
import { tokens } from "../../theme";
import { PLAYER_EMOJI } from "../../engine/constants";
import { Box } from "@mui/material";

interface SideSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (aiPlayer: "p1" | "p2") => void;
}

export default function SideSelectionDialog({
  open,
  onClose,
  onSelect,
}: SideSelectionDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
            sx: {
                // bgcolor, color, borderRadius handled by theme default (mostly)
                // but this specific dialog wants explicit border and minWidth
                border: `1px solid ${tokens.colors.bgBoard}`,
                minWidth: 300,
            }
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          borderBottom: `1px solid ${tokens.colors.bgBoardDark}`,
        }}
      >
        <Box component="span" sx={{ mr: 1, fontSize: "1.2em" }}>
          ⚔️
        </Box>
        Choose Your Side
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <List>
          <ListItem disablePadding divider>
            <ListItemButton onClick={() => onSelect("p2")} sx={{ py: 3 }}>
              <ListItemIcon>
                <span style={{ fontSize: "2.5rem" }}>{PLAYER_EMOJI.p1}</span>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="h6" color={tokens.colors.textPrimary}>
                    Play as First (Sente)
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{ color: tokens.colors.textMuted }}
                  >
                    You play Red, AI plays Black
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => onSelect("p1")} sx={{ py: 3 }}>
              <ListItemIcon>
                <span style={{ fontSize: "2.5rem" }}>{PLAYER_EMOJI.p2}</span>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="h6" color={tokens.colors.textPrimary}>
                    Play as Second (Gote)
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="body2"
                    sx={{ color: tokens.colors.textMuted }}
                  >
                    AI plays Red, You play Black
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        </List>
      </DialogContent>
    </Dialog>
  );
}
