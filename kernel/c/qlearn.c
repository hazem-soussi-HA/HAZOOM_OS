/* HAZOOM OS v6.0 - Q-Learning Implementation (Kernel Port) */
#include "qlearn.h"
#include "console.h"

/* Global Q-learning context */
QLearnContext qlearn_ctx;

/* Initialize Q-learning system */
void qlearn_init(void) {
    /* Zero the entire Q-table */
    for (uint32_t s = 0; s < QLEARN_MAX_STATES; s++) {
        for (uint32_t a = 0; a < QLEARN_MAX_ACTIONS; a++) {
            qlearn_ctx.table[s].q_values[a] = 0.0f;
        }
    }

    /* Set hyperparameters */
    qlearn_ctx.alpha   = QLEARN_ALPHA;
    qlearn_ctx.gamma   = QLEARN_GAMMA;
    qlearn_ctx.epsilon = QLEARN_EPSILON_INIT;
    qlearn_ctx.episode_count = 0;
    qlearn_ctx.step_count = 0;
    qlearn_ctx.current_state = 0;
    qlearn_ctx.initialized = 1;
}

/* Hash a state to a Q-table index (simple binning) */
uint32_t qlearn_state_hash(QState *state) {
    uint32_t hash = (uint32_t)state->cpu_bin +
                    (uint32_t)state->mem_bin * QLEARN_STATE_BINS +
                    (uint32_t)state->threat_bin * QLEARN_STATE_BINS * QLEARN_STATE_BINS +
                    (uint32_t)state->load_bin * QLEARN_STATE_BINS * QLEARN_STATE_BINS * QLEARN_STATE_BINS;

    if (hash >= QLEARN_MAX_STATES) {
        hash = hash % QLEARN_MAX_STATES;
    }
    return hash;
}

/* Bellman update: Q(s,a) = (1-a)*Q + a*[R + g*max Q(s',a')] */
void qlearn_update(uint32_t state, uint32_t action, float reward, uint32_t next_state) {
    if (state >= QLEARN_MAX_STATES || action >= QLEARN_MAX_ACTIONS) return;
    if (next_state >= QLEARN_MAX_STATES) next_state = next_state % QLEARN_MAX_STATES;

    /* Find max Q-value for next state */
    float max_next_q = qlearn_ctx.table[next_state].q_values[0];
    for (uint32_t a = 1; a < QLEARN_MAX_ACTIONS; a++) {
        if (qlearn_ctx.table[next_state].q_values[a] > max_next_q) {
            max_next_q = qlearn_ctx.table[next_state].q_values[a];
        }
    }

    /* Bellman equation */
    float current_q = qlearn_ctx.table[state].q_values[action];
    float new_q = (1.0f - qlearn_ctx.alpha) * current_q +
                  qlearn_ctx.alpha * (reward + qlearn_ctx.gamma * max_next_q);

    qlearn_ctx.table[state].q_values[action] = new_q;
    qlearn_ctx.step_count++;
}

/* Epsilon-greedy action selection */
uint32_t qlearn_choose_action(QState *state) {
    if (!qlearn_ctx.initialized) return ACTION_DO_NOTHING;

    uint32_t state_idx = qlearn_state_hash(state);

    /* Exploration: random action with probability epsilon */
    /* Simple LCG pseudo-random number generator */
    static uint32_t rng_state = 12345;
    rng_state = rng_state * 1103515245 + 12345;
    float random_val = (float)(rng_state >> 16) / 65536.0f;

    if (random_val < qlearn_ctx.epsilon) {
        /* Explore: random action */
        rng_state = rng_state * 1103515245 + 12345;
        return (rng_state >> 16) % QLEARN_MAX_ACTIONS;
    }

    /* Exploit: choose best action */
    uint32_t best_action = 0;
    float best_q = qlearn_ctx.table[state_idx].q_values[0];

    for (uint32_t a = 1; a < QLEARN_MAX_ACTIONS; a++) {
        if (qlearn_ctx.table[state_idx].q_values[a] > best_q) {
            best_q = qlearn_ctx.table[state_idx].q_values[a];
            best_action = a;
        }
    }

    return best_action;
}

/* Get Q-value for state-action pair */
float qlearn_get_q(uint32_t state, uint32_t action) {
    if (state >= QLEARN_MAX_STATES || action >= QLEARN_MAX_ACTIONS) return 0.0f;
    return qlearn_ctx.table[state].q_values[action];
}

/* Decay epsilon (called periodically) */
void qlearn_decay_epsilon(void) {
    if (qlearn_ctx.epsilon > QLEARN_EPSILON_MIN) {
        qlearn_ctx.epsilon *= QLEARN_EPSILON_DECAY;
        if (qlearn_ctx.epsilon < QLEARN_EPSILON_MIN) {
            qlearn_ctx.epsilon = QLEARN_EPSILON_MIN;
        }
    }
    qlearn_ctx.episode_count++;
}

/* Dump Q-learning statistics */
void qlearn_dump_stats(void) {
    vga_print("[QLEARN] Episodes: ");
    vga_putchar('0' + (qlearn_ctx.episode_count / 100) % 10);
    vga_putchar('0' + (qlearn_ctx.episode_count / 10) % 10);
    vga_putchar('0' + (qlearn_ctx.episode_count % 10));
    vga_print(" Steps: ");
    vga_putchar('0' + (qlearn_ctx.step_count / 100) % 10);
    vga_putchar('0' + (qlearn_ctx.step_count / 10) % 10);
    vga_putchar('0' + (qlearn_ctx.step_count % 10));
    vga_print(" Epsilon: ");
    /* Print epsilon as percentage */
    vga_putchar('0' + (int)(qlearn_ctx.epsilon * 100) / 10);
    vga_putchar('0' + (int)(qlearn_ctx.epsilon * 100) % 10);
    vga_print("%\n");
}
