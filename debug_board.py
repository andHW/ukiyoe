import random
import argparse
import sys
import os
import time

sys.path.append(os.path.join(os.path.dirname(__file__), "src"))
from utils import get_permutation, print_board, is_canonical, PLANTS, POEMS, Board
from solver import solve_board
from models import Outcome, SolveResult

# Constants
TILES = [(p, s) for p in range(4) for s in range(4)]


def print_board_with_highlight(board: Board, highlight_idx: int) -> None:
    """Prints the 4x4 board with the best move highlighted using > < markers."""
    print("." + "-----------------" * 4 + ".")
    for r in range(4):
        line = "| "
        for c in range(4):
            idx = r * 4 + c
            plant_idx, poem_idx = board[idx]
            plant = PLANTS[plant_idx]
            poem = POEMS[poem_idx]
            if idx == highlight_idx:
                line += f">{idx:<2d} {plant}:{poem}< | "
            else:
                line += f" {idx:<2d} {plant}:{poem}  | "
        print(line)
        print("." + "-----------------" * 4 + ".")


def print_result(result: SolveResult, elapsed: float) -> None:
    """Print the P1 result with P2 summary."""
    print("\n" + "=" * 18 + " P1 RESULT " + "=" * 18)
    print(f"  - P1 Win:      {result.is_p1_win}")
    print(f"  - Best Move:   {result.best_move} ({result.best_move_position})")
    print(f"  - Outcome:     {result.outcome.value}")
    print(f"  - Game Depth:  {result.game_depth} moves")
    print(f"  - Solve Time:  {elapsed:.3f}s")
    print()
    print(f"  P2 Analysis Summary:")
    total = result.p1_wins_count + result.p2_wins_count + result.draws_count
    print(f"    P1 wins {result.p1_wins_count}/{total} openings | "
          f"P2 wins {result.p2_wins_count}/{total} | "
          f"Draws {result.draws_count}/{total}")
    print("=" * 47)


def print_p2_table(result: SolveResult) -> None:
    """Print the full P2 response table."""
    print("\n" + "=" * 18 + " P2 RESPONSES " + "=" * 18)
    print(f"  {'P1 Opens':<10} {'P2 Responds':<13} {'Winner':<8} {'Outcome'}")
    print("  " + "-" * 45)

    for resp in result.p2_responses:
        if resp.outcome == Outcome.DRAW:
            winner = "Draw"
        elif resp.is_p1_win:
            winner = "P1"
        else:
            winner = "P2"

        print(f"  Move {resp.p1_move:<5} → Move {resp.p2_best_move:<7} {winner:<8} {resp.outcome.value}")

    print("  " + "-" * 45)
    print(f"  P1 wins {result.p1_wins_count} | P2 wins {result.p2_wins_count} | Draws {result.draws_count}")
    print("=" * 50)


def main(perm_index: int | None, explore_canonical: bool, verbose: bool) -> None:
    """
    Debugs the solver for a single board permutation.
    """
    if perm_index is None:
        perm_index = random.randint(0, 20_922_789_888_000)

    print(f"[*] Debugging with permutation index: {perm_index:,}")

    board = get_permutation(TILES, perm_index)
    if not board:
        print("[!] Invalid permutation index.")
        return

    # If exploring, find the next canonical board
    if explore_canonical:
        print("[*] Searching for the next canonical board...")

        while not is_canonical(tuple(board)):
            perm_index += 1
            board = get_permutation(TILES, perm_index)
        print(f"[*] Found canonical board at index: {perm_index:,}")

    print("\n" + "=" * 20 + " BOARD " + "=" * 20)
    print_board(board)
    print("=" * 47)

    # --- Solve ---
    print("\n[*] Solving...")
    start_time = time.perf_counter()
    result = solve_board(board, debug=verbose, skip_canonical=True)
    elapsed = time.perf_counter() - start_time

    # --- Display results ---
    print_result(result, elapsed)

    if result.best_move >= 0:
        print("\n" + "=" * 17 + " BEST MOVE HIGHLIGHTED " + "=" * 17)
        print_board_with_highlight(board, result.best_move)
        print("=" * 57)

    print_p2_table(result)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the Niya solver on a single board for debugging."
    )
    parser.add_argument(
        "perm_index",
        type=int,
        nargs="?",
        default=None,
        help="The specific permutation index to solve. Uses a random index if not provided.",
    )
    parser.add_argument(
        "--find-canonical",
        action="store_true",
        help="If set, starts searching from the perm_index for the next canonical board to solve.",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="If set, prints the full minimax debug trace.",
    )
    args = parser.parse_args()

    main(args.perm_index, args.find_canonical, args.verbose)
