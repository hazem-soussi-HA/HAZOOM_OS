#ifndef HAZOOM_PROCESS_H
#define HAZOOM_PROCESS_H

#include <stdint.h>

#define MAX_PROCESSES 1024

typedef enum {
    PROCESS_READY    = 0,
    PROCESS_RUNNING  = 1,
    PROCESS_BLOCKED  = 2,
    PROCESS_TERMINATED = 3
} ProcessState;

#define PRIORITY_IDLE       0
#define PRIORITY_LOW        1
#define PRIORITY_NORMAL     2
#define PRIORITY_HIGH       3
#define PRIORITY_REALTIME   4

#define KERNEL_STACK_SIZE   (4 * 4096)
#define TIME_QUANTUM        5

typedef struct cpu_state {
    uint64_t r15, r14, r13, r12, r11, r10, r9, r8;
    uint64_t rbp, rdi, rsi, rdx, rcx, rbx, rax;
    uint64_t int_no, err_code;
    uint64_t rip, cs, rflags, rsp, ss;
} __attribute__((packed)) cpu_state_t;

typedef struct PCB {
    uint32_t        pid;
    uint32_t        ppid;
    ProcessState    state;
    uint8_t         priority;
    cpu_state_t     cpu_state;
    uint64_t        kernel_stack;
    uint64_t        user_stack;
    uint64_t        entry_point;
    uint64_t        wake_ticks;
    uint32_t        ticks_remaining;
    char            name[32];
    uint32_t        pool_index;
    struct PCB     *next;
} PCB_t;

extern PCB_t *process_list_head;
extern PCB_t *current_process;
extern uint32_t next_pid;
extern uint64_t system_ticks;

void process_init(void);
PCB_t *create_process(const char *name, uint64_t entry, uint8_t priority, int user_mode);
void terminate_process(uint32_t pid);
PCB_t *get_process(uint32_t pid);
void process_yield(void);
void process_dump_stats(void);
void schedule(cpu_state_t *state);
cpu_state_t *switch_process(cpu_state_t *state);

#endif
