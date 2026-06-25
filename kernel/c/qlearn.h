/* HAZOOM OS v6.0 - Q-Learning Header (Kernel Port) */
#ifndef HAZOOM_QLEARN_H
#define HAZOOM_QLEARN_H

#include <stdint.h>

/* Q-learning constants */
#define QLEARN_MAX_STATES      1000
#define QLEARN_MAX_ACTIONS      12
#define QLEARN_STATE_BINS       10     /* Bins per dimension */

/* Q-learning hyperparameters */
#define QLEARN_ALPHA            0.1f   /* Learning rate */
#define QLEARN_GAMMA            0.95f  /* Discount factor */
#define QLEARN_EPSILON_INIT     1.0f   /* Initial exploration rate */
#define QLEARN_EPSILON_MIN      0.01f  /* Minimum exploration rate */
#define QLEARN_EPSILON_DECAY    0.995f /* Epsilon decay per episode */

/* OS Actions (same as JS version) */
typedef enum {
    ACTION_DO_NOTHING        = 0,
    ACTION_ADJUST_PRIORITY   = 1,
    ACTION_PREEMPT_PROCESS   = 2,
    ACTION_SWAP_TO_DISK      = 3,
    ACTION_KILL_PROCESS      = 4,
    ACTION_ALLOCATE_MEMORY   = 5,
    ACTION_DEFRAGMENT        = 6,
    ACTION_INCREASE_QUANTUM  = 7,
    ACTION_DECREASE_QUANTUM  = 8,
    ACTION_MIGRATE_CORE      = 9,
    ACTION_TRIGGER_GC        = 10,
    ACTION_LOG_EVENT         = 11
} QAction;

/* State representation: binned CPU/mem/threat/load values */
typedef struct {
    uint8_t cpu_bin;        /* 0-9: CPU utilization bin */
    uint8_t mem_bin;        /* 0-9: Memory utilization bin */
    uint8_t threat_bin;     /* 0-9: Threat level bin */
    uint8_t load_bin;       /* 0-9: System load bin */
} QState;

/* Q-table entry */
typedef struct {
    float q_values[QLEARN_MAX_ACTIONS];
} QTableEntry;

/* Q-learning context */
typedef struct {
    QTableEntry table[QLEARN_MAX_STATES];
    float alpha;
    float gamma;
    float epsilon;
    uint32_t episode_count;
    uint32_t step_count;
    uint32_t current_state;
    int initialized;
} QLearnContext;

/* Function prototypes */
void qlearn_init(void);
uint32_t qlearn_state_hash(QState *state);
void qlearn_update(uint32_t state, uint32_t action, float reward, uint32_t next_state);
uint32_t qlearn_choose_action(QState *state);
float qlearn_get_q(uint32_t state, uint32_t action);
void qlearn_decay_epsilon(void);
void qlearn_dump_stats(void);

/* Global Q-learning context */
extern QLearnContext qlearn_ctx;

#endif /* HAZOOM_QLEARN_H */
