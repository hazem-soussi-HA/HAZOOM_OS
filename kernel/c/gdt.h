/* HAZOOM OS v6.0 - GDT Header */
#ifndef HAZOOM_GDT_H
#define HAZOOM_GDT_H

#include <stdint.h>

/* Segment selector constants */
#define GDT_NULL        0x00
#define GDT_KERNEL_CODE 0x08
#define GDT_KERNEL_DATA 0x10
#define GDT_USER_CODE   0x18
#define GDT_USER_DATA   0x20
#define GDT_TSS         0x28

/* GDT entry structure - 8 bytes packed */
typedef struct {
    uint16_t limit_low;      /* Limit bits 0-15 */
    uint16_t base_low;       /* Base bits 0-15 */
    uint8_t  base_mid;      /* Base bits 16-23 */
    uint8_t  access;         /* Access byte */
    uint8_t  flags_limit;    /* Limit bits 16-19 + flags */
    uint8_t  base_high;      /* Base bits 24-31 */
} __attribute__((packed)) gdt_entry_t;

/* GDT pointer structure for lgdt */
typedef struct {
    uint16_t limit;          /* Size of GDT - 1 */
    uint64_t base;           /* Base address of GDT */
} __attribute__((packed)) gdt_ptr_t;

/* GDT access byte flags */
#define GDT_ACCESS_PRESENT      (1 << 7)
#define GDT_ACCESS_RING0         (0 << 5)
#define GDT_ACCESS_RING1         (1 << 5)
#define GDT_ACCESS_RING2         (2 << 5)
#define GDT_ACCESS_RING3         (3 << 5)
#define GDT_ACCESS_SEGMENT      (1 << 4)
#define GDT_ACCESS_EXECUTABLE   (1 << 3)
#define GDT_ACCESS_CONFORMING   (1 << 2)
#define GDT_ACCESS_READABLE     (1 << 2)
#define GDT_ACCESS_WRITABLE     (1 << 2)
#define GDT_ACCESS_DIRECTION    (1 << 2)
#define GDT_ACCESS_ACCESSED     (1 << 0)

/* GDT flags (upper nibble of byte 6) */
#define GDT_FLAG_GRANULARITY    (1 << 3)  /* 4K granularity */
#define GDT_FLAG_32BIT          (1 << 2)  /* 32-bit segment */
#define GDT_FLAG_64BIT          (1 << 1)  /* 64-bit segment */

/* Function prototypes */
void gdt_init(void);
void encode_gdt_entry(gdt_entry_t *entry, uint32_t base, uint32_t limit,
                      uint8_t access, uint8_t flags);
void load_gdt(gdt_ptr_t *ptr);

#endif /* HAZOOM_GDT_H */
