"""
Niya game solver using minimax with alpha-beta pruning and transposition table.

Three implementations (selected automatically):
  - C solver        : ~50-100x faster, loaded via ctypes from solver_core.so
  - minimax()       : Python fallback (if C lib not found)
  - minimax_debug() : Verbose Python solver for development/debugging
"""

import ctypes
import os

from models import Board, Outcome, P2Response, SolveResult, classify_position
from utils import is_canonical


# ---------------------------------------------------------------------------
# C solver via ctypes (loaded once at import time)
# ---------------------------------------------------------------------------

class _CSolveResult(ctypes.Structure):
    """Mirrors the SolveResult struct in solver_core.c"""
    _fields_ = [
        ("best_move",    ctypes.c_int8),
        ("score",        ctypes.c_int8),
        ("outcome",      ctypes.c_int8),
        ("game_depth",   ctypes.c_int8),
        ("p2_moves",     ctypes.c_int8 * 12),
        ("p2_scores",    ctypes.c_int8 * 12),
        ("p2_outcomes",  ctypes.c_int8 * 12),
    ]

_c_lib = None
_c_solve = None

def _load_c_solver():
    """Attempt to load the C solver shared library."""
    global _c_lib, _c_solve
    so_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "solver_core.so")
    try:
        _c_lib = ctypes.CDLL(so_path)
        _c_solve = _c_lib.solve_board_c
        _c_solve.argtypes = [
            ctypes.POINTER(ctypes.c_int8),   # plants[16]
            ctypes.POINTER(ctypes.c_int8),   # poems[16]
            ctypes.c_int,                    # skip_p2
            ctypes.POINTER(_CSolveResult),   # out
        ]
        _c_solve.restype = None
    except OSError:
        _c_lib = None
        _c_solve = None

_load_c_solver()

# Opening indices (must match C code)
_OPENING_INDICES = (0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15)


# --- PRECOMPUTED CONSTANTS ---

# WIN_MASKS: tuple of (bitmask, outcome_index) pairs.
# Each bitmask is a 16-bit int representing a winning pattern on the 4×4 grid.
# outcome_index maps to OUTCOME_TABLE for converting back to Outcome enum.
_win_masks: list[tuple[int, int]] = []

# Outcome indices (avoid enum in hot path)
_OUT_ROW = 0
_OUT_COL = 1
_OUT_MAIN_DIAG = 2
_OUT_ANTI_DIAG = 3
_OUT_SQUARE = 4
_OUT_BLOCKADE = 5
_OUT_DRAW = 6

# Mapping from int index back to Outcome enum (used at boundary only)
OUTCOME_TABLE: tuple[Outcome, ...] = (
    Outcome.ROW,
    Outcome.COLUMN,
    Outcome.MAIN_DIAGONAL,
    Outcome.ANTI_DIAGONAL,
    Outcome.SQUARE,
    Outcome.BLOCKADE,
    Outcome.DRAW,
)

# Rows & Columns
for _i in range(4):
    _row_mask = 0
    _col_mask = 0
    for _j in range(4):
        _row_mask |= 1 << (_i * 4 + _j)
        _col_mask |= 1 << (_j * 4 + _i)
    _win_masks.append((_row_mask, _OUT_ROW))
    _win_masks.append((_col_mask, _OUT_COL))

# Diagonals
_diag1 = (1 << 0) | (1 << 5) | (1 << 10) | (1 << 15)
_diag2 = (1 << 3) | (1 << 6) | (1 << 9) | (1 << 12)
_win_masks.append((_diag1, _OUT_MAIN_DIAG))
_win_masks.append((_diag2, _OUT_ANTI_DIAG))

# 2×2 Squares
for _r in range(3):
    for _c in range(3):
        _idx = _r * 4 + _c
        _square = (1 << _idx) | (1 << (_idx + 1)) | (1 << (_idx + 4)) | (1 << (_idx + 5))
        _win_masks.append((_square, _OUT_SQUARE))

# Freeze as tuple for faster iteration in the hot loop
WIN_MASKS: tuple[tuple[int, int], ...] = tuple(_win_masks)

# Just the bitmasks (no outcome tag) for the fast win check that only needs bool
WIN_BITMASKS: tuple[int, ...] = tuple(wm for wm, _ in _win_masks)

# Edge Indices (Player 1 must start here - all non-interior cells)
# Board Layout (Indices 0-15):
#  0  1  2  3
#  4  5  6  7
#  8  9 10 11
# 12 13 14 15
OPENING_INDICES: tuple[int, ...] = (0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15)

