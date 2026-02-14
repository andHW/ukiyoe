# Niya Game Solver

> **[Niya](https://boardgamegeek.com/boardgame/125311/okiya)** (also known as Okiya, Geisha, Kizz-Kizz)
>
> - Designed by **Bruno Cathala**, Art by **Cyril Bouquet**

## The Goal

This project is a high-performance, parallelized Python solver for the board game **Niya**. The objective is to analyze all ~20 trillion possible board states (pruned via symmetry) to determine if Player 1 or Player 2 has a forced win and to extract a winning heuristic for human play.

## The Game Rules

1. **Grid:** 4x4.
2. **Components:** 16 tiles. Each tile has a Plant (Maple, Cherry, Pine, Iris) and a Poem (Sun, Bird, Rain, Cloud).
3. **Setup:** The 16 tiles are randomly arranged on the grid at the start.
4. **Movement:**
   - Player 1 _must_ choose a tile on the periphery (edge) for the first move.
   - Subsequent moves must match the Plant OR Poem of the previous tile.
5. **Win Conditions:**
   - Create a line of 4 (Horizontal, Vertical, Diagonal).
   - Create a 2x2 Square.
   - **Blockade:** If the opponent has no legal moves, the current player wins.

## Setup

1. **Clone the repository (if you haven't already):**

   ```bash
   git clone <repository-url>
   cd niya_solver
   ```

2. **Create and activate a Python virtual environment:**
   This project uses a virtual environment to manage dependencies.

   ```bash
   # Create the virtual environment
   python3 -m venv venv

   # Activate it
   source venv/bin/activate
   ```

3. **Install the required dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

## Running the Solver

Once the setup is complete, you can start the solver. The script will automatically create a `data/niya.db` SQLite database and begin solving board permutations.

```bash
python src/main.py
```

The solver is designed to be pausable and resumable. You can stop it at any time with `Ctrl+C`, and it will pick up where it left off when you run it again.

## Technical Architecture

1. **Language:** Python 3.10+
2. **Storage:** SQLite (`niya.db`) for storing solved board states and resume capability.
3. **Concurrency:** `multiprocessing` to utilize all CPU cores.
4. **Optimization:**
   - **Bitboards:** Use 16-bit integers to represent board state and win masks.
   - **Canonical Pruning:** Before solving, normalize the board (rotate/reflect) to its lexicographically smallest form to avoid solving identical geometries twice.
   - **Iterative Generation:** Use `math.factorial` indexing to iterate deterministically (0 to N) rather than randomly.

## Extracting Winning Heuristics

The primary goal of this project is to not just solve the game, but to provide actionable insights for human players. Once the solver has populated the `niya.db` database with a significant number of solved board states, you can analyze the data to discover winning patterns.

You can use SQL queries on the `solutions` table to ask questions like:

1. **What are the strongest opening moves?**

   ```sql
   -- This query finds the opening moves that lead to a win most frequently.
   SELECT
       best_move,
       COUNT(*) AS win_count
   FROM solutions
   WHERE p1_win = 1
   GROUP BY best_move
   ORDER BY win_count DESC;
   ```

2. **What is the most common path to victory?**

   ```sql
   -- This shows whether winning by a line/square is more common than winning by blockade.
   SELECT
       method,
       COUNT(*) AS frequency
   FROM solutions
   WHERE p1_win = 1
   GROUP BY method;
   ```

3. **Are some board configurations inherently better?**
   Analyzing the `perm_index` of winning boards can be complex. You would need to join the `solutions` table with the generated permutations to understand which tile configurations are advantageous. This requires more advanced data analysis scripting (e.g., using Python with Pandas and SQLite).

By running these queries and exploring the data, you can start to build a mental model of the game's strategic landscape and find ways to "destroy your opponent".
