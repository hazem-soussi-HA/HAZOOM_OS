#include "kernel.h"
#include "io.h"

static pcb_t *current_process = NULL;
static pcb_t *process_list = NULL;
static uint32_t next_pid = 1;
static uint32_t tick_count = 0;

static uint32_t *page_directory = (uint32_t *)0x100000;
static uint32_t next_frame = 0x100000 + 4096;

void vmem_map(uint32_t virt, uint32_t phys) {
    uint32_t *pt = page_directory;
    uint32_t pde_idx = virt >> 20;
    uint32_t pte_idx = (virt >> 12) & 0x3ff;
    
    if (!(pt[pde_idx] & PAGE_PRESENT)) {
        pt[pde_idx] = next_frame | PAGE_PRESENT | PAGE_WRITABLE;
        next_frame += PAGE_SIZE;
    }
    
    uint32_t pt_addr = pt[pde_idx] & 0xfffff000;
    uint32_t *page_table = (uint32_t *)pt_addr;
    page_table[pte_idx] = phys | PAGE_PRESENT | PAGE_WRITABLE;
}

void vmem_init(void) {
    for (uint32_t i = 0; i < 1024; i++) {
        page_directory[i] = 0;
    }
    
    for (uint32_t virt = 0; virt < 4 * 1024 * 1024; virt += PAGE_SIZE) {
        vmem_map(virt, virt);
    }
}

void enable_paging(void) {
    asm volatile("mov %%eax, %%cr3" : : "a" ((uint32_t)page_directory));
    
    uint32_t cr0;
    asm volatile("mov %%cr0, %0" : "=r" (cr0));
    cr0 |= 0x1;
    asm volatile("mov %0, %%cr0" : : "r" (cr0));
}

void io_init(void) {
    outb(0x3F8, 'K');
    outb(0x3F8, 'E');
    outb(0x3F8, 'R');
    outb(0x3F8, 'N');
    outb(0x3F8, 'E');
    outb(0x3F8, 'L');
    outb(0x3F8, '\n');
}

pcb_t *process_create(const char *name, uint8_t priority) {
    pcb_t *proc = (pcb_t *)next_frame;
    next_frame += PAGE_SIZE;
    
    proc->pid = next_pid++;
    proc->ppid = 0;
    proc->state = 1;
    proc->priority = priority;
    proc->cpu_time = 0;
    proc->memory_used = 0;
    
    for (int i = 0; i < 32 && name[i]; i++) {
        proc->name[i] = name[i];
    }
    proc->name[31] = '\0';
    
    proc->next = process_list;
    process_list = proc;
    
    return proc;
}

void schedule(void) {
    if (!process_list) return;
    
    if (current_process && current_process->next) {
        current_process = current_process->next;
    } else {
        current_process = process_list;
    }
}

void kernel_main(void) {
    io_init();
    
    asm volatile("lgdt (%0)" : : "r" ((uint32_t[]){0x17, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00}));
    asm volatile("movw $0x10, %ax; movw %ax, %ds; movw %ax, %es; movw %ax, %fs; movw %ax, %gs");
    
    vmem_init();
    enable_paging();
    
    outb(0x20, 0x20);
    outb(0xA0, 0x20);
    
    process_create("init", 0);
    current_process = process_list;
    
    while (1) {
        tick_count++;
        schedule();
        
        if (tick_count % 100 == 0) {
            outb(0x3F8, '.');
        }
    }
}