"""
Utility functions for board generation, symmetry checking, and visualization.
"""

import ctypes
import math
import os
from itertools import permutations as _perms


# ---------------------------------------------------------------------------
# Load C canonicalization from solver_core.so (optional, much faster)
# ---------------------------------------------------------------------------
_c_canonicalize = None

def _load_c_canonicalize():
    global _c_canonicalize
    so_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "solver_core.so")
    try:
        lib = ctypes.CDLL(so_path)
        fn = lib.canonicalize_board_c
        fn.argtypes = [
            ctypes.POINTER(ctypes.c_int8),  # plants[16]
            ctypes.POINTER(ctypes.c_int8),  # poems[16]
            ctypes.POINTER(ctypes.c_int8),  # out_plants[16]
            ctypes.POINTER(ctypes.c_int8),  # out_poems[16]
        ]
        fn.restype = None
        _c_canonicalize = fn
    except OSError:
        pass

_load_c_canonicalize()


# Type aliases (avoiding circular import with models.py)
Tile = tuple[int, int]
Board = list[Tile]


# Precompute rotations/reflections for 4x4 grid
def get_transforms() -> list[list[int]]:
    base = list(range(16))
    rows = [base[i * 4 : (i + 1) * 4] for i in range(4)]

    def flat(r: list[list[int]]) -> list[int]:
        return [val for sublist in r for val in sublist]

    # Rotations & Reflections
    r0 = rows
    r90 = [list(reversed(col)) for col in zip(*r0)]
    r180 = [list(reversed(col)) for col in zip(*r90)]
    r270 = [list(reversed(col)) for col in zip(*r180)]
    h_ref = r0[::-1]
    v_ref = [row[::-1] for row in r0]
    d1_ref = [list(i) for i in zip(*r0)]  # Transpose
    d2_ref = [list(reversed(i)) for i in zip(*reversed(r0))]  # Anti-transpose

    transforms = [r0, r90, r180, r270, h_ref, v_ref, d1_ref, d2_ref]
    return [flat(t) for t in transforms]


TRANSFORM_MAPS: list[list[int]] = get_transforms()

# Precompute all permutations of 4 labels (used for plant/poem relabeling)
_LABEL_PERMS: list[tuple[int, ...]] = [tuple(p) for p in _perms(range(4))]


def get_permutation(pool: list[Tile], index: int) -> Board | None:
    """Fetch the Nth lexicographic permutation directly, or None if out of range."""
    n = len(pool)
    if index >= math.factorial(n):
        return None

    pool = list(pool)
    result: Board = []
    fact = math.factorial(n)

    for x in range(n, 0, -1):
        fact //= x
        k = index // fact
        result.append(pool.pop(k))
        index %= fact
    return result


def is_canonical(board_tuple: tuple[Tile, ...]) -> bool:
    """Check if this board is the lexicographically smallest among its 8 symmetries."""
    current = board_tuple
    for mapping in TRANSFORM_MAPS:
        transformed = tuple(board_tuple[i] for i in mapping)
        if transformed < current:
            return False
    return True


def canonicalize_board(board: Board) -> tuple[Tile, ...]:
    """
    Find the lexicographically smallest board among ALL equivalences:
      - 8 spatial symmetries (rotations + reflections)
      - 24 plant label permutations
      - 24 poem label permutations
      - 2 plant↔poem swap options
    Total: 8 × 24 × 24 × 2 = 9,216 equivalence transforms.

    Uses C implementation when available (~1000x faster than Python).
    """
    if _c_canonicalize is not None:
        plants = (ctypes.c_int8 * 16)(*(t[0] for t in board))
        poems  = (ctypes.c_int8 * 16)(*(t[1] for t in board))
        out_p  = (ctypes.c_int8 * 16)()
        out_s  = (ctypes.c_int8 * 16)()
        _c_canonicalize(plants, poems, out_p, out_s)
        return tuple((int(out_p[i]), int(out_s[i])) for i in range(16))

    # Pure Python fallback (slow)
    bt = tuple(board)
    best = bt

    for mapping in TRANSFORM_MAPS:
        spatial = tuple(bt[mapping[i]] for i in range(16))

        for pp in _LABEL_PERMS:
            for sp in _LABEL_PERMS:
                c = tuple((pp[t[0]], sp[t[1]]) for t in spatial)
                if c < best:
                    best = c
                c = tuple((pp[t[1]], sp[t[0]]) for t in spatial)
                if c < best:
                    best = c

    return best


def board_to_perm_index(board: tuple[Tile, ...] | Board) -> int:
    """
    Compute the lexicographic rank of a board permutation.
    Board must be a permutation of the standard 16 tiles.
    """
    pool = sorted([(p, s) for p in range(4) for s in range(4)])
    n = len(pool)
    index = 0
    available = list(pool)

    for i, tile in enumerate(board):
        k = available.index(tile)
        index += k * math.factorial(n - 1 - i)
        available.pop(k)

    return index


# --- Visualization ---

PLANTS: list[str] = ["MAPL", "CHRY", "PINE", "IRIS"]
POEMS: list[str] = ["SUN ", "BIRD", "RAIN", "FLAG"]  # Padded for alignment


def print_board(board: Board) -> None:
    """Prints the 4x4 board in a readable format."""
    print("." + "-----------------" * 4 + ".")
    for r in range(4):
        line = "| "
        for c in range(4):
            idx = r * 4 + c
            plant_idx, poem_idx = board[idx]
            plant = PLANTS[plant_idx]
            poem = POEMS[poem_idx]
            line += f"{idx:<2d} {plant}:{poem} | "
        print(line)
        print("." + "-----------------" * 4 + ".")
