#include <stddef.h>
#include "process.h"
#include "pmm.h"
#include "console.h"

PCB_t *process_list_head = (PCB_t *)0;
PCB_t *current_process   = (PCB_t *)0;
uint32_t next_pid        = 0;
uint64_t system_ticks    = 0;

static PCB_t process_pool[MAX_PROCESSES];
static uint8_t process_used[MAX_PROCESSES];

void process_init(void) {
    for (int i = 0; i < MAX_PROCESSES; i++) {
        process_used[i] = 0;
        process_pool[i].pid = 0;
        process_pool[i].state = PROCESS_TERMINATED;
        process_pool[i].next = (PCB_t *)0;
    }
    process_list_head = (PCB_t *)0;
    current_process = (PCB_t *)0;
    next_pid = 0;
    system_ticks = 0;
    create_process("kernel_idle", 0, PRIORITY_IDLE, 0);
}

static PCB_t *alloc_pcb(void) {
    for (int i = 0; i < MAX_PROCESSES; i++) {
        if (!process_used[i]) {
            process_used[i] = 1;
            process_pool[i].pool_index = i;
            return &process_pool[i];
        }
    }
    return (PCB_t *)0;
}

PCB_t *create_process(const char *name, uint64_t entry, uint8_t priority, int user_mode) {
    PCB_t *pcb = alloc_pcb();
    if (pcb == (PCB_t *)0) {
        vga_print("[PMM] Failed to allocate PCB\n");
        return (PCB_t *)0;
    }
    pcb->pid  = next_pid++;
    pcb->ppid = (current_process) ? current_process->pid : 0;
    pcb->state = PROCESS_READY;
    pcb->priority = priority;
    pcb->entry_point = entry;
    pcb->wake_ticks = 0;
    pcb->ticks_remaining = TIME_QUANTUM;
    pcb->next = (PCB_t *)0;

    int i = 0;
    while (name[i] && i < 31) {
        pcb->name[i] = name[i];
        i++;
    }
    pcb->name[i] = '\0';

    pcb->kernel_stack = (uint64_t)pmm_alloc(2);
    if (pcb->kernel_stack == 0) {
        process_used[pcb->pid % MAX_PROCESSES] = 0;
        vga_print("[PMM] Failed to allocate kernel stack\n");
        return (PCB_t *)0;
    }
    pcb->kernel_stack += KERNEL_STACK_SIZE;

    if (entry == 0) {
        pcb->cpu_state.rip = (uint64_t)0;
    } else {
        pcb->cpu_state.rip = entry;
    }
    pcb->cpu_state.rsp = user_mode ? 0 : pcb->kernel_stack;
    pcb->cpu_state.cs  = user_mode ? 0x18 : 0x08;
    pcb->cpu_state.ss  = user_mode ? 0x20 : 0x10;
    pcb->cpu_state.rflags = 0x202;

    if (process_list_head == (PCB_t *)0) {
        process_list_head = pcb;
        current_process = pcb;
        current_process->state = PROCESS_RUNNING;
    } else {
        PCB_t *cur = process_list_head;
        while (cur->next != (PCB_t *)0) {
            cur = cur->next;
        }
        cur->next = pcb;
    }
    return pcb;
}

void terminate_process(uint32_t pid) {
    PCB_t *proc = get_process(pid);
    if (proc == (PCB_t *)0) return;
    proc->state = PROCESS_TERMINATED;
    if (proc->kernel_stack) {
        pmm_free((void *)(proc->kernel_stack - KERNEL_STACK_SIZE), 2);
    }
    if (process_list_head == proc) {
        process_list_head = proc->next;
    } else {
        PCB_t *cur = process_list_head;
        while (cur && cur->next != proc) {
            cur = cur->next;
        }
        if (cur) {
            cur->next = proc->next;
        }
    }
    process_used[proc->pool_index] = 0;
}

PCB_t *get_process(uint32_t pid) {
    PCB_t *cur = process_list_head;
    while (cur != (PCB_t *)0) {
        if (cur->pid == pid) return cur;
        cur = cur->next;
    }
    return (PCB_t *)0;
}

void process_yield(void) {
    __asm__ volatile("int $0x80");
}

void schedule(cpu_state_t *state) {
    if (current_process) {
        current_process->cpu_state = *state;
    }

    PCB_t *start = current_process;
    PCB_t *next = current_process ? current_process->next : process_list_head;

    int searched = 0;
    while (searched < MAX_PROCESSES) {
        if (next == (PCB_t *)0) {
            next = process_list_head;
        }
        if (next == (PCB_t *)0) break;

        if (next->state == PROCESS_READY && next->priority > 0) {
            if (current_process && current_process != next) {
                current_process->state = PROCESS_READY;
            }
            current_process = next;
            current_process->state = PROCESS_RUNNING;
            *state = current_process->cpu_state;
            return;
        }

        if (next->state == PROCESS_BLOCKED && next->wake_ticks > 0 && next->wake_ticks <= system_ticks) {
            next->state = PROCESS_READY;
            next->wake_ticks = 0;
        }

        next = next->next;
        searched++;
        if (next == start) break;
    }

    if (!current_process || current_process->state != PROCESS_RUNNING) {
        current_process = process_list_head;
        if (current_process) {
            current_process->state = PROCESS_RUNNING;
            *state = current_process->cpu_state;
        }
    }
}

void process_dump_stats(void) {
    vga_print("[PROC] System uptick: ");
    uint64_t n = system_ticks;
    char buf[20];
    int pos = 0;
    if (n == 0) { buf[pos++] = '0'; }
    while (n > 0) {
        buf[pos++] = '0' + (n % 10);
        n /= 10;
    }
    for (int i = pos - 1; i >= 0; i--) vga_putchar(buf[i]);
    vga_print(" | ");

    uint32_t count = 0, ready = 0, running = 0, blocked = 0;
    PCB_t *cur = process_list_head;
    while (cur) {
        count++;
        switch (cur->state) {
            case PROCESS_READY:   ready++;   break;
            case PROCESS_RUNNING: running++; break;
            case PROCESS_BLOCKED: blocked++; break;
            default: break;
        }
        cur = cur->next;
    }
    vga_print("P:");
    vga_putchar('0' + (count % 10));
    vga_print(" R:");
    vga_putchar('0' + (ready % 10));
    vga_print(" Run:");
    vga_putchar('0' + (running % 10));
    vga_print(" B:");
    vga_putchar('0' + (blocked % 10));
    vga_print("\n");
}
