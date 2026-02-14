/*
 * solver_core.c - Fast Niya minimax solver in C
 *
 * Compiled as shared library, called from Python via ctypes.
 * Board represented as int8 arrays: plants[16] and poems[16].
 * Player state tracked via 16-bit bitmasks.
 *
 * Build: cc -O3 -shared -o solver_core.so solver_core.c  (macOS)
 *        cc -O3 -shared -fPIC -o solver_core.so solver_core.c  (Linux)
 */

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

/* ---- Outcome indices (match Python OUTCOME_TABLE) ---- */
#define OUT_ROW          0
#define OUT_COL          1
#define OUT_MAIN_DIAG    2
#define OUT_ANTI_DIAG    3
#define OUT_SQUARE       4
#define OUT_BLOCKADE     5
#define OUT_DRAW         6

/* ---- Scores ---- */
#define P1_WINS    1
#define P1_LOSES  -1
#define DRAW_SCORE 0
#define INF        2
#define NEG_INF   -2

/* ---- Win patterns ---- */
/* Each entry: { bitmask, outcome_index } */
typedef struct { uint16_t mask; int8_t outcome; } WinPattern;

static const WinPattern WIN_PATTERNS[] = {
    /* Rows */
    { 0x000F, OUT_ROW }, /* row 0: bits 0-3   */
    { 0x00F0, OUT_ROW }, /* row 1: bits 4-7   */
    { 0x0F00, OUT_ROW }, /* row 2: bits 8-11  */
    { 0xF000, OUT_ROW }, /* row 3: bits 12-15 */
    /* Columns */
    { 0x1111, OUT_COL }, /* col 0: bits 0,4,8,12  */
    { 0x2222, OUT_COL }, /* col 1: bits 1,5,9,13  */
    { 0x4444, OUT_COL }, /* col 2: bits 2,6,10,14 */
    { 0x8888, OUT_COL }, /* col 3: bits 3,7,11,15 */
    /* Diagonals */
    { 0x8421, OUT_MAIN_DIAG }, /* bits 0,5,10,15 */
    { 0x1248, OUT_ANTI_DIAG }, /* bits 3,6,9,12  */
    /* 2x2 Squares (9 of them) */
    { 0x0033, OUT_SQUARE }, /* r0c0: 0,1,4,5     */
    { 0x0066, OUT_SQUARE }, /* r0c1: 1,2,5,6     */
    { 0x00CC, OUT_SQUARE }, /* r0c2: 2,3,6,7     */
    { 0x0330, OUT_SQUARE }, /* r1c0: 4,5,8,9     */
    { 0x0660, OUT_SQUARE }, /* r1c1: 5,6,9,10    */
    { 0x0CC0, OUT_SQUARE }, /* r1c2: 6,7,10,11   */
    { 0x3300, OUT_SQUARE }, /* r2c0: 8,9,12,13   */
    { 0x6600, OUT_SQUARE }, /* r2c1: 9,10,13,14  */
    { 0xCC00, OUT_SQUARE }, /* r2c2: 10,11,14,15 */
};
#define NUM_WIN_PATTERNS 19

/* Opening indices (P1 must start on edge — non-interior cells) */
static const int OPENING_INDICES[] = {0,1,2,3,4,7,8,11,12,13,14,15};
#define NUM_OPENINGS 12

/* ---- Transposition table (simple hash map with open addressing) ---- */
/*
 * Key: (p1_mask, p2_mask, last_move, is_p1_turn) packed into 37 bits.
 *      p1_mask: 16 bits, p2_mask: 16 bits, last_move: 4 bits, turn: 1 bit
 * We use a power-of-2 sized table with linear probing.
 */
#define TT_SIZE_BITS 20
#define TT_SIZE      (1 << TT_SIZE_BITS)  /* 1M entries */
#define TT_MASK      (TT_SIZE - 1)

typedef struct {
    uint64_t key;     /* full key (0 = empty) */
    int8_t   score;
    int8_t   outcome;
    int8_t   depth;
} TTEntry;

static inline uint64_t tt_make_key(uint16_t p1, uint16_t p2, int last, int turn) {
    /* Pack into a non-zero key (add 1 to avoid 0 = empty sentinel) */
    return ((uint64_t)p1 << 21) | ((uint64_t)p2 << 5) | ((uint64_t)(last & 0xF) << 1) | (turn & 1) | ((uint64_t)1 << 37);
}

static inline int tt_lookup(TTEntry *tt, uint64_t key, int8_t *score, int8_t *outcome, int8_t *depth) {
    uint32_t idx = (uint32_t)(key * 0x9E3779B97F4A7C15ULL >> (64 - TT_SIZE_BITS)) & TT_MASK;
    for (int probe = 0; probe < 8; probe++) {
        uint32_t i = (idx + probe) & TT_MASK;
        if (tt[i].key == key) {
            *score   = tt[i].score;
            *outcome = tt[i].outcome;
            *depth   = tt[i].depth;
            return 1;
        }
        if (tt[i].key == 0) return 0;
    }
    return 0;
}

