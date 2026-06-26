/* HAZOOM OS v6.0 - Process Management Header */
#ifndef HAZOOM_PROCESS_H
#define HAZOOM_PROCESS_H

#include <stdint.h>

/* Maximum number of processes */
#define MAX_PROCESSES 1024

/* Process states */
typedef enum {
    PROCESS_READY    = 0,
    PROCESS_RUNNING  = 1,
    PROCESS_BLOCKED  = 2,
    PROCESS_TERMINATED = 3
} ProcessState;

/* Process priority levels */
#define PRIORITY_IDLE       0
#define PRIORITY_LOW        1
#define PRIORITY_NORMAL     2
#define PRIORITY_HIGH       3
#define PRIORITY_REALTIME   4

/* Kernel stack size */
#define KERNEL_STACK_SIZE   (4 * 4096)  /* 16KB kernel stack */

/* Process Control Block */
typedef struct PCB {
    uint32_t        pid;            /* Process ID */
    uint32_t        ppid;           /* Parent Process ID */
    ProcessState    state;          /* Current state */
    uint8_t         priority;       /* Scheduling priority */
    uint64_t        esp;            /* Saved stack pointer */
    uint64_t        eip;            /* Saved instruction pointer */
    uint64_t        cr3;            /* Page table root (PML4) */
    uint64_t        kernel_stack;   /* Top of kernel stack */
    uint64_t        user_stack;     /* Top of user stack */
    uint64_t        entry_point;    /* Process entry point */
    uint64_t        wake_ticks;     /* Wake-up time for blocked processes */
    char            name[32];       /* Process name */
    uint32_t        pool_index;     /* Index in process_pool[] (for O(1) free) */
    struct PCB     *next;           /* Next process in list */
} PCB_t;

/* Process list head */
extern PCB_t *process_list_head;
extern PCB_t *current_process;
extern uint32_t next_pid;

/* Function prototypes */
void process_init(void);
PCB_t *create_process(const char *name, uint64_t entry, uint8_t priority, int user_mode);
void terminate_process(uint32_t pid);
PCB_t *get_process(uint32_t pid);
void process_yield(void);
void process_dump_stats(void);

#endif /* HAZOOM_PROCESS_H */
