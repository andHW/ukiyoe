import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import PersonIcon from "@mui/icons-material/Person";
import SmartToyIcon from "@mui/icons-material/SmartToy";

import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";
import { tokens } from "../theme";

// Rules text content for the home page
const RULES_TEXT = [
  "1. Lay any tile on the 4x4 grid.",
  "2. Your opponent must play a tile that shares a symbol (sun/bird, rain/iris, etc.) with the one you just played.",
  "3. If there are no legal moves, the player whose turn it is loses immediately.",
  "4. Win by:",
  "   • Getting 4 tiles in a row (horizontal, vertical, or diagonal).",
  "   • Arranging your tiles in a 2x2 square.",
];

export default function HomePage() {
  const navigate = useNavigate();
  const [showSideDialog, setShowSideDialog] = useState(false);

  const handleStartGame = (mode: "local" | "vs-ai") => {
    if (mode === "vs-ai") {
      setShowSideDialog(true);
    } else {
      navigate(`/play?mode=${mode}`);
    }
  };

  const handleSideSelect = (aiPlayer: "p1" | "p2") => {
    // If AI is p2, User is p1 (First)
    // If AI is p1, User is p2 (Second)
    navigate(`/play?mode=vs-ai&ai=${aiPlayer}`);
    setShowSideDialog(false);
  };

  return (
    <Container maxWidth="sm" sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", alignItems: "center", py: 4 }}>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 4 }}>
        <AppHeader />

        <Stack spacing={2} sx={{ width: "100%", maxWidth: 300 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => handleStartGame("local")}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              backgroundColor: tokens.colors.accentAmber,
              color: tokens.colors.bgPrimary,
              "&:hover": { backgroundColor: "#d49730" },
            }}
          >
            👥 2 Players
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => handleStartGame("vs-ai")}
            sx={{
              py: 2,
              fontSize: "1.1rem",
              backgroundColor: tokens.colors.bgBoardDark,
              color: tokens.colors.textPrimary,
              "&:hover": { backgroundColor: tokens.colors.textMuted },
            }}
          >
            🤖 vs Computer
          </Button>
        </Stack>

        <Box sx={{ mt: 4, width: "100%", p: 3, borderRadius: 2, bgcolor: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)" }}>
          <Typography variant="h6" gutterBottom sx={{ color: tokens.colors.textPrimary, textAlign: "center", mb: 3 }}>
            How to Play
          </Typography>
          <Stack spacing={1.5}>
            {RULES_TEXT.map((rule, index) => (
              <Typography key={index} variant="body2" sx={{ color: tokens.colors.textMuted }}>
                {rule}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Box>

      <AppFooter />

      {/* Side Selection Dialog */}
      <Dialog 
        open={showSideDialog} 
        onClose={() => setShowSideDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: tokens.colors.bgSecondary,
            color: tokens.colors.textPrimary,
            borderRadius: tokens.radii.lg,
            border: `1px solid ${tokens.colors.bgBoard}`,
            minWidth: 300
          }
        }}
      >
        <DialogTitle sx={{ textAlign: "center", borderBottom: `1px solid ${tokens.colors.bgBoardDark}` }}>
          Choose Your Side
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <List>
            <ListItem disablePadding divider>
              <ListItemButton onClick={() => handleSideSelect("p2")} sx={{ py: 3 }}>
                <ListItemIcon>
                   <PersonIcon sx={{ color: tokens.colors.p1Color, fontSize: 32 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Play as First (Sente)" 
                  secondary="You play Red, AI plays Black"
                  primaryTypographyProps={{ variant: "h6", color: tokens.colors.textPrimary }}
                  secondaryTypographyProps={{ sx: { color: tokens.colors.textMuted } }}
                />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => handleSideSelect("p1")} sx={{ py: 3 }}>
                <ListItemIcon>
                   <SmartToyIcon sx={{ color: tokens.colors.p2Color, fontSize: 32 }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Play as Second (Gote)" 
                  secondary="AI plays Red, You play Black"
                  primaryTypographyProps={{ variant: "h6", color: tokens.colors.textPrimary }}
                  secondaryTypographyProps={{ sx: { color: tokens.colors.textMuted } }}
                />
              </ListItemButton>
            </ListItem>
          </List>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
