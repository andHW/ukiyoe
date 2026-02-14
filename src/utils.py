"""
Utility functions for board generation, symmetry checking, and visualization.
"""

import math


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


# --- Visualization ---

PLANTS: list[str] = ["MAPL", "CHRY", "PINE", "IRIS"]
POEMS: list[str] = ["SUN ", "BIRD", "RAIN", "CLD "]  # Padded for alignment


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
