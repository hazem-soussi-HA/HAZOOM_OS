#ifndef KERNEL_H
#define KERNEL_H

#include <stdint.h>
#include <stddef.h>

#define KERNEL_VIRTUAL_BASE 0xc0000000
#define KERNEL_OFFSET       0xc0000000

#define PAGE_SIZE 4096
#define PAGE_PRESENT    0x01
#define PAGE_WRITABLE   0x02
#define PAGE_USER       0x04
#define PAGE_WRTHROUGH  0x08
#define PAGE_NOCACHE    0x10
#define PAGE_BUSY       0x20
#define PAGE_WRITEPROT  0x40
#define PAGE_PAT        0x80
#define PAGE_PS         0x80
#define PAGE_RESERVED   0x100
#define PAGE_A          0x200
#define PAGE_IGNORED    0x400
#define PAGE_DIRTY      0x800
#define PAGE_PAT_LARGE  0x1000
#define PAGE NxT          0x2000

typedef struct {
    uint64_t base;
    uint64_t limit;
    uint64_t limit_low : 16;
    uint64_t base_low : 24;
    uint64_t access : 8;
    uint64_t granularity : 8;
    uint64_t base_high : 32;
} __attribute__((packed)) gdt_entry_t;

typedef struct {
    uint64_t offset_low : 16;
    uint64_t selector : 16;
    uint64_t zero : 8;
    uint64_t type : 4;
    uint64_t s : 1;
    uint64_t dpl : 2;
    uint64_t p : 1;
    uint64_t offset_middle : 16;
    uint64_t offset_high : 32;
    uint64_t ignored : 8;
    uint64_t reserved : 8;
} __attribute__((packed)) idt_entry_t;

typedef struct pcb {
    uint32_t pid;
    uint32_t ppid;
    char name[32];
    uint8_t state;
    uint8_t priority;
    uint32_t cpu_time;
    uint32_t memory_used;
    uint32_t page_table;
    struct pcb *next;
    struct pcb *prev;
} pcb_t;

typedef struct {
    uint32_t total_memory;
    uint32_t free_memory;
    uint32_t reserved_frames[1024];
    uint32_t free_frame_count;
} memory_info_t;

#endif