"""
Run heuristic queries against the Niya solver database and display formatted results.

Usage:
    python analyze.py              # Run all queries
    python analyze.py --query 3    # Run a specific query by number
    python analyze.py --list       # List available queries
"""

import sqlite3
import argparse
import sys
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "niya.db")

# Each query: (title, description, sql)
QUERIES: list[tuple[str, str, str]] = [
    (
        "Game Balance",
        "Overall P1 win % vs P2 win % vs draw %",
        """
        SELECT
            SUM(CASE WHEN p1_win = 1 THEN 1 ELSE 0 END) AS p1_wins,
            SUM(CASE WHEN is_draw = 1 THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN p1_win = 0 AND is_draw = 0 THEN 1 ELSE 0 END) AS p2_wins,
            COUNT(*) AS total,
            ROUND(100.0 * SUM(CASE WHEN p1_win = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS p1_win_pct,
            ROUND(100.0 * SUM(CASE WHEN is_draw = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS draw_pct,
            ROUND(100.0 * SUM(CASE WHEN p1_win = 0 AND is_draw = 0 THEN 1 ELSE 0 END) / COUNT(*), 2) AS p2_win_pct
        FROM solutions
        """,
    ),
    (
        "First-Mover Advantage",
        "How often P1 dominates all openings vs contested boards (P2 data only)",
        """
        WITH categories(board_type, sort_order) AS (
            VALUES
                ('P1 dominates all openings', 1),
                ('P2 dominates all openings', 2),
                ('All draws', 3),
                ('Mixed (contested)', 4)
        ),
        classified AS (
            SELECT
                CASE
                    WHEN p2_wins_count = 0 AND draws_count = 0 THEN 'P1 dominates all openings'
                    WHEN p1_wins_count = 0 AND draws_count = 0 THEN 'P2 dominates all openings'
                    WHEN draws_count = p1_wins_count + p2_wins_count + draws_count THEN 'All draws'
                    ELSE 'Mixed (contested)'
                END AS board_type
            FROM solutions
            WHERE has_p2_data = 1
        )
        SELECT
            c.board_type,
            COUNT(cl.board_type) AS count,
            ROUND(100.0 * COUNT(cl.board_type) / MAX((SELECT COUNT(*) FROM classified), 1), 2) AS pct
        FROM categories c
        LEFT JOIN classified cl ON cl.board_type = c.board_type
        GROUP BY c.board_type, c.sort_order
        ORDER BY c.sort_order
        """,
    ),
    (
        "Strongest Opening Moves",
        "Which board positions are P1's best openings?",
        """
        SELECT
            p1_best_move AS move,
            p1_best_move_pos AS position,
            COUNT(*) AS times_chosen,
            SUM(CASE WHEN p1_win = 1 THEN 1 ELSE 0 END) AS wins,
            ROUND(100.0 * SUM(CASE WHEN p1_win = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS win_pct
        FROM solutions
        WHERE p1_best_move >= 0
        GROUP BY p1_best_move
        ORDER BY win_pct DESC
        """,
    ),
    (
        "Corner vs Edge Openings",
        "Does opening on a corner vs edge matter?",
        """
        SELECT
            p1_best_move_pos AS position_type,
            COUNT(*) AS total,
            SUM(CASE WHEN p1_win = 1 THEN 1 ELSE 0 END) AS wins,
            ROUND(100.0 * SUM(CASE WHEN p1_win = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) AS win_pct
        FROM solutions
        WHERE p1_best_move >= 0
        GROUP BY p1_best_move_pos
        """,
    ),
    (
        "Win Method Distribution",
        "How do games end? Row vs Column vs Diagonal vs Square vs Blockade",
        """
        SELECT
            p1_outcome AS outcome,
            COUNT(*) AS frequency,
            ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM solutions), 2) AS pct
        FROM solutions
        GROUP BY p1_outcome
        ORDER BY frequency DESC
        """,
    ),
    (
        "Game Length Distribution",
        "How many moves until the game ends?",
        """
        SELECT
            game_depth AS depth,
            COUNT(*) AS frequency,
            ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM solutions), 2) AS pct
        FROM solutions
        GROUP BY game_depth
        ORDER BY game_depth
        """,
    ),
    (
        "Game Length by Outcome",
        "Average game length per win method",
        """
        SELECT
            p1_outcome AS outcome,
            ROUND(AVG(game_depth), 1) AS avg_depth,
            MIN(game_depth) AS shortest,
            MAX(game_depth) AS longest,
            COUNT(*) AS count
        FROM solutions
        GROUP BY p1_outcome
        ORDER BY avg_depth
        """,
    ),
    (
        "P2 Counter-Strategies",
        "Top P2 responses that flip P1-favored boards (P1 wins overall, but P2 wins specific openings)",
        """
        SELECT
            r.p1_move,
            r.p2_best_move,
            r.outcome,
            COUNT(*) AS frequency
        FROM p2_responses r
        JOIN solutions s ON s.perm_index = r.perm_index
        WHERE s.p1_win = 1 AND r.is_p1_win = 0 AND r.outcome != 'Draw'
        GROUP BY r.p1_move, r.p2_best_move, r.outcome
        ORDER BY frequency DESC
        LIMIT 20
        """,
    ),
    (
        "Blockade Frequency (P2 Responses)",
        "How important is the blockade mechanic across all openings?",
        """
        SELECT
            outcome,
            COUNT(*) AS frequency,
            ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM p2_responses), 2) AS pct
        FROM p2_responses
        GROUP BY outcome
        ORDER BY frequency DESC
        """,
    ),
    (
        "Decisive vs Contested Boards",
        "How many boards have a unanimous result vs mixed across openings? (P2 data only)",
        """
        WITH categories(board_class, sort_order) AS (
            VALUES
                ('P1 wins all', 1),
                ('P2 wins all', 2),
                ('All draws', 3),
                ('Contested', 4)
        ),
        classified AS (
            SELECT
                CASE
                    WHEN p1_wins_count = p1_wins_count + p2_wins_count + draws_count THEN 'P1 wins all'
                    WHEN p2_wins_count = p1_wins_count + p2_wins_count + draws_count THEN 'P2 wins all'
                    WHEN draws_count = p1_wins_count + p2_wins_count + draws_count THEN 'All draws'
                    ELSE 'Contested'
                END AS board_class
            FROM solutions
            WHERE has_p2_data = 1
        )
        SELECT
            c.board_class,
            COUNT(cl.board_class) AS count,
            ROUND(100.0 * COUNT(cl.board_class) / MAX((SELECT COUNT(*) FROM classified), 1), 2) AS pct
        FROM categories c
        LEFT JOIN classified cl ON cl.board_class = c.board_class
        GROUP BY c.board_class, c.sort_order
        ORDER BY c.sort_order
        """,
    ),
    (
        "P2's Best Win Methods",
        "When P2 wins, how do they do it?",
        """
        SELECT
            outcome,
            COUNT(*) AS frequency,
            ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) AS pct
        FROM p2_responses
        WHERE is_p1_win = 0 AND outcome != 'Draw'
        GROUP BY outcome
        ORDER BY frequency DESC
        """,
    ),
]


