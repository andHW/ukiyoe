// Game board — 4×4 tile grid
import { styled } from "@mui/material/styles";
import type { GameState } from "../../engine/types";
import { PLAYER_EMOJI } from "../../engine/constants";
import BoardTile from "./BoardTile";
import { tokens } from "../../theme";

const Container = styled("div")({
  position: "relative",
  background: `linear-gradient(145deg, ${tokens.colors.bgBoard}, ${tokens.colors.bgBoardDark})`,
  borderRadius: tokens.radii.lg,
  padding: 10,
  boxShadow: `${tokens.shadows.lg}, inset 0 1px 0 rgba(255,255,255,0.08)`,
  flexShrink: 0,
});

const Grid = styled("div")({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: 5,
});

interface GameBoardProps {
  state: GameState;
  legalMoves: number[];
  canInteract: boolean;
  showLegalHints: boolean;
  overlapping: boolean;
  noBlur: boolean;
  simpleBirds: boolean;
  onTileClick: (index: number) => void;
}

export default function GameBoard({
  state,
  legalMoves,
  canInteract,
  showLegalHints,
  overlapping,
  noBlur,
  simpleBirds,
  onTileClick,
}: GameBoardProps) {
  const takenMask = state.p1Mask | state.p2Mask;

  return (
    <Container>
      <Grid>
        {state.board.map((tile, i) => {
          const taken = !!(takenMask & (1 << i));
          const isLegal = legalMoves.includes(i);
          const isHintable = !taken && isLegal;

          return (
            <BoardTile
              key={i}
              tile={tile}
              index={i}
              isTaken={taken}
              isP1={!!(state.p1Mask & (1 << i))}
              isP2={!!(state.p2Mask & (1 << i))}
              isWin={state.winner ? !!(state.winner.pattern & (1 << i)) : false}
              isLegalHinted={isHintable && showLegalHints}
              isLegalHidden={isHintable && !showLegalHints}
              canInteract={isHintable && canInteract}
              overlapping={overlapping}
              noBlur={noBlur}
              simpleBirds={simpleBirds}
              playerEmoji={PLAYER_EMOJI}
              onClick={onTileClick}
            />
          );
        })}
      </Grid>
    </Container>
  );
}
