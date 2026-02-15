import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";

import { tokens } from "../../theme";
import SettingsDialog from "../dialogs/SettingsDialog";
import BoardTile from "../game/BoardTile";
import { useBoardBuilder, STEPS } from "../../hooks/useBoardBuilder";
import BuilderHeader from "./BuilderHeader";
import StepToolbar from "./StepToolbar";
import BuilderGrid from "./BuilderGrid";
import BuilderActions from "./BuilderActions";

export default function BoardBuilder() {
  const {
    board,
    activeStep,
    activeStepIndex,
    setActiveStepIndex,
    currentCount,
    isValidBoard,
    canAutoFillActiveStep,
    errorTileIndex,
    conflictingTile,
    snackbarOpen,
    clearDialogOpen,
    showSettingsDialog,
    settings,
    setShowSettingsDialog,
    handleTileClick,
    handleFinish,
    handleAutoFillActiveStep,
    handleClearClick,
    handleClearConfirm,
    handleClearCancel,
    handleSnackbarClose,
    updateSetting,
    getCountForStep,
  } = useBoardBuilder();

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      pb: 4
    }}>
      <BuilderHeader 
        onClear={handleClearClick} 
        onSettings={() => setShowSettingsDialog(true)} 
      />

      <Container maxWidth="sm" sx={{ flex: 1, display: "flex", flexDirection: "column", py: 3, gap: 3 }}>
        
        <StepToolbar 
          steps={STEPS}
          activeStepIndex={activeStepIndex}
          currentCount={currentCount}
          onStepClick={setActiveStepIndex}
          getCountForStep={getCountForStep}
        />

        <BuilderGrid 
          board={board}
          activeStep={activeStep}
          currentCount={currentCount}
          errorTileIndex={errorTileIndex}
          settings={settings}
          onTileClick={handleTileClick}
        />

        <BuilderActions 
          activeStep={activeStep}
          currentCount={currentCount}
          canAutoFill={canAutoFillActiveStep}
          isValidBoard={isValidBoard}
          onAutoFill={handleAutoFillActiveStep}
          onFinish={handleFinish}
        />

      </Container>

      <SettingsDialog
        open={showSettingsDialog}
        settings={settings}
        onUpdate={(key, value) => updateSetting(key, value)}
        onClose={() => setShowSettingsDialog(false)}
        hiddenKeys={['showLegalHints', 'showLastTakenOnly']}
      />

      {/* Clear Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={handleClearCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
            sx: { borderRadius: tokens.radii.lg, bgcolor: tokens.colors.bgCard }
        }}
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: tokens.colors.textPrimary, fontFamily: tokens.fonts.display }}>
          {"Clear entire board?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description" sx={{ color: tokens.colors.textSecondary }}>
            This will remove all placed tiles and reset your progress to the beginning.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClearCancel} sx={{ color: tokens.colors.textSecondary }}>Cancel</Button>
          <Button onClick={handleClearConfirm} color="error" variant="contained" autoFocus>
            Clear Board
          </Button>
        </DialogActions>
      </Dialog>

      {/* Duplicate Warning Snackbar */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={4000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity="warning" variant="filled" 
               sx={{ width: '100%', alignItems: "center", bgcolor: "#d32f2f", color: "white" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
             <Typography variant="body2" sx={{ fontWeight: 600 }}>
               Duplicate:
             </Typography>
             
             {conflictingTile && (
                <Box sx={{ width: 42, height: 42, flexShrink: 0, overflow: "hidden" }}>
                   <BoardTile 
                      tile={conflictingTile} 
                      simpleBirds={settings.simpleBirds}
                      overlapping={settings.overlappingTiles}
                      canInteract={false}
                      sx={{ minWidth: 0, width: "100%", height: "100%" }} // Force size
                   />
                </Box>
             )}
             
             <Typography variant="body2">
               Remove original first!
             </Typography>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}
