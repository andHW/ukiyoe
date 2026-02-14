"""
Niya batch solver - randomly samples boards across the permutation space.

Uses label equivalence canonicalization: boards that differ only by
plant/poem label permutations, spatial symmetry, or plant↔poem swap are
treated as identical. This reduces the search space from 16! (~20.9T) to
~2.3 billion unique equivalence classes.

Usage:
    python src/main.py              # Solve with P2 analysis (slower, full data)
    python src/main.py --skip-p2    # Solve P1 only (faster, no P2 data)
    python src/main.py --workers 8  # Use 8 parallel workers
"""

import argparse
import math
import os
import random
import signal
import time
from concurrent.futures import ProcessPoolExecutor, as_completed

from tqdm import tqdm
from utils import canonicalize_board, board_to_perm_index
from database import init_db, get_solved_count, save_batch
from solver import solve_board
from models import Outcome, Tile

# Constants
TILES: list[Tile] = [(p, s) for p in range(4) for s in range(4)]  # 16 tiles


def _worker_init() -> None:
    """
    Initialize worker process:
    1. Ignore SIGINT so only the main process handles Ctrl+C.
    2. Re-seed random to avoid duplicate sequences.
    """
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    random.seed(os.getpid() ^ int(time.monotonic_ns()))


def solve_one(skip_p2: bool) -> tuple[list[tuple], list[tuple]]:
    """
    Generate a random board, canonicalize it, and solve.
    Returns (solution_rows, p2_rows).
    Every call produces a solvable canonical board (no wasted samples).
    """
    # Generate random board and canonicalize
    board = list(TILES)
    random.shuffle(board)
    canonical = canonicalize_board(board)
    perm_index = board_to_perm_index(canonical)

    # Solve (skip_canonical=True since we already canonicalized)
    result = solve_board(list(canonical), skip_canonical=True, skip_p2=skip_p2)

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


def format_eta(seconds: float) -> str:
    """Format seconds into a human-readable days/hours/minutes string."""
    if seconds <= 0 or not math.isfinite(seconds):
        return "--"
    days, rem = divmod(int(seconds), 86400)
    hours, rem = divmod(rem, 3600)
    minutes, _ = divmod(rem, 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    parts.append(f"{minutes}m")
    return " ".join(parts)


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
        help="Number of boards to solve per DB save (default: 10).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=os.cpu_count(),
        help="Number of parallel worker processes (default: CPU count).",
    )
    parser.add_argument(
        "--target",
        type=int,
        default=None,
        help="Target number of boards to solve (enables ETA display).",
    )
    args = parser.parse_args()

    init_db()
    solved_count = get_solved_count()

    mode = "P1 only (fast)" if args.skip_p2 else "P1 + P2 analysis"
    print(f"[*] Niya Solver - {mode}")
    print(f"[*] Workers: {args.workers}")
    if args.target:
        print(f"[*] Target: {args.target:,} boards")
    if solved_count:
        print(f"[*] Resuming with {solved_count:,} boards from previous runs")
    print(f"[*] Sampling random boards... (Ctrl+C to stop)\n")

    total = (solved_count + args.target) if args.target else None
    pbar = tqdm(initial=solved_count, total=total, unit=" boards", desc="Solved")
    start_time = time.monotonic()
    new_solved = 0

    try:
        with ProcessPoolExecutor(
            max_workers=args.workers,
            initializer=_worker_init,
        ) as pool:
            while True:
                # Submit a batch of work to the pool
                futures = {
                    pool.submit(solve_one, args.skip_p2)
                    for _ in range(args.batch_size)
                }

                # Collect results as they complete
                batch_solutions: list[tuple] = []
                batch_p2: list[tuple] = []

                for future in as_completed(futures):
                    sol_rows, p2_rows = future.result()
                    if sol_rows:
                        batch_solutions.extend(sol_rows)
                        batch_p2.extend(p2_rows)
                        new_solved += 1
                        pbar.update(1)

                # Update ETA in postfix
                elapsed = time.monotonic() - start_time
                if new_solved > 0 and args.target:
                    rate = new_solved / elapsed
                    remaining = args.target - new_solved
                    eta_secs = remaining / rate
                    pbar.set_postfix_str(f"ETA: {format_eta(eta_secs)}")

                # Save the batch
                if batch_solutions:
                    save_batch(batch_solutions, batch_p2)

                # Stop if target reached
                if args.target and new_solved >= args.target:
                    break

    except KeyboardInterrupt:
        # Shut down pool without noisy worker tracebacks
        pool.shutdown(wait=False, cancel_futures=True)
        pbar.close()
        print(f"\n[*] Stopped. Total boards solved: {get_solved_count():,}")


if __name__ == "__main__":
    main()

