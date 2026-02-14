import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { tokens } from "../../theme";
import RulesContent from "./RulesContent";

const Panel = styled("div")({
  background: tokens.colors.bgCard,
  borderRadius: tokens.radii.md,
  padding: "16px 20px",
  fontSize: "0.85rem",
  lineHeight: 1.6,
  color: tokens.colors.textSecondary,
  maxWidth: 500,
  fontFamily: `${tokens.fonts.body} !important`,
  "& h3": {
    fontFamily: tokens.fonts.display,
    fontSize: "1rem",
    color: tokens.colors.textPrimary,
    marginBottom: 8,
  },
  "& ol": { paddingLeft: 20 },
  "& li": { marginBottom: 4 },
});

interface RulesPanelProps {
  open: boolean;
  onToggle: () => void;
}

export default function RulesPanel({ open, onToggle }: RulesPanelProps) {
  return (
    <>
      <Button
        onClick={onToggle}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        size="small"
        sx={{ color: tokens.colors.textMuted, mt: 1, mb: 1 }}
      >
        How to Play
      </Button>
      <Collapse in={open}>
        <Panel>
          <Typography variant="h6" sx={{ fontFamily: tokens.fonts.display, color: tokens.colors.textPrimary, mb: 1 }}>
            Rules
          </Typography>
          <RulesContent />
        </Panel>
      </Collapse>
    </>
  );
}
