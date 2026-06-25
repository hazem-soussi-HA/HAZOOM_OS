/* HAZOOM OS v6.0 - GDT Implementation */
#include "gdt.h"

/* GDT with 6 entries: null, kernel_code, kernel_data, user_code, user_data, tss */
static gdt_entry_t gdt[6] __attribute__((aligned(8)));
static gdt_ptr_t   gdt_ptr;

/* Encode a single GDT entry */
void encode_gdt_entry(gdt_entry_t *entry, uint32_t base, uint32_t limit,
                      uint8_t access, uint8_t flags) {
    entry->limit_low  = limit & 0xFFFF;
    entry->base_low   = base & 0xFFFF;
    entry->base_mid   = (base >> 16) & 0xFF;
    entry->access     = access;
    entry->flags_limit = ((limit >> 16) & 0x0F) | ((flags & 0x0F) << 4);
    entry->base_high  = (base >> 24) & 0xFF;
}

/* Load GDT using lgdt instruction */
void load_gdt(gdt_ptr_t *ptr) {
    asm volatile("lgdt %0" : : "m"(*ptr) : "memory");
}

/* Initialize the GDT with standard segments */
void gdt_init(void) {
    /* Null segment (required) */
    encode_gdt_entry(&gdt[0], 0, 0, 0, 0);

    /* Kernel Code Segment (0x08) - Ring 0, Readable, Executable, 64-bit */
    encode_gdt_entry(&gdt[1], 0, 0xFFFFF,
        GDT_ACCESS_PRESENT | GDT_ACCESS_RING0 | GDT_ACCESS_SEGMENT |
        GDT_ACCESS_EXECUTABLE | GDT_ACCESS_READABLE,
        GDT_FLAG_GRANULARITY | GDT_FLAG_64BIT);

    /* Kernel Data Segment (0x10) - Ring 0, Writable */
    encode_gdt_entry(&gdt[2], 0, 0xFFFFF,
        GDT_ACCESS_PRESENT | GDT_ACCESS_RING0 | GDT_ACCESS_SEGMENT |
        GDT_ACCESS_WRITABLE,
        GDT_FLAG_GRANULARITY | GDT_FLAG_64BIT);

    /* User Code Segment (0x18) - Ring 3, Readable, Executable, 64-bit */
    encode_gdt_entry(&gdt[3], 0, 0xFFFFF,
        GDT_ACCESS_PRESENT | GDT_ACCESS_RING3 | GDT_ACCESS_SEGMENT |
        GDT_ACCESS_EXECUTABLE | GDT_ACCESS_READABLE,
        GDT_FLAG_GRANULARITY | GDT_FLAG_64BIT);

    /* User Data Segment (0x20) - Ring 3, Writable */
    encode_gdt_entry(&gdt[4], 0, 0xFFFFF,
        GDT_ACCESS_PRESENT | GDT_ACCESS_RING3 | GDT_ACCESS_SEGMENT |
        GDT_ACCESS_WRITABLE,
        GDT_FLAG_GRANULARITY | GDT_FLAG_64BIT);

    /* TSS Segment (0x28) - placeholder, filled when TSS is set up */
    encode_gdt_entry(&gdt[5], 0, 0,
        GDT_ACCESS_PRESENT | GDT_ACCESS_RING3 | 0x09,  /* 64-bit TSS type */
        0);

    /* Set up GDT pointer and load */
    gdt_ptr.limit = sizeof(gdt) - 1;
    gdt_ptr.base  = (uint64_t)&gdt;

    load_gdt(&gdt_ptr);

    /* Reload segment registers */
    asm volatile(
        "movw %0, %%ax\n"
        "movw %%ax, %%ds\n"
        "movw %%ax, %%es\n"
        "movw %%ax, %%fs\n"
        "movw %%ax, %%gs\n"
        "movw %%ax, %%ss\n"
        :
        : "i"(GDT_KERNEL_DATA)
        : "ax", "memory"
    );

    /* Far return to reload CS with kernel code segment */
    asm volatile(
        "pushq %0\n"
        "leaq 1f(%%rip), %%rax\n"
        "pushq %%rax\n"
        "lretq\n"
        "1:\n"
        :
        : "i"(GDT_KERNEL_CODE)
        : "rax", "memory"
    );
}
