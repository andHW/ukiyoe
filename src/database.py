"""
SQLite storage for solver results.

If the schema changes during development, just delete data/niya.db and re-run.
"""

import sqlite3
import os

DB_PATH = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "data", "niya.db"
)


def init_db() -> None:
    """Initialize database tables."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.execute(
        """CREATE TABLE IF NOT EXISTS solutions (
            perm_index INTEGER PRIMARY KEY,
            p1_win BOOLEAN,
            is_draw BOOLEAN,
            p1_best_move INTEGER,
            p1_outcome TEXT,
            p1_best_move_pos TEXT,
            game_depth INTEGER,
            p1_wins_count INTEGER,
            p2_wins_count INTEGER,
            draws_count INTEGER,
            has_p2_data BOOLEAN DEFAULT 0
        )"""
    )

    c.execute(
        """CREATE TABLE IF NOT EXISTS p2_responses (
            perm_index INTEGER,
            p1_move INTEGER,
            p2_best_move INTEGER,
            is_p1_win BOOLEAN,
            outcome TEXT,
            PRIMARY KEY (perm_index, p1_move),
            FOREIGN KEY (perm_index) REFERENCES solutions(perm_index)
        )"""
    )

    conn.commit()
    conn.close()


def get_solved_count() -> int:
    """Get the number of boards already solved."""
    conn = sqlite3.connect(DB_PATH)
    count = conn.execute("SELECT COUNT(*) FROM solutions").fetchone()[0]
    conn.close()
    return count


def save_batch(
    solutions: list[tuple],
    p2_responses: list[tuple],
) -> None:
    """
    Save a batch of solver results. Duplicates are silently ignored.

    Args:
        solutions: list of (perm_index, p1_win, is_draw, p1_best_move,
                            p1_outcome, p1_best_move_pos, game_depth,
                            p1_wins_count, p2_wins_count, draws_count,
                            has_p2_data)
        p2_responses: list of (perm_index, p1_move, p2_best_move, is_p1_win, outcome)
    """
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    c.executemany(
        "INSERT OR IGNORE INTO solutions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        solutions,
    )
    if p2_responses:
        c.executemany(
            "INSERT OR IGNORE INTO p2_responses VALUES (?, ?, ?, ?, ?)",
            p2_responses,
        )

    conn.commit()
    conn.close()
