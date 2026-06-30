#include "../kernel.h"
#include <stdint.h>

#define QTABLE_SIZE 10000
#define NUM_ACTIONS 12
#define NUM_STATES 12

typedef struct {
    uint32_t visits;
    float q_values[NUM_ACTIONS];
} qentry_t;

static qentry_t qtable[QTABLE_SIZE];
static float epsilon = 1.0f;
static float alpha = 0.1f;
static float gamma = 0.95f;

uint32_t hash_state(uint32_t *state) {
    uint32_t h = 0;
    for (int i = 0; i < NUM_STATES; i++) {
        h = h * 31 + state[i];
    }
    return h % QTABLE_SIZE;
}

int choose_action(uint32_t *state) {
    if (epsilon > 0.01f) {
        if ((float)rand() / RAND_MAX < epsilon) {
            return rand() % NUM_ACTIONS;
        }
    }
    
    uint32_t idx = hash_state(state);
    int best = 0;
    float best_q = qtable[idx].q_values[0];
    for (int i = 1; i < NUM_ACTIONS; i++) {
        if (qtable[idx].q_values[i] > best_q) {
            best_q = qtable[idx].q_values[i];
            best = i;
        }
    }
    return best;
}

void update_q(uint32_t *state, int action, float reward, uint32_t *next_state) {
    uint32_t idx = hash_state(state);
    qtable[idx].visits++;
    
    uint32_t next_idx = hash_state(next_state);
    float max_next_q = qtable[next_idx].q_values[0];
    for (int i = 1; i < NUM_ACTIONS; i++) {
        if (qtable[next_idx].q_values[i] > max_next_q) {
            max_next_q = qtable[next_idx].q_values[i];
        }
    }
    
    float old_q = qtable[idx].q_values[action];
    qtable[idx].q_values[action] = (1 - alpha) * old_q + alpha * (reward + gamma * max_next_q);
    
    epsilon = epsilon * 0.995f;
    if (epsilon < 0.01f) epsilon = 0.01f;
}

void qlearning_tick(uint32_t *state) {
    static uint32_t last_state[NUM_STATES];
    static int last_action = -1;
    static int initialized = 0;
    
    if (!initialized) {
        for (int i = 0; i < QTABLE_SIZE; i++) {
            for (int j = 0; j < NUM_ACTIONS; j++) {
                qtable[i].q_values[j] = 0.0f;
                qtable[i].visits = 0;
            }
        }
        initialized = 1;
    }
    
    if (last_action >= 0) {
        int action = last_action;
        float reward = 0.1f;
        update_q(last_state, action, reward, state);
    }
    
    last_action = choose_action(state);
    for (int i = 0; i < NUM_STATES; i++) {
        last_state[i] = state[i];
    }
}