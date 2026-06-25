/* HAZOOM OS v6.0 - Physical Memory Manager Header */
#ifndef HAZOOM_PMM_H
#define HAZOOM_PMM_H

#include <stdint.h>

/* Page size constants */
#define PMM_PAGE_SIZE       4096
#define PMM_PAGE_SIZE_SHIFT 12
#define PMM_PAGES_PER_BYTE 8

/* Maximum buddy allocator order (4KB * 2^10 = 4MB blocks) */
#define PMM_MAX_ORDER       10
#define PMM_FREE_LISTS      (PMM_MAX_ORDER + 1)

/* Frame status */
#define FRAME_FREE    0
#define FRAME_USED    1
#define FRAME_RESERVED 2

/* Memory map entry (from UEFI/bootloader) */
typedef struct {
    uint64_t base;
    uint64_t length;
    uint32_t type;       /* 1=available, 2=reserved, 3=ACPI rec, 4=ACPI NVS, 5=bad */
    uint32_t acpi_ext;
} __attribute__((packed)) mmap_entry_t;

/* PMM statistics */
typedef struct {
    uint64_t total_frames;
    uint64_t free_frames;
    uint64_t used_frames;
    uint64_t reserved_frames;
} pmm_stats_t;

/* Function prototypes */
void pmm_init(mmap_entry_t *mmap, uint32_t entries);
void *pmm_alloc(uint8_t order);
void pmm_free(void *ptr, uint8_t order);
pmm_stats_t pmm_get_stats(void);
uint64_t pmm_bytes_to_pages(uint64_t bytes);

/* Convert frame number to physical address */
static inline uint64_t pmm_frame_to_addr(uint64_t frame) {
    return frame << PMM_PAGE_SIZE_SHIFT;
}

/* Convert physical address to frame number */
static inline uint64_t pmm_addr_to_frame(uint64_t addr) {
    return addr >> PMM_PAGE_SIZE_SHIFT;
}

#endif /* HAZOOM_PMM_H */
