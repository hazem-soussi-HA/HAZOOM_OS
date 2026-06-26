/* HAZOOM OS v6.0 - Process Management Implementation */
#include "process.h"
#include "pmm.h"
#include "console.h"

/* Process list */
PCB_t *process_list_head = (PCB_t *)0;
PCB_t *current_process   = (PCB_t *)0;
uint32_t next_pid        = 0;

/* Static PCB pool */
static PCB_t process_pool[MAX_PROCESSES];
static uint8_t process_used[MAX_PROCESSES];

/* Initialize process manager */
void process_init(void) {
    /* Clear process pool */
    for (int i = 0; i < MAX_PROCESSES; i++) {
        process_used[i] = 0;
        process_pool[i].pid = 0;
        process_pool[i].state = PROCESS_TERMINATED;
        process_pool[i].next = (PCB_t *)0;
    }

    process_list_head = (PCB_t *)0;
    current_process = (PCB_t *)0;
    next_pid = 0;

    /* Create PID 0 - kernel idle process */
    create_process("kernel_idle", 0, PRIORITY_IDLE, 0);
}

/* Allocate a free PCB slot */
static PCB_t *alloc_pcb(void) {
    for (int i = 0; i < MAX_PROCESSES; i++) {
        if (!process_used[i]) {
            process_used[i] = 1;
            process_pool[i].pool_index = i;  /* Store index for O(1) free */
            return &process_pool[i];
        }
    }
    return (PCB_t *)0; /* No free PCBs */
}

/* Create a new process */
PCB_t *create_process(const char *name, uint64_t entry, uint8_t priority, int user_mode) {
    PCB_t *pcb = alloc_pcb();
    if (pcb == (PCB_t *)0) {
        vga_print("[PMM] Failed to allocate PCB\n");
        return (PCB_t *)0;
    }

    /* Assign PID */
    pcb->pid  = next_pid++;
    pcb->ppid = (current_process) ? current_process->pid : 0;
    pcb->state = PROCESS_READY;
    pcb->priority = priority;
    pcb->entry_point = entry;
    pcb->wake_ticks = 0;
    pcb->next = (PCB_t *)0;

    /* Copy name */
    int i = 0;
    while (name[i] && i < 31) {
        pcb->name[i] = name[i];
        i++;
    }
    pcb->name[i] = '\0';

    /* Allocate kernel stack */
    pcb->kernel_stack = (uint64_t)pmm_alloc(2); /* 16KB = 4 pages */
    if (pcb->kernel_stack == 0) {
        process_used[pcb->pid % MAX_PROCESSES] = 0;
        vga_print("[PMM] Failed to allocate kernel stack\n");
        return (PCB_t *)0;
    }
    pcb->kernel_stack += KERNEL_STACK_SIZE; /* Stack grows down */

    /* Set up initial register state */
    pcb->esp = pcb->kernel_stack;
    pcb->eip = entry;
    pcb->cr3 = 0; /* Will be set to kernel page table for kernel processes */

    /* Add to process list */
    if (process_list_head == (PCB_t *)0) {
        process_list_head = pcb;
    } else {
        PCB_t *cur = process_list_head;
        while (cur->next != (PCB_t *)0) {
            cur = cur->next;
        }
        cur->next = pcb;
    }

    return pcb;
}

/* Terminate a process */
void terminate_process(uint32_t pid) {
    PCB_t *proc = get_process(pid);
    if (proc == (PCB_t *)0) return;

    proc->state = PROCESS_TERMINATED;

    /* Free kernel stack */
    if (proc->kernel_stack) {
        pmm_free((void *)(proc->kernel_stack - KERNEL_STACK_SIZE), 2);
    }

    /* Remove from process list */
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

    /* Mark PCB as free — use stored pool index, not pid (avoids hash collision) */
    process_used[proc->pool_index] = 0;
}

/* Get process by PID */
PCB_t *get_process(uint32_t pid) {
    PCB_t *cur = process_list_head;
    while (cur != (PCB_t *)0) {
        if (cur->pid == pid) return cur;
        cur = cur->next;
    }
    return (PCB_t *)0;
}

/* Yield CPU (placeholder for scheduler) */
void process_yield(void) {
    /* Will trigger timer interrupt when scheduler is implemented */
}

/* Dump process statistics */
void process_dump_stats(void) {
    uint32_t count = 0;
    uint32_t ready = 0;
    uint32_t running = 0;
    uint32_t blocked = 0;

    PCB_t *cur = process_list_head;
    while (cur != (PCB_t *)0) {
        count++;
        switch (cur->state) {
            case PROCESS_READY:   ready++;   break;
            case PROCESS_RUNNING: running++; break;
            case PROCESS_BLOCKED: blocked++; break;
            default: break;
        }
        cur = cur->next;
    }

    vga_print("[PROC] Total: ");
    /* Simple number print - just print the count as indicator */
    vga_putchar('0' + (count % 10));
    vga_print(" Ready: ");
    vga_putchar('0' + (ready % 10));
    vga_print(" Running: ");
    vga_putchar('0' + (running % 10));
    vga_print("\n");
}