def format_table(headers: list[str], rows: list[tuple]) -> str:
    """Format query results as an aligned text table."""
    if not rows:
        return "  (no data)\n"

    # Convert all values to strings
    str_rows = [[str(v) for v in row] for row in rows]
    str_headers = [str(h) for h in headers]

    # Calculate column widths
    widths = [len(h) for h in str_headers]
    for row in str_rows:
        for i, val in enumerate(row):
            widths[i] = max(widths[i], len(val))

    # Build the table
    lines: list[str] = []
    header_line = "  " + "  ".join(h.ljust(w) for h, w in zip(str_headers, widths))
    separator = "  " + "  ".join("-" * w for w in widths)
    lines.append(header_line)
    lines.append(separator)

    for row in str_rows:
        line = "  " + "  ".join(val.ljust(w) for val, w in zip(row, widths))
        lines.append(line)

    return "\n".join(lines) + "\n"


def print_board_guide() -> None:
    """Print the board index layout for reference."""
    print("  Board Index Reference:")
    print("  +----+----+----+----+")
    print("  |  0 |  1 |  2 |  3 |")
    print("  +----+----+----+----+")
    print("  |  4 |  5 |  6 |  7 |")
    print("  +----+----+----+----+")
    print("  |  8 |  9 | 10 | 11 |")
    print("  +----+----+----+----+")
    print("  | 12 | 13 | 14 | 15 |")
    print("  +----+----+----+----+")
    print("")


def run_query(conn: sqlite3.Connection, index: int) -> None:
    """Run a single query and print formatted results."""
    title, description, sql = QUERIES[index]
    num = index + 1

    print(f"\n{'=' * 60}")
    print(f"  Query {num}: {title}")
    print(f"  {description}")
    print(f"{'=' * 60}")

    try:
        cursor = conn.execute(sql)
        headers = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()
        print(format_table(headers, rows))
    except sqlite3.OperationalError as e:
        print(f"  Error: {e}\n")


def check_db() -> bool:
    """Check if the database exists and has data."""
    if not os.path.exists(DB_PATH):
        print(f"[!] Database not found at {DB_PATH}")
        print("    Run the solver first: python src/main.py")
        return False

    conn = sqlite3.connect(DB_PATH)
    try:
        count = conn.execute("SELECT COUNT(*) FROM solutions").fetchone()[0]
        if count == 0:
            print("[!] Database is empty. Run the solver first: python src/main.py")
            return False
        p2_count = conn.execute("SELECT COUNT(*) FROM solutions WHERE has_p2_data = 1").fetchone()[0]
        print(f"[*] Database: {DB_PATH}")
        print(f"[*] Boards solved: {count:,} ({p2_count:,} with P2 data)")
        return True
    except sqlite3.OperationalError:
        print("[!] Database exists but has no solutions table.")
        print("    Run the solver first: python src/main.py")
        return False
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run heuristic queries against the Niya solver database."
    )
    parser.add_argument(
        "--query", "-q",
        type=int,
        help="Run a specific query by number (1-indexed).",
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List all available queries.",
    )
    args = parser.parse_args()

    if args.list:
        print("\nAvailable queries:\n")
        for i, (title, desc, _) in enumerate(QUERIES, 1):
            print(f"  {i:2d}. {title} - {desc}")
        print()
        return

    if not check_db():
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)

    try:
        if args.query:
            idx = args.query - 1
            if 0 <= idx < len(QUERIES):
                run_query(conn, idx)
            else:
                print(f"[!] Query number must be between 1 and {len(QUERIES)}")
                sys.exit(1)
        else:
            # Run all queries
            print_board_guide()
            for i in range(len(QUERIES)):
                run_query(conn, i)

            print(f"\n{'=' * 60}")
            print("  Done! All queries executed.")
            print(f"{'=' * 60}\n")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
