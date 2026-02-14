// Rules panel — collapsible how-to-play
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { tokens } from "../../theme";

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
          <Box component="ol" sx={{ pl: 2, m: 0, color: tokens.colors.textSecondary, fontSize: "0.9rem", lineHeight: 1.6 }}>
            <li>The board is a 4×4 grid of unique tiles, each with a <strong>Plant</strong> and a <strong>Poem</strong>.</li>
            <li>
              <strong>Plants:</strong> Maple 🍁, Cherry 🌸, Pine 🌲, Iris 🪻<br />
              <strong>Poems:</strong> Rising Sun ☀️, Bird (🕊️/🦜/🦩/🐦), Rain Cloud 🌧️, Poem Flag 🏮<br />
              <em>(All bird variants count as the same "Bird" element)</em>
            </li>
            <li>Player 1 starts by placing a token on any <strong>edge tile</strong>.</li>
            <li>Each subsequent move must match the <strong>Plant or Poem</strong> of the last tile played.</li>
            <li>
              Win by completing:
              <Box component="ul" sx={{ pl: 2, my: 0.5 }}>
                <li>A <strong>row</strong>, <strong>column</strong>, or <strong>diagonal</strong> of 4 tokens</li>
                <li>A <strong>2×2 square</strong> of tokens</li>
                <li>A <strong>blockade</strong> — your opponent has no legal moves</li>
              </Box>
            </li>
            <li>If all tiles are placed with no winner, it's a <strong>draw</strong>.</li>
          </Box>
        </Panel>
      </Collapse>
    </>
  );
}
