/* HAZOOM OS v6.0 - Kernel Main Entry Point */
#include <stdint.h>
#include "console.h"
#include "gdt.h"
#include "idt.h"
#include "pmm.h"
#include "process.h"
#include "qlearn.h"

/* Virtual memory constants */
#define PML4_ADDR     0x1000000   /* PML4 table at 16MB (identity mapped) */
#define PDPT_ADDR     0x1010000   /* PDPT at 16MB + 4KB */
#define PD_ADDR       0x1020000   /* Page directory at 16MB + 8KB */

/* Kernel page table setup - identity maps first 2MB */
static void setup_kernel_page_tables(void) {
    uint64_t *pml4 = (uint64_t *)PML4_ADDR;
    uint64_t *pdpt = (uint64_t *)PDPT_ADDR;
    uint64_t *pd   = (uint64_t *)PD_ADDR;

    /* Clear tables */
    for (int i = 0; i < 512; i++) {
        pml4[i] = 0;
        pdpt[i] = 0;
        pd[i]   = 0;
    }

    /* PML4[0] -> PDPT (Present, Writable) */
    pml4[0] = PDPT_ADDR | 0x03;

    /* PDPT[0] -> PD (Present, Writable) */
    pdpt[0] = PD_ADDR | 0x03;

    /* PD[0..4] -> 2MB pages (Present, Writable, PS=1 for 2MB pages) */
    /* Identity map first 10MB (kernel + heap area) */
    for (int i = 0; i < 5; i++) {
        pd[i] = ((uint64_t)i << 21) | 0x83; /* 2MB page, Present, Writable, PS */
    }

    /* Load CR3 with PML4 */
    asm volatile("mov %0, %%cr3" : : "r"(PML4_ADDR) : "memory");
}

/* Scheduler initialization (placeholder) */
static void scheduler_init(void) {
    /* Scheduler will be implemented in a future version.
       For now, we just set up the timer interrupt to fire
       but don't actually switch processes. */
    vga_print("[SCHED] Scheduler stub initialized (full impl pending)\n");
}

/* Main kernel entry point - called from entry.asm */
void kernel_main(uint64_t boot_magic, uint64_t boot_info) {
    /* Step 1: Initialize VGA console */
    vga_set_color(VGA_CYAN, VGA_BLACK);
    vga_clear();
    vga_print("HAZOOM OS v6.0 -- Kernel initialized\n");

    /* Step 2: Initialize GDT */
    vga_print("[INIT] Loading Global Descriptor Table...\n");
    gdt_init();
    vga_print("[INIT] GDT loaded. Segments: K_CODE=0x08, K_DATA=0x10, U_CODE=0x18, U_DATA=0x20, TSS=0x28\n");

    /* Step 3: Initialize IDT */
    vga_print("[INIT] Loading Interrupt Descriptor Table...\n");
    idt_init();
    vga_print("[INIT] IDT loaded. 256 entries configured.\n");

    /* Step 4: Initialize Physical Memory Manager */
    vga_print("[INIT] Initializing Physical Memory Manager...\n");
    /* For now, provide a minimal memory map */
    /* In production, this would come from UEFI GetMemoryMap() */
    mmap_entry_t default_mmap[2];
    default_mmap[0].base   = 0x200000;     /* 2MB */
    default_mmap[0].length = 0x1FE00000;   /* ~510MB usable */
    default_mmap[0].type   = 1;            /* Available */
    default_mmap[0].acpi_ext = 0;
    default_mmap[1].base   = 0;
    default_mmap[1].length = 0;
    default_mmap[1].type   = 0;            /* End marker */
    default_mmap[1].acpi_ext = 0;

    pmm_init(default_mmap, 2);
    pmm_stats_t pmm_st = pmm_get_stats();
    vga_print("[INIT] PMM initialized. Total frames: ");
    vga_putchar('0' + ((pmm_st.total_frames / 100000) % 10));
    vga_putchar('0' + ((pmm_st.total_frames / 10000) % 10));
    vga_putchar('0' + ((pmm_st.total_frames / 1000) % 10));
    vga_print(" Free: ");
    vga_putchar('0' + ((pmm_st.free_frames / 100000) % 10));
    vga_putchar('0' + ((pmm_st.free_frames / 10000) % 10));
    vga_putchar('0' + ((pmm_st.free_frames / 1000) % 10));
    vga_print("\n");

    /* Step 5: Initialize Virtual Memory */
    vga_print("[INIT] Setting up kernel page tables...\n");
    setup_kernel_page_tables();
    vga_print("[INIT] Virtual memory initialized. Identity mapped 10MB.\n");

    /* Step 6: Initialize Process Manager */
    vga_print("[INIT] Initializing process manager...\n");
    process_init();
    vga_print("[INIT] Process manager ready. PID 0 (kernel_idle) created.\n");

    /* Step 7: Initialize Scheduler */
    vga_print("[INIT] Initializing scheduler...\n");
    scheduler_init();

    /* Step 8: Initialize Q-Learning */
    vga_print("[INIT] Initializing Q-learning subsystem...\n");
    qlearn_init();
    vga_print("[INIT] Q-learning ready. 1000 states x 12 actions.\n");

    /* Step 9: Enable interrupts */
    vga_print("[INIT] Enabling interrupts...\n");
    asm volatile("sti");
    vga_print("[INIT] Interrupts enabled.\n");

    /* Final status */
    vga_set_color(VGA_CYAN, VGA_BLACK);
    vga_print("\nHAZOOM OS v6.0 -- Systems online. Waiting for init...\n");

    /* Halt loop - scheduler not yet running */
    while (1) {
        asm volatile("hlt");
    }
}
