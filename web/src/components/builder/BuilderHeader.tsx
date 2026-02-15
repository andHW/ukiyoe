import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import HomeIcon from "@mui/icons-material/Home";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../theme";

interface BuilderHeaderProps {
  onClear: () => void;
  onSettings: () => void;
}

export default function BuilderHeader({ onClear, onSettings }: BuilderHeaderProps) {
  const navigate = useNavigate();

  return (
    <AppBar position="static" elevation={0} sx={{bgcolor: "transparent"}}>
      <Toolbar sx={{ px: 2, display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          <IconButton onClick={() => navigate("/")} size="medium">
            <HomeIcon />
          </IconButton>
        </Box>
        
        <Typography variant="h6" sx={{ 
          fontFamily: tokens.fonts.display, 
          color: tokens.colors.accentAmber,
          textAlign: "center",
          whiteSpace: "nowrap"
        }}>
          Board Builder
        </Typography>

        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          <IconButton onClick={onClear} size="medium" sx={{ color: tokens.colors.textSecondary }}>
            <RotateLeftIcon />
          </IconButton>
          <IconButton onClick={onSettings} size="medium">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
