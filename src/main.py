"""
Niya batch solver — randomly samples boards across the permutation space.

Usage:
    python src/main.py              # Solve with P2 analysis (slower, full data)
    python src/main.py --skip-p2    # Solve P1 only (faster, no P2 data)
"""

import argparse
import math
import random

from tqdm import tqdm
from utils import get_permutation
from database import init_db, get_solved_count, save_batch
from solver import solve_board
from models import Outcome, Tile

# Constants
TILES: list[Tile] = [(p, s) for p in range(4) for s in range(4)]  # 16 tiles
TOTAL_PERMS: int = math.factorial(16)  # 20,922,789,888,000


def solve_one(perm_index: int, skip_p2: bool) -> tuple[list[tuple], list[tuple]]:
    """
    Solve a single board and return DB-ready rows.
    Returns (solution_rows, p2_rows) — each may be empty if board is a duplicate.
    """
    board = get_permutation(TILES, perm_index)
    if not board:
        return [], []

    result = solve_board(board, skip_p2=skip_p2)

    if result.outcome == Outcome.DUPLICATE:
        return [], []

    has_p2 = not skip_p2 and len(result.p2_responses) > 0

    solution_row = [(
        perm_index,
        result.is_p1_win,
        result.is_draw,
        result.best_move,
        result.outcome.value,
        result.best_move_position,
        result.game_depth,
        result.p1_wins_count,
        result.p2_wins_count,
        result.draws_count,
        has_p2,
    )]

    p2_rows = []
    if has_p2:
        for resp in result.p2_responses:
            p2_rows.append((
                perm_index,
                resp.p1_move,
                resp.p2_best_move,
                resp.is_p1_win,
                resp.outcome.value,
            ))

    return solution_row, p2_rows


def main() -> None:
    parser = argparse.ArgumentParser(description="Niya batch solver.")
    parser.add_argument(
        "--skip-p2",
        action="store_true",
        help="Skip P2 analysis for faster solving (P1 results only).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=10,
        help="Number of canonical boards per DB save (default: 10).",
    )
    args = parser.parse_args()

    init_db()
    solved_count = get_solved_count()

    mode = "P1 only (fast)" if args.skip_p2 else "P1 + P2 analysis"
    print(f"[*] Niya Solver — {mode}")
    if solved_count:
        print(f"[*] Resuming with {solved_count:,} boards from previous runs")
    print(f"[*] Sampling random boards... (Ctrl+C to stop)\n")

    pbar = tqdm(initial=solved_count, unit=" boards", desc="Solved")
    batch_solutions: list[tuple] = []
    batch_p2: list[tuple] = []
    canonical_in_batch = 0

    try:
        while True:
            perm_index = random.randint(0, TOTAL_PERMS - 1)
            sol_rows, p2_rows = solve_one(perm_index, args.skip_p2)

            if sol_rows:
                batch_solutions.extend(sol_rows)
                batch_p2.extend(p2_rows)
                canonical_in_batch += 1
                pbar.update(1)

            # Save when batch is full
            if canonical_in_batch >= args.batch_size:
                save_batch(batch_solutions, batch_p2)
                batch_solutions.clear()
                batch_p2.clear()
                canonical_in_batch = 0

    except KeyboardInterrupt:
        # Save any remaining results
        if batch_solutions:
            save_batch(batch_solutions, batch_p2)
        pbar.close()
        print(f"\n[*] Stopped. Total boards solved: {get_solved_count():,}")


if __name__ == "__main__":
    main()
