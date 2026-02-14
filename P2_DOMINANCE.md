# P2 Dominance Strategy: The "distinct Center"

Through exhaustive analysis of Niya's 20.9 trillion board states, we have discovered a rare class of board configurations where **Player 2 can force a win against ANY opening move by Player 1**.

This occurs in roughly ~0.02% of all random boards.

## The Pattern

The key feature of these P2-dominant boards is the **distinct Center**.

The 4 interior tiles (positions 5, 6, 9, 10):

1. Contain all **4 distinct Plants** (Maple, Cherry, Pine, Iris).
2. Contain all **4 distinct Poems** (Sun, Bird, Rain, Flag).

## Why This Works

### 1. The Setup

In Niya, Player 1 **must** start on the edge (positions 0-4, 7-8, 11-15).
Player 1 **cannot** start in the center.

### 2. The Trap

Because the center tiles contain every possible plant and poem, **every single edge tile connects to at least one center tile**.
In the P2-dominant boards we analyzed, every edge tile connected to exactly 2 center tiles.

### 3. P2 Seizes the Center

No matter where P1 starts, their move will match a tile in the center.
P2's optimal strategy is to **immediately take that center tile**.

### 4. Control

Once P2 occupies a center tile, they gain massive connectivity (center tiles connect to 6-7 neighbors, edge tiles only 3-4).
Because the center contains all elements, P2 can pivot to any other part of the board, while P1 is pushed to the edges.
P2 effectively controls the "hub" of the board and can steer the game towards a 4-in-a-row or a Blockade win.

## Verify It Yourself

To see this in action, launch the [Web UI](../web) and load one of these board codes:

* **`1614995286`**
* **`12735630037`**
* **`14171347984`**
* **`15257310192`**
* **`15362383749`**

Try to play as Player 1 against the AI (perfect play). You will find that no matter which of the 12 legal opening moves you choose, the AI (Player 2) will force a win.