static inline void tt_store(TTEntry *tt, uint64_t key, int8_t score, int8_t outcome, int8_t depth) {
    uint32_t idx = (uint32_t)(key * 0x9E3779B97F4A7C15ULL >> (64 - TT_SIZE_BITS)) & TT_MASK;
    for (int probe = 0; probe < 8; probe++) {
        uint32_t i = (idx + probe) & TT_MASK;
        if (tt[i].key == 0 || tt[i].key == key) {
            tt[i].key     = key;
            tt[i].score   = score;
            tt[i].outcome = outcome;
            tt[i].depth   = depth;
            return;
        }
    }
    /* Table full in this bucket — replace first slot (simple eviction) */
    tt[idx].key     = key;
    tt[idx].score   = score;
    tt[idx].outcome = outcome;
    tt[idx].depth   = depth;
}


/* ---- Check win ---- */
static inline int check_win(uint16_t mask) {
    for (int i = 0; i < NUM_WIN_PATTERNS; i++) {
        if ((mask & WIN_PATTERNS[i].mask) == WIN_PATTERNS[i].mask)
            return WIN_PATTERNS[i].outcome;
    }
    return -1;
}


/* ---- Core minimax ---- */
typedef struct {
    int8_t score;
    int8_t outcome;
    int8_t game_depth;
} MiniResult;

static MiniResult minimax(
    const int8_t *plants,   /* plants[16] */
    const int8_t *poems,    /* poems[16]  */
    uint16_t p1_mask,
    uint16_t p2_mask,
    int last_move,
    int is_p1_turn,
    int alpha,
    int beta,
    int depth,
    TTEntry *tt
) {
    MiniResult result;

    /* TT lookup */
    uint64_t key = tt_make_key(p1_mask, p2_mask, last_move, is_p1_turn);
    if (tt_lookup(tt, key, &result.score, &result.outcome, &result.game_depth))
        return result;

    /* 1. Check if previous move won */
    uint16_t prev_mask = is_p1_turn ? p2_mask : p1_mask;
    int win = check_win(prev_mask);
    if (win >= 0) {
        result.score      = is_p1_turn ? P1_LOSES : P1_WINS;
        result.outcome    = (int8_t)win;
        result.game_depth = (int8_t)depth;
        tt_store(tt, key, result.score, result.outcome, result.game_depth);
        return result;
    }

    /* 2. Full board = draw */
    if (depth == 16) {
        result.score      = DRAW_SCORE;
        result.outcome    = OUT_DRAW;
        result.game_depth = 16;
        tt_store(tt, key, result.score, result.outcome, result.game_depth);
        return result;
    }

    /* 3. Get legal moves (match plant or poem of last tile) */
    uint16_t taken = p1_mask | p2_mask;
    int8_t target_plant = plants[last_move];
    int8_t target_poem  = poems[last_move];

    int moves[16];
    int num_moves = 0;
    for (int i = 0; i < 16; i++) {
        if (!(taken & (1 << i))) {
            if (plants[i] == target_plant || poems[i] == target_poem) {
                moves[num_moves++] = i;
            }
        }
    }

    /* 4. Blockade */
    if (num_moves == 0) {
        result.score      = is_p1_turn ? P1_LOSES : P1_WINS;
        result.outcome    = OUT_BLOCKADE;
        result.game_depth = (int8_t)depth;
        tt_store(tt, key, result.score, result.outcome, result.game_depth);
        return result;
    }

    /* 5. Recurse */
    int next_depth = depth + 1;

    if (is_p1_turn) {
        int best_score = NEG_INF;
        int8_t best_out = OUT_DRAW;
        int8_t best_d = 16;

        for (int m = 0; m < num_moves; m++) {
            int move = moves[m];
            MiniResult r = minimax(plants, poems,
                                   p1_mask | (uint16_t)(1 << move), p2_mask,
                                   move, 0, alpha, beta, next_depth, tt);
            if (r.score > best_score) {
                best_score = r.score;
                best_out   = r.outcome;
                best_d     = r.game_depth;
            }
            if (r.score > alpha) alpha = r.score;
            if (beta <= alpha) break;
        }
        result.score      = (int8_t)best_score;
        result.outcome    = best_out;
        result.game_depth = best_d;
    } else {
        int best_score = INF;
        int8_t best_out = OUT_DRAW;
        int8_t best_d = 16;

        for (int m = 0; m < num_moves; m++) {
            int move = moves[m];
            MiniResult r = minimax(plants, poems,
                                   p1_mask, p2_mask | (uint16_t)(1 << move),
                                   move, 1, alpha, beta, next_depth, tt);
            if (r.score < best_score) {
                best_score = r.score;
                best_out   = r.outcome;
                best_d     = r.game_depth;
            }
            if (r.score < beta) beta = r.score;
            if (beta <= alpha) break;
        }
        result.score      = (int8_t)best_score;
        result.outcome    = best_out;
        result.game_depth = best_d;
    }

    tt_store(tt, key, result.score, result.outcome, result.game_depth);
    return result;
}


