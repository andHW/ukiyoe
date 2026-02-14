# Niya Solver - Heuristics & Analytics

All queries are implemented in [`analyze.py`](analyze.py). Run them against the solver's `niya.db` database:

```bash
python analyze.py          # Run all queries
python analyze.py -q 1     # Run a specific query
python analyze.py --list   # List available queries
```

## Key Questions

| #   | Question                     | What it reveals                                            |
| --- | ---------------------------- | ---------------------------------------------------------- |
| 1   | **Game Balance**             | Is Niya skewed toward P1, P2, or fair?                     |
| 2   | **First-Mover Advantage**    | How often P1 dominates all 12 openings vs contested boards |
| 3   | **Strongest Opening Moves**  | Which board positions are P1's best openings               |
| 4   | **Corner vs Edge Openings**  | Does starting on a corner vs edge matter?                  |
| 5   | **Win Method Distribution**  | Row vs Column vs Diagonal vs Square vs Blockade frequency  |
| 6   | **Game Length Distribution** | How many moves until the game ends                         |
| 7   | **Game Length by Outcome**   | Are blockades faster than line completions?                |
| 8   | **P2 Counter-Strategies**    | Which P2 responses flip P1-favored boards                  |
| 9   | **Blockade Frequency**       | How important is the blockade mechanic                     |
| 10  | **Decisive vs Contested**    | Boards with unanimous outcomes vs mixed                    |
| 11  | **P2's Best Win Methods**    | When P2 wins, how do they do it?                           |
