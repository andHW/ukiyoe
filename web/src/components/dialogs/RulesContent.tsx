import Box from "@mui/material/Box";
import { tokens } from "../../theme";

export default function RulesContent() {
  return (
    <Box component="ol" sx={{ pl: 2, m: 0, color: tokens.colors.textMuted, fontSize: "0.9rem", lineHeight: 1.6 }}>
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
  );
}