/* ================================================================
 * Public API - called from Python via ctypes
 * ================================================================ */

/*
 * Result struct returned to Python.
 *   best_move:     P1's best opening move index (0-15)
 *   score:         1 = P1 wins, -1 = P2 wins, 0 = draw
 *   outcome:       outcome index (maps to OUTCOME_TABLE in Python)
 *   game_depth:    total moves until game ends
 *
 * For P2 analysis, 12 additional entries for each P1 opening:
 *   p2_moves[12]:      P2's best response for each P1 opening
 *   p2_scores[12]:     score for each P1 opening line
 *   p2_outcomes[12]:   outcome index for each
 */
typedef struct {
    int8_t  best_move;
    int8_t  score;
    int8_t  outcome;
    int8_t  game_depth;
    /* P2 analysis (filled only when skip_p2 == 0) */
    int8_t  p2_moves[12];
    int8_t  p2_scores[12];
    int8_t  p2_outcomes[12];
} SolveResult;


/*
 * solve_board_c - Solve a single Niya board.
 *
 * Args:
 *   plants[16], poems[16]: board tile attributes
 *   skip_p2: if nonzero, skip P2 analysis
 *   out: pointer to SolveResult to fill
 */
void solve_board_c(
    const int8_t *plants,
    const int8_t *poems,
    int skip_p2,
    SolveResult *out
) {
    /* Allocate transposition table on the heap (too large for stack) */
    static __thread TTEntry *tt = NULL;
    if (!tt) {
        tt = (TTEntry *)calloc(TT_SIZE, sizeof(TTEntry));
    } else {
        memset(tt, 0, TT_SIZE * sizeof(TTEntry));
    }

    /* Phase 1: Find P1's best opening */
    int alpha = NEG_INF;
    int beta  = INF;
    int best_move  = -1;
    int best_score = NEG_INF;
    int8_t best_out = OUT_DRAW;
    int8_t best_d   = 16;

    for (int oi = 0; oi < NUM_OPENINGS; oi++) {
        int move = OPENING_INDICES[oi];
        uint16_t p1_mask = (uint16_t)(1 << move);

        MiniResult r = minimax(plants, poems, p1_mask, 0, move, 0,
                               alpha, beta, 1, tt);
        if (r.score > best_score) {
            best_score = r.score;
            best_move  = move;
            best_out   = r.outcome;
            best_d     = r.game_depth;
        }
        if (r.score > alpha) alpha = r.score;
        if (beta <= alpha) break;
    }

    out->best_move  = (int8_t)best_move;
    out->score      = (int8_t)best_score;
    out->outcome    = best_out;
    out->game_depth = best_d;

    /* Phase 2: P2 analysis */
    if (skip_p2) {
        memset(out->p2_moves,    -1, 12);
        memset(out->p2_scores,    0, 12);
        memset(out->p2_outcomes,  0, 12);
        return;
    }

    for (int oi = 0; oi < NUM_OPENINGS; oi++) {
        int p1_move = OPENING_INDICES[oi];
        uint16_t p1_mask = (uint16_t)(1 << p1_move);
        int8_t tp = plants[p1_move];
        int8_t ts = poems[p1_move];

        int p2_best_move  = -1;
        int p2_best_score = INF;
        int8_t p2_best_out = OUT_DRAW;

        for (int i = 0; i < 16; i++) {
            if (i == p1_move) continue;
            if (plants[i] == tp || poems[i] == ts) {
                uint16_t p2_mask = (uint16_t)(1 << i);
                MiniResult r = minimax(plants, poems, p1_mask, p2_mask,
                                       i, 1, NEG_INF, INF, 2, tt);
                if (r.score < p2_best_score) {
                    p2_best_score = r.score;
                    p2_best_move  = i;
                    p2_best_out   = r.outcome;
                }
            }
        }

        out->p2_moves[oi]    = (int8_t)p2_best_move;
        out->p2_scores[oi]   = (int8_t)p2_best_score;
        out->p2_outcomes[oi] = p2_best_out;
    }
}


/* ================================================================
 * Board canonicalization
 *
 * Finds the lexicographically smallest board among all equivalences:
 *   8 spatial symmetries × 24 plant perms × 24 poem perms × 2 swap
 *   = 9,216 total transforms
 * ================================================================ */

