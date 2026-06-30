#include "../kernel.h"

#define MAX_PROCESSES 1024

static pcb_t processes[MAX_PROCESSES];
static uint32_t process_count = 0;
static uint32_t current_pid = 0;

pcb_t *proc_create(const char *name, uint8_t priority) {
    if (process_count >= MAX_PROCESSES) return 0;
    
    pcb_t *p = &processes[process_count];
    p->pid = process_count + 1;
    p->ppid = 0;
    p->state = 1;
    p->priority = priority;
    p->cpu_time = 0;
    
    for (int i = 0; i < 32 && name[i]; i++) {
        p->name[i] = name[i];
    }
    
    return p;
}

void proc_yield(void) {
    if (process_count == 0) return;
    
    processes[current_pid].cpu_time++;
    current_pid = (current_pid + 1) % process_count;
}

void proc_block(uint32_t pid) {
    if (pid < MAX_PROCESSES && processes[pid].state == 1) {
        processes[pid].state = 3;
    }
}

void proc_unblock(uint32_t pid) {
    if (pid < MAX_PROCESSES && processes[pid].state == 3) {
        processes[pid].state = 1;
    }
}

void proc_terminate(uint32_t pid) {
    if (pid < MAX_PROCESSES && processes[pid].state != 4) {
        processes[pid].state = 4;
    }
}