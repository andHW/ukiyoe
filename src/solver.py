"""
Niya game solver using minimax with alpha-beta pruning and transposition table.
"""

from models import Board, Outcome, P2Response, SolveResult, classify_position
from utils import is_canonical


# --- PRECOMPUTED CONSTANTS ---

# WIN_MASKS: tuple of (bitmask, Outcome) pairs.
# Each bitmask is a 16-bit int representing a winning pattern on the 4×4 grid.
# The Outcome tag tells us HOW the player won (Row, Column, Diagonal, Square).
_win_masks: list[tuple[int, Outcome]] = []

# Rows & Columns
for _i in range(4):
    _row_mask = 0
    _col_mask = 0
    for _j in range(4):
        _row_mask |= 1 << (_i * 4 + _j)
        _col_mask |= 1 << (_j * 4 + _i)
    _win_masks.append((_row_mask, Outcome.ROW))
    _win_masks.append((_col_mask, Outcome.COLUMN))

# Diagonals
_diag1 = (1 << 0) | (1 << 5) | (1 << 10) | (1 << 15)   # ↘ top-left to bottom-right
_diag2 = (1 << 3) | (1 << 6) | (1 << 9) | (1 << 12)     # ↙ top-right to bottom-left
_win_masks.append((_diag1, Outcome.MAIN_DIAGONAL))
_win_masks.append((_diag2, Outcome.ANTI_DIAGONAL))

# 2×2 Squares
for _r in range(3):
    for _c in range(3):
        _idx = _r * 4 + _c
        _square = (1 << _idx) | (1 << (_idx + 1)) | (1 << (_idx + 4)) | (1 << (_idx + 5))
        _win_masks.append((_square, Outcome.SQUARE))

# Freeze as tuple for faster iteration in the hot loop
WIN_MASKS: tuple[tuple[int, Outcome], ...] = tuple(_win_masks)

# Edge Indices (Player 1 must start here — all non-interior cells)
OPENING_INDICES: set[int] = {0, 1, 2, 3, 4, 7, 8, 11, 12, 13, 14, 15}

# Scores — named from P1's perspective
P1_WINS: int = 1
P1_LOSES: int = -1
DRAW_SCORE: int = 0


def check_win(mask: int) -> Outcome | None:
    """
    Check if the bitmask contains any winning pattern.
    Returns the specific Outcome (Row, Column, etc.) or None if no win.
    """
    for wm, outcome in WIN_MASKS:
        if (mask & wm) == wm:
            return outcome
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