/* 8 spatial transforms: transform_maps[t][i] = source index for position i */
static const int TRANSFORM_MAPS[8][16] = {
    /* Identity */
    { 0, 1, 2, 3,  4, 5, 6, 7,  8, 9,10,11, 12,13,14,15},
    /* 90° CW rotation */
    {12, 8, 4, 0, 13, 9, 5, 1, 14,10, 6, 2, 15,11, 7, 3},
    /* 180° rotation */
    {15,14,13,12, 11,10, 9, 8,  7, 6, 5, 4,  3, 2, 1, 0},
    /* 270° CW rotation */
    { 3, 7,11,15,  2, 6,10,14,  1, 5, 9,13,  0, 4, 8,12},
    /* Horizontal reflection (flip rows) */
    {12,13,14,15,  8, 9,10,11,  4, 5, 6, 7,  0, 1, 2, 3},
    /* Vertical reflection (flip cols) */
    { 3, 2, 1, 0,  7, 6, 5, 4, 11,10, 9, 8, 15,14,13,12},
    /* Main diagonal transpose */
    { 0, 4, 8,12,  1, 5, 9,13,  2, 6,10,14,  3, 7,11,15},
    /* Anti-diagonal transpose */
    {15,11, 7, 3, 14,10, 6, 2, 13, 9, 5, 1, 12, 8, 4, 0},
};

/* All 24 permutations of {0,1,2,3} */
static const int LABEL_PERMS[24][4] = {
    {0,1,2,3},{0,1,3,2},{0,2,1,3},{0,2,3,1},{0,3,1,2},{0,3,2,1},
    {1,0,2,3},{1,0,3,2},{1,2,0,3},{1,2,3,0},{1,3,0,2},{1,3,2,0},
    {2,0,1,3},{2,0,3,1},{2,1,0,3},{2,1,3,0},{2,3,0,1},{2,3,1,0},
    {3,0,1,2},{3,0,2,1},{3,1,0,2},{3,1,2,0},{3,2,0,1},{3,2,1,0},
};
#define NUM_LABEL_PERMS 24


/*
 * Compare two boards lexicographically.
 * Board = (plants[0], poems[0], plants[1], poems[1], ...)
 * Returns: <0 if a<b, 0 if a==b, >0 if a>b
 */
static inline int board_cmp(const int8_t *ap, const int8_t *as,
                            const int8_t *bp, const int8_t *bs) {
    for (int i = 0; i < 16; i++) {
        if (ap[i] != bp[i]) return ap[i] - bp[i];
        if (as[i] != bs[i]) return as[i] - bs[i];
    }
    return 0;
}


/*
 * canonicalize_board_c - Find the canonical (lex-smallest) board.
 *
 * Args:
 *   plants[16], poems[16]: input board
 *   out_plants[16], out_poems[16]: canonical board (output)
 */
void canonicalize_board_c(
    const int8_t *plants,
    const int8_t *poems,
    int8_t *out_plants,
    int8_t *out_poems
) {
    /* Start with input as best */
    memcpy(out_plants, plants, 16);
    memcpy(out_poems,  poems,  16);

    int8_t cp[16], cs[16]; /* candidate plants/poems */

    for (int t = 0; t < 8; t++) {
        /* Apply spatial transform */
        int8_t sp[16], ss[16];
        for (int i = 0; i < 16; i++) {
            sp[i] = plants[TRANSFORM_MAPS[t][i]];
            ss[i] = poems[TRANSFORM_MAPS[t][i]];
        }

        for (int pp = 0; pp < NUM_LABEL_PERMS; pp++) {
            for (int sp_idx = 0; sp_idx < NUM_LABEL_PERMS; sp_idx++) {
                /* Standard: (plant_perm[plant], poem_perm[poem]) */
                for (int i = 0; i < 16; i++) {
                    cp[i] = (int8_t)LABEL_PERMS[pp][sp[i]];
                    cs[i] = (int8_t)LABEL_PERMS[sp_idx][ss[i]];
                }
                if (board_cmp(cp, cs, out_plants, out_poems) < 0) {
                    memcpy(out_plants, cp, 16);
                    memcpy(out_poems,  cs, 16);
                }

                /* Swap: (plant_perm[poem], poem_perm[plant]) */
                for (int i = 0; i < 16; i++) {
                    cp[i] = (int8_t)LABEL_PERMS[pp][ss[i]];
                    cs[i] = (int8_t)LABEL_PERMS[sp_idx][sp[i]];
                }
                if (board_cmp(cp, cs, out_plants, out_poems) < 0) {
                    memcpy(out_plants, cp, 16);
                    memcpy(out_poems,  cs, 16);
                }
            }
        }
    }
}
