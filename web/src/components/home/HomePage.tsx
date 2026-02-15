import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Container from "@mui/material/Container";

import AppHeader from "../layout/AppHeader";
import AppFooter from "../layout/AppFooter";
import SideSelectionDialog from "../dialogs/SideSelectionDialog";
import FallingTiles from "./FallingTiles";
import RulesContent from "../dialogs/RulesContent";
import { tokens } from "../../theme";

export default function HomePage() {
  const navigate = useNavigate();
  const [showSideDialog, setShowSideDialog] = useState(false);
  const [enableEffects, setEnableEffects] = useState(true);

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

  /* 
    Z-Index Layering Strategy for FallingTiles:
    -------------------------------------------
    The FallingTiles component uses absolute positioning with no z-index on its container to allow
    individual tiles to interleave with the HomePage UI elements. This creates a depth effect where
    some tiles fall behind buttons/text and others fall in front.

    0-5:   Base background
    5:     Falling Tiles (Layer 1) - Behind Title
    10:    AppHeader (Title)
    15:    Falling Tiles (Layer 2) - Between Title and Buttons
    20:    "2 Players" Button
    25:    Falling Tiles (Layer 3) - Between Buttons
    30:    "vs Computer" Button
    35:    Falling Tiles (Layer 4) - Between Button and Rules
    40:    Rules Section
    45:    Falling Tiles (Layer 5) - In front of Rules
    50:    AppFooter
  */

  return (
    <Box sx={{ position: "relative", minHeight: "100vh", width: "100%", overflowX: "hidden" }}>
      <FallingTiles enabled={enableEffects} />
      
      <Container maxWidth="sm" sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", alignItems: "center", py: 4 }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", gap: 4 }}>
          <Box 
            onClick={() => setEnableEffects(prev => !prev)} 
            sx={{ cursor: "pointer", position: "relative", zIndex: 10, userSelect: "none" }}
            title={enableEffects ? "Disable falling tiles" : "Enable falling tiles"}
          >
            <AppHeader />
          </Box>

          <Stack spacing={2} sx={{ width: "100%", maxWidth: 300 }}>
            <Box sx={{ position: "relative", zIndex: 20 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => handleStartGame("local")}
                sx={{
                  py: 2,
                  fontSize: "1.1rem",
                  backgroundColor: tokens.colors.accentAmber,
                  color: tokens.colors.bgPrimary,
                  "&:hover": { backgroundColor: "#d49730" },
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                👥 2 Players
              </Button>
            </Box>
            
            <Box sx={{ position: "relative", zIndex: 30 }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={() => handleStartGame("vs-ai")}
                sx={{
                  py: 2,
                  fontSize: "1.1rem",
                  backgroundColor: tokens.colors.bgBoardDark,
                  color: tokens.colors.textPrimary,
                  "&:hover": { backgroundColor: tokens.colors.textMuted },
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                🤖 vs Computer
              </Button>
            </Box>
          </Stack>

          <Box sx={{ 
            mt: 4, 
            width: "100%", 
            p: 3, 
            borderRadius: tokens.radii.lg, 
            bgcolor: tokens.colors.bgCard, 
            border: `1px solid ${tokens.colors.bgBoard}`,
            boxShadow: tokens.shadows.md,
            position: "relative", 
            zIndex: 40 
          }}>
            <Typography variant="h6" sx={{ fontFamily: tokens.fonts.display, color: tokens.colors.textPrimary, mb: 1, textAlign: "center" }}>
              How to Play
            </Typography>
            <RulesContent />
          </Box>
        </Box>

        {/* Footer zIndex lowered to 2 so all tiles (z >= 5) fall in front of it */}
        <Box sx={{ position: "relative", zIndex: 2, mt: 4 }}>
          <AppFooter />
        </Box>

        <SideSelectionDialog 
          open={showSideDialog} 
          onClose={() => setShowSideDialog(false)}
          onSelect={handleSideSelect}
        />
      </Container>
    </Box>
  );
}