def minimax(
    board: Board,
    p1_mask: int,
    p2_mask: int,
    last_move_idx: int,
    is_p1_turn: bool,
    alpha: float,
    beta: float,
    depth: int,
    debug: bool = False,
    cache: dict | None = None,
) -> tuple[int, Outcome, int]:
    """
    Core recursive minimax solver with alpha-beta pruning.

    Returns:
        (score, outcome, game_depth): score from P1's perspective, the Outcome
        describing how the game ends, and the depth at which it ends.
    """
    # --- Transposition table lookup ---
    cache_key = None
    if cache is not None:
        cache_key = (p1_mask, p2_mask, last_move_idx, is_p1_turn)
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

    indent = "  " * depth

    if debug:
        player = "P1" if is_p1_turn else "P2"
        print(f"\n{indent}--- MINIMAX (Depth: {depth}, Player: {player}) ---")
        print(f"{indent}P1 Mask: {p1_mask:016b}")
        print(f"{indent}P2 Mask: {p2_mask:016b}")
        print(f"{indent}Alpha: {alpha}, Beta: {beta}")

    # 1. Check if the PREVIOUS move won the game
    previous_player_mask = p2_mask if is_p1_turn else p1_mask
    win_outcome = check_win(previous_player_mask)
    if win_outcome is not None:
        # Previous player completed a winning pattern → current player loses
        score = P1_LOSES if is_p1_turn else P1_WINS
        if debug:
            print(f"{indent}==> Win found for previous player ({win_outcome.value}). Score: {score}")
        result = (score, win_outcome, depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    # Handle full board (Draw)
    if depth == 16:
        if debug:
            print(f"{indent}==> Board is full. Score: {DRAW_SCORE}")
        result = (DRAW_SCORE, Outcome.DRAW, depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    # 2. Get Legal Moves
    taken_mask = p1_mask | p2_mask
    moves = get_legal_moves(board, taken_mask, last_move_idx)

    if debug:
        print(f"{indent}Legal moves: {moves}")

    # 3. Check Blockade (No legal moves = current player is blocked, opponent wins)
    if not moves:
        score = P1_LOSES if is_p1_turn else P1_WINS
        if debug:
            print(f"{indent}==> No legal moves (Blockaded). Score: {score}")
        result = (score, Outcome.BLOCKADE, depth)
        if cache is not None:
            cache[cache_key] = result
        return result

    # 4. Recursion
    if is_p1_turn:
        max_eval = -float("inf")
        best_outcome = Outcome.DRAW
        best_depth = 16

        for move in moves:
            if debug:
                print(f"{indent}P1 exploring move: {move}")
            new_p1_mask = p1_mask | (1 << move)

            score, outcome, end_depth = minimax(
                board, new_p1_mask, p2_mask, move, False,
                alpha, beta, depth + 1, debug, cache,
            )

            if score > max_eval:
                max_eval = score
                best_outcome = outcome
                best_depth = end_depth

            alpha = max(alpha, score)
            if beta <= alpha:
                if debug:
                    print(f"{indent}!! Beta Pruning (alpha={alpha}, beta={beta}) on move {move}")
                break

        if debug:
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
            if debug:
                print(f"{indent}P2 exploring move: {move}")
            new_p2_mask = p2_mask | (1 << move)

            score, outcome, end_depth = minimax(
                board, p1_mask, new_p2_mask, move, True,
                alpha, beta, depth + 1, debug, cache,
            )

            if score < min_eval:
                min_eval = score
                best_outcome = outcome
                best_depth = end_depth

            beta = min(beta, score)
            if beta <= alpha:
                if debug:
                    print(f"{indent}!! Alpha Pruning (alpha={alpha}, beta={beta}) on move {move}")
                break

        if debug:
            print(f"{indent}--> P2 returns min_eval: {min_eval}, outcome: {best_outcome.value}")
        result = (min_eval, best_outcome, best_depth)
        if cache is not None:
            cache[cache_key] = result
        return result


def solve_board(
    board: Board,
    debug: bool = False,
    skip_canonical: bool = False,
    skip_p2: bool = False,
) -> SolveResult:
    """
    Fully solve a board: find P1's best opening, optionally analyze all P2
    responses, and return enriched statistics for heuristic derivation.

    Args:
        skip_p2: If True, skip P2 analysis for faster solving. The P2 fields
                 in SolveResult will be zeroed out.
    """
    if not skip_canonical and not is_canonical(tuple(board)):
        return SolveResult.duplicate()

    cache: dict = {}

    # --- Phase 1: Find P1's optimal opening move ---
    alpha = -float("inf")
    beta = float("inf")
    best_move = -1
    best_score = -2
    best_outcome = Outcome.DRAW
    best_depth = 16

    moves = get_legal_moves(board, 0, None)

    if debug:
        print("--- Starting Root Search (P1) ---")
        print(f"Opening moves: {moves}")

    for move in moves:
        p1_mask = 1 << move

        if debug:
            print(f"\n>> P1 exploring move: {move}")

        score, outcome, end_depth = minimax(
            board, p1_mask, 0, move, False, alpha, beta, 1, debug, cache
        )

        if debug:
            print(f"<< P1 evaluated move {move}: (Score: {score}, Outcome: {outcome.value}, Depth: {end_depth})")

        if score > best_score:
            best_score = score
            best_move = move
            best_outcome = outcome
            best_depth = end_depth

        alpha = max(alpha, score)
        if beta <= alpha:
            if debug:
                print(f"!! Alpha-Beta Pruning at root (alpha={alpha}, beta={beta})")
            break

    is_win = best_score == P1_WINS
    is_draw = best_score == DRAW_SCORE

    # --- Phase 2: P2 analysis (optional) ---
    if skip_p2:
        p2_responses: list[P2Response] = []
        p1_wins_count = 0
        p2_wins_count = 0
        draws_count = 0
    else:
        p2_responses = _analyze_p2_responses(board, cache, debug)
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
    board: Board, cache: dict, debug: bool = False
) -> list[P2Response]:
    """
    For each possible P1 opening move, find P2's optimal response.
    Reuses the transposition cache from phase 1 for efficiency.
    """
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
            score, outcome, _ = minimax(
                board, p1_mask, p2_mask, p2_move, True,
                -float("inf"), float("inf"), 2, debug, cache,
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
