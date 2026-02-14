"""
Shared types and enums for the Niya solver.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import NamedTuple


# Type aliases for board representation
Tile = tuple[int, int]  # (plant_index, poem_index)
Board = list[Tile]       # 16 tiles in row-major order (index 0 = top-left)

# Position classification for board indices
CORNER_INDICES = {0, 3, 12, 15}
EDGE_INDICES = {1, 2, 4, 7, 8, 11, 13, 14}  # Non-corner edge tiles


def classify_position(idx: int) -> str:
    """Classify a board index as 'corner' or 'edge'."""
    if idx in CORNER_INDICES:
        return "corner"
    return "edge"


class Outcome(Enum):
    """
    How a game ended. Covers both win methods (how a player won)
    and non-win results (draw, skipped duplicate).
    """

    # --- Win methods (a player achieved one of these) ---
    ROW = "Row"                        # 4 tiles in a horizontal line
    COLUMN = "Column"                  # 4 tiles in a vertical line
    MAIN_DIAGONAL = "Main Diagonal"    # 4 tiles from top-left ↘ to bottom-right
    ANTI_DIAGONAL = "Anti-Diagonal"    # 4 tiles from top-right ↙ to bottom-left
    SQUARE = "Square"                  # 2×2 block of tiles
    BLOCKADE = "Blockade"              # Opponent has no legal moves

    # --- Non-win outcomes ---
    DRAW = "Draw"                      # Board filled, no winner
    DUPLICATE = "Duplicate"            # Board is a symmetry of an already-solved
                                       # board; skipped by the canonical pruning
                                       # optimization to avoid redundant work.

    @property
    def is_win(self) -> bool:
        """True if this outcome means someone won (as opposed to Draw/Duplicate)."""
        return self not in (Outcome.DRAW, Outcome.DUPLICATE)


class P2Response(NamedTuple):
    """P2's optimal response to a specific P1 opening move."""
    p1_move: int             # The P1 opening move being analyzed
    p2_best_move: int        # P2's best response move index (0-15)
    is_p1_win: bool          # True = P1 still wins, False = P2 wins
    outcome: Outcome         # How the game ends after this line of play


@dataclass
class SolveResult:
    """
    Full result of solving a board, including P1's optimal play,
    P2 response analysis, and summary statistics for heuristic derivation.
    """
    # --- P1 optimal play ---
    is_p1_win: bool | None       # True = P1 wins, False = P2 wins, None = not solved
    is_draw: bool                # Explicit draw flag (clearer than inferring from is_p1_win)
    best_move: int               # P1's best opening move index (0-15), or -1 if not solved
    outcome: Outcome             # How the game ends with optimal play
    game_depth: int              # Total moves played until the game ends (1-16)
    best_move_position: str      # "corner" or "edge"

    # --- P2 analysis summary ---
    p1_wins_count: int           # Of 12 openings, how many lead to P1 win
    p2_wins_count: int           # Of 12 openings, how many lead to P2 win
    draws_count: int             # Of 12 openings, how many lead to draw

    # --- Full P2 response data ---
    p2_responses: list[P2Response] = field(default_factory=list)

    @staticmethod
    def duplicate() -> "SolveResult":
        """Factory for non-canonical (duplicate) boards."""
        return SolveResult(
            is_p1_win=None, is_draw=False, best_move=-1,
            outcome=Outcome.DUPLICATE, game_depth=0,
            best_move_position="", p1_wins_count=0,
            p2_wins_count=0, draws_count=0, p2_responses=[],
        )