# Scores - named from P1's perspective
P1_WINS: int = 1
P1_LOSES: int = -1
DRAW_SCORE: int = 0

# Sentinel scores (replace float('inf') — valid since real scores are in {-1, 0, 1})
_INF = 2
_NEG_INF = -2


def _check_win_outcome(mask: int) -> int:
    """Check if mask contains a winning pattern. Returns outcome index or -1."""
    for wm, out_idx in WIN_MASKS:
        if (mask & wm) == wm:
            return out_idx
    return -1


def _has_win(mask: int) -> bool:
    """Fast check: does mask contain ANY winning pattern?"""
    for wm in WIN_BITMASKS:
        if (mask & wm) == wm:
            return True
    return False


# --- Public API (used by old debug path) ---

def check_win(mask: int) -> Outcome | None:
    """
    Check if the bitmask contains any winning pattern.
    Returns the specific Outcome (Row, Column, etc.) or None if no win.
    """
    idx = _check_win_outcome(mask)
    if idx >= 0:
        return OUTCOME_TABLE[idx]
    return None


def get_legal_moves(board: Board, taken_mask: int, last_move_idx: int | None) -> list[int]:
    """
    Returns a list of valid move indices (0-15).
    """
    moves: list[int] = []

    # Case 1: First Move (Must be on Edge)
    if last_move_idx is None:
        for i in OPENING_INDICES:
            moves.append(i)
        return moves

    # Case 2: Normal Move (Must match Plant or Poem of the last tile played)
    last_tile = board[last_move_idx]
    target_plant = last_tile[0]
    target_poem = last_tile[1]

    for i in range(16):
        if not (taken_mask & (1 << i)):
            curr = board[i]
            if curr[0] == target_plant or curr[1] == target_poem:
                moves.append(i)

    return moves


# ---------------------------------------------------------------------------
# Fast production minimax — all hot-path overhead eliminated
# ---------------------------------------------------------------------------

