// AI thinking indicator with animated dots
import { styled, keyframes } from "@mui/material/styles";
import { tokens } from "../theme";

const dotPulse = keyframes`
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
`;

const Root = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: "0.9rem",
  color: tokens.colors.accentAmber,
  fontFamily: tokens.fonts.display,
});

const Dots = styled("span")({
  display: "inline-flex",
  gap: 3,
  "& span": {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: tokens.colors.accentAmber,
    animation: `${dotPulse} 1.4s infinite`,
  },
  "& span:nth-of-type(2)": { animationDelay: "0.2s" },
  "& span:nth-of-type(3)": { animationDelay: "0.4s" },
});

export default function ThinkingIndicator() {
  return (
    <Root>
      🤖 Thinking
      <Dots>
        <span />
        <span />
        <span />
      </Dots>
    </Root>
  );
}