def minimax(
    board: Board,
    p1_mask: int,
    p2_mask: int,
    last_move_idx: int,
    is_p1_turn: bool,
    alpha: int,
    beta: int,
    depth: int,
    cache: dict | None = None,
) -> tuple[int, int, int]:
    """
    Core recursive minimax solver with alpha-beta pruning.
    Returns (score, outcome_index, game_depth).
    Uses int sentinels instead of float('inf') and int outcome indices
    instead of Outcome enum.
    """
    # --- Transposition table lookup ---
    if cache is not None:
        cache_key = (p1_mask, p2_mask, last_move_idx, is_p1_turn)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
    else:
        cache_key = None

    # 1. Check if the PREVIOUS move won the game
    prev_mask = p2_mask if is_p1_turn else p1_mask
    for wm, out_idx in WIN_MASKS:
        if (prev_mask & wm) == wm:
            score = P1_LOSES if is_p1_turn else P1_WINS
            result = (score, out_idx, depth)
            if cache is not None:
                cache[cache_key] = result
            return result

    # 2. Handle full board (Draw)
    if depth == 16:
        result = (DRAW_SCORE, _OUT_DRAW, 16)
        if cache is not None:
            cache[cache_key] = result
        return result

    # 3. Get legal moves (inlined)
    taken_mask = p1_mask | p2_mask
    last_tile = board[last_move_idx]
    target_plant = last_tile[0]
    target_poem = last_tile[1]

    # Collect moves inline
    moves: list[int] = []
    for i in range(16):
        if not (taken_mask & (1 << i)):
            curr = board[i]
            if curr[0] == target_plant or curr[1] == target_poem:
                moves.append(i)

    # 4. Check Blockade
    if not moves:
        score = P1_LOSES if is_p1_turn else P1_WINS
        result = (score, _OUT_BLOCKADE, depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    # 5. Recurse
    next_depth = depth + 1

    if is_p1_turn:
        best_score = _NEG_INF
        best_out = _OUT_DRAW
        best_d = 16

        for move in moves:
            new_p1 = p1_mask | (1 << move)
            s, o, d = minimax(board, new_p1, p2_mask, move, False,
                              alpha, beta, next_depth, cache)
            if s > best_score:
                best_score = s
                best_out = o
                best_d = d
            if s > alpha:
                alpha = s
            if beta <= alpha:
                break

        result = (best_score, best_out, best_d)
        if cache is not None:
            cache[cache_key] = result
        return result

    else:
        best_score = _INF
        best_out = _OUT_DRAW
        best_d = 16

        for move in moves:
            new_p2 = p2_mask | (1 << move)
            s, o, d = minimax(board, p1_mask, new_p2, move, True,
                              alpha, beta, next_depth, cache)
            if s < best_score:
                best_score = s
                best_out = o
                best_d = d
            if s < beta:
                beta = s
            if beta <= alpha:
                break

        result = (best_score, best_out, best_d)
        if cache is not None:
            cache[cache_key] = result
        return result


# ---------------------------------------------------------------------------
# Debug minimax — verbose output, keeps Outcome enum
# ---------------------------------------------------------------------------

def minimax_debug(
    board: Board,
    p1_mask: int,
    p2_mask: int,
    last_move_idx: int,
    is_p1_turn: bool,
    alpha: float,
    beta: float,
    depth: int,
    cache: dict | None = None,
) -> tuple[int, Outcome, int]:
    """Verbose minimax for debugging. Same logic, with print statements."""
    # --- Transposition table lookup ---
    if cache is not None:
        cache_key = (p1_mask, p2_mask, last_move_idx, is_p1_turn)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached
    else:
        cache_key = None

    indent = "  " * depth
    player = "P1" if is_p1_turn else "P2"
    print(f"\n{indent}--- MINIMAX (Depth: {depth}, Player: {player}) ---")
    print(f"{indent}P1 Mask: {p1_mask:016b}")
    print(f"{indent}P2 Mask: {p2_mask:016b}")
    print(f"{indent}Alpha: {alpha}, Beta: {beta}")

    # 1. Check previous move win
    previous_player_mask = p2_mask if is_p1_turn else p1_mask
    win_outcome = check_win(previous_player_mask)
    if win_outcome is not None:
        score = P1_LOSES if is_p1_turn else P1_WINS
        print(f"{indent}==> Win found for previous player ({win_outcome.value}). Score: {score}")
        result = (score, win_outcome, depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    if depth == 16:
        print(f"{indent}==> Board is full. Score: {DRAW_SCORE}")
        result = (DRAW_SCORE, Outcome.DRAW, depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    taken_mask = p1_mask | p2_mask
    moves = get_legal_moves(board, taken_mask, last_move_idx)
    print(f"{indent}Legal moves: {moves}")

    if not moves:
        score = P1_LOSES if is_p1_turn else P1_WINS
        print(f"{indent}==> No legal moves (Blockaded). Score: {score}")
        result = (score, Outcome.BLOCKADE, depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    if is_p1_turn:
        max_eval = -float("inf")
        best_outcome = Outcome.DRAW
        best_depth = 16

        for move in moves:
            print(f"{indent}P1 exploring move: {move}")
            new_p1_mask = p1_mask | (1 << move)
            score, outcome, end_depth = minimax_debug(
                board, new_p1_mask, p2_mask, move, False,
                alpha, beta, depth + 1, cache,
            )
            if score > max_eval:
                max_eval = score
                best_outcome = outcome
                best_depth = end_depth
            alpha = max(alpha, score)
            if beta <= alpha:
                print(f"{indent}!! Beta Pruning (alpha={alpha}, beta={beta}) on move {move}")
                break

        print(f"{indent}--> P1 returns max_eval: {max_eval}, outcome: {best_outcome.value}")
        result = (max_eval, best_outcome, best_depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    else:
        min_eval = float("inf")
        best_outcome = Outcome.DRAW
        best_depth = 16

        for move in moves:
            print(f"{indent}P2 exploring move: {move}")
            new_p2_mask = p2_mask | (1 << move)
            score, outcome, end_depth = minimax_debug(
                board, p1_mask, new_p2_mask, move, True,
                alpha, beta, depth + 1, cache,
            )
            if score < min_eval:
                min_eval = score
                best_outcome = outcome
                best_depth = end_depth
            beta = min(beta, score)
            if beta <= alpha:
                print(f"{indent}!! Alpha Pruning (alpha={alpha}, beta={beta}) on move {move}")
                break

        print(f"{indent}--> P2 returns min_eval: {min_eval}, outcome: {best_outcome.value}")
        result = (min_eval, best_outcome, best_depth)
        if cache is not None:
            cache[cache_key] = result
        return result


# ---------------------------------------------------------------------------
# Public solve entry point
# ---------------------------------------------------------------------------

def solve_board(
    board: Board,
    debug: bool = False,
    skip_canonical: bool = False,
    skip_p2: bool = False,
) -> SolveResult:
    """
    Fully solve a board: find P1's best opening, optionally analyze all P2
    responses, and return enriched statistics for heuristic derivation.

    Uses the C solver when available (much faster), falls back to Python.
    Debug mode always uses the Python path for verbose output.
    """
    if not skip_canonical and not is_canonical(tuple(board)):
        return SolveResult.duplicate()

    # Use C solver for production path
    if _c_solve is not None and not debug:
        return _solve_board_c(board, skip_p2)

    # Fallback to Python
    cache: dict = {}

    if debug:
        return _solve_board_debug(board, cache, skip_p2)

    return _solve_board_python(board, cache, skip_p2)


def _solve_board_c(board: Board, skip_p2: bool) -> SolveResult:
    """Solve via the C shared library."""
    # Pack board into C arrays
    plants = (ctypes.c_int8 * 16)(*(t[0] for t in board))
    poems  = (ctypes.c_int8 * 16)(*(t[1] for t in board))
    result = _CSolveResult()

    _c_solve(plants, poems, 1 if skip_p2 else 0, ctypes.byref(result))

    best_move = int(result.best_move)
    best_score = int(result.score)
    best_outcome = OUTCOME_TABLE[int(result.outcome)]
    best_depth = int(result.game_depth)

    is_win = best_score == P1_WINS
    is_draw = best_score == DRAW_SCORE

    if skip_p2:
        p2_responses: list[P2Response] = []
        p1_wins_count = 0
        p2_wins_count = 0
        draws_count = 0
    else:
        p2_responses = []
        for oi in range(12):
            p2_move = int(result.p2_moves[oi])
            p2_score = int(result.p2_scores[oi])
            p2_out = OUTCOME_TABLE[int(result.p2_outcomes[oi])]
            p1_move = _OPENING_INDICES[oi]
            p2_responses.append(P2Response(
                p1_move=p1_move,
                p2_best_move=p2_move,
                is_p1_win=(p2_score == P1_WINS),
                outcome=p2_out,
            ))
        p1_wins_count = sum(1 for r in p2_responses if r.is_p1_win)
        draws_count = sum(1 for r in p2_responses if r.outcome == Outcome.DRAW)
        p2_wins_count = len(p2_responses) - p1_wins_count - draws_count

    return SolveResult(
        is_p1_win=is_win,
        is_draw=is_draw,
        best_move=best_move,
        outcome=best_outcome,
        game_depth=best_depth,
        best_move_position=classify_position(best_move),
        p1_wins_count=p1_wins_count,
        p2_wins_count=p2_wins_count,
        draws_count=draws_count,
        p2_responses=p2_responses,
    )


def _solve_board_python(board: Board, cache: dict, skip_p2: bool) -> SolveResult:
    """Solve using the Python minimax (fallback)."""
    alpha = _NEG_INF
    beta = _INF
    best_move = -1
    best_score = _NEG_INF
    best_out_idx = _OUT_DRAW
    best_depth = 16

    for move in OPENING_INDICES:
        p1_mask = 1 << move
        s, o, d = minimax(board, p1_mask, 0, move, False,
                          alpha, beta, 1, cache)
        if s > best_score:
            best_score = s
            best_move = move
            best_out_idx = o
            best_depth = d
        if s > alpha:
            alpha = s
        if beta <= alpha:
            break

    is_win = best_score == P1_WINS
    is_draw = best_score == DRAW_SCORE
    best_outcome = OUTCOME_TABLE[best_out_idx]

    if skip_p2:
        p2_responses: list[P2Response] = []
        p1_wins_count = 0
        p2_wins_count = 0
        draws_count = 0
    else:
        p2_responses = _analyze_p2_responses(board, cache)
        p1_wins_count = sum(1 for r in p2_responses if r.is_p1_win)
        draws_count = sum(1 for r in p2_responses if r.outcome == Outcome.DRAW)
        p2_wins_count = len(p2_responses) - p1_wins_count - draws_count

    return SolveResult(
        is_p1_win=is_win,
        is_draw=is_draw,
        best_move=best_move,
        outcome=best_outcome,
        game_depth=best_depth,
        best_move_position=classify_position(best_move),
        p1_wins_count=p1_wins_count,
        p2_wins_count=p2_wins_count,
        draws_count=draws_count,
        p2_responses=p2_responses,
    )


def _solve_board_debug(
    board: Board, cache: dict, skip_p2: bool
) -> SolveResult:
    """Debug path for solve_board — uses minimax_debug with verbose output."""
    alpha = -float("inf")
    beta = float("inf")
    best_move = -1
    best_score = -2
    best_outcome = Outcome.DRAW
    best_depth = 16

    moves = get_legal_moves(board, 0, None)
    print("--- Starting Root Search (P1) ---")
    print(f"Opening moves: {moves}")

    for move in moves:
        p1_mask = 1 << move
        print(f"\n>> P1 exploring move: {move}")

        score, outcome, end_depth = minimax_debug(
            board, p1_mask, 0, move, False, alpha, beta, 1, cache
        )

        print(f"<< P1 evaluated move {move}: (Score: {score}, Outcome: {outcome.value}, Depth: {end_depth})")

        if score > best_score:
            best_score = score
            best_move = move
            best_outcome = outcome
            best_depth = end_depth

        alpha = max(alpha, score)
        if beta <= alpha:
            print(f"!! Alpha-Beta Pruning at root (alpha={alpha}, beta={beta})")
            break

    is_win = best_score == P1_WINS
    is_draw = best_score == DRAW_SCORE

    if skip_p2:
        p2_responses: list[P2Response] = []
        p1_wins_count = 0
        p2_wins_count = 0
        draws_count = 0
    else:
        p2_responses = _analyze_p2_responses_debug(board, cache)
        p1_wins_count = sum(1 for r in p2_responses if r.is_p1_win)
        draws_count = sum(1 for r in p2_responses if r.outcome == Outcome.DRAW)
        p2_wins_count = len(p2_responses) - p1_wins_count - draws_count

    return SolveResult(
        is_p1_win=is_win,
        is_draw=is_draw,
        best_move=best_move,
        outcome=best_outcome,
        game_depth=best_depth,
        best_move_position=classify_position(best_move),
        p1_wins_count=p1_wins_count,
        p2_wins_count=p2_wins_count,
        draws_count=draws_count,
        p2_responses=p2_responses,
    )


def _analyze_p2_responses(
    board: Board, cache: dict,
) -> list[P2Response]:
    """
    For each possible P1 opening move, find P2's optimal response.
    Reuses the transposition cache from phase 1 for efficiency.
    Fast path (no debug output).
    """
    results: list[P2Response] = []

    for p1_move in OPENING_INDICES:
        p1_mask = 1 << p1_move

        # Inline legal move generation for P2
        taken_mask = p1_mask
        last_tile = board[p1_move]
        tp = last_tile[0]
        ts = last_tile[1]

        best_p2_move = -1
        best_p2_score = _INF
        best_p2_out = _OUT_DRAW

        for i in range(16):
            if not (taken_mask & (1 << i)):
                curr = board[i]
                if curr[0] == tp or curr[1] == ts:
                    p2_mask = 1 << i
                    s, o, _ = minimax(
                        board, p1_mask, p2_mask, i, True,
                        _NEG_INF, _INF, 2, cache,
                    )
                    if s < best_p2_score:
                        best_p2_score = s
                        best_p2_move = i
                        best_p2_out = o

        is_p1_win = best_p2_score == P1_WINS
        results.append(P2Response(
            p1_move=p1_move,
            p2_best_move=best_p2_move,
            is_p1_win=is_p1_win,
            outcome=OUTCOME_TABLE[best_p2_out],
        ))

    return results


def _analyze_p2_responses_debug(
    board: Board, cache: dict,
) -> list[P2Response]:
    """Debug path for P2 analysis — uses minimax_debug."""
    results: list[P2Response] = []
    p1_opening_moves = sorted(get_legal_moves(board, 0, None))

    for p1_move in p1_opening_moves:
        p1_mask = 1 << p1_move
        p2_legal = get_legal_moves(board, p1_mask, p1_move)

        best_p2_move = -1
        best_p2_score = float("inf")
        best_p2_outcome = Outcome.DRAW

        for p2_move in p2_legal:
            p2_mask = 1 << p2_move
            score, outcome, _ = minimax_debug(
                board, p1_mask, p2_mask, p2_move, True,
                -float("inf"), float("inf"), 2, cache,
            )

            if score < best_p2_score:
                best_p2_score = score
                best_p2_move = p2_move
                best_p2_outcome = outcome

        is_p1_win = best_p2_score == P1_WINS
        results.append(P2Response(
            p1_move=p1_move,
            p2_best_move=best_p2_move,
            is_p1_win=is_p1_win,
            outcome=best_p2_outcome,
        ))

    return results
