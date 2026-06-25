/* HAZOOM OS v6.0 - Physical Memory Manager (Buddy Allocator) */
#include "pmm.h"
#include "console.h"

/* Frame bitmap - tracks allocation status of each 4KB frame */
static uint8_t  *frame_bitmap;
static uint64_t  frame_bitmap_size;
static uint64_t  total_frames;
static uint64_t  free_frames_count;

/* Buddy allocator free lists - each holds frame indices of free blocks */
static uint64_t  free_lists[PMM_FREE_LISTS]; /* Head of each free list (frame index or 0 = empty) */

/* We use a simple linked-list approach within the free lists.
   Each free block stores the frame index of the next free block at its start. */

/* Statistics */
static pmm_stats_t stats;

/* Helper: get bitmap bit for a frame */
static inline int bitmap_get(uint64_t frame) {
    if (frame >= total_frames) return -1;
    uint64_t byte = frame / 8;
    uint8_t  bit  = frame % 8;
    return (frame_bitmap[byte] >> bit) & 1;
}

/* Helper: set bitmap bit for a frame */
static inline void bitmap_set(uint64_t frame, int value) {
    if (frame >= total_frames) return;
    uint64_t byte = frame / 8;
    uint8_t  bit  = frame % 8;
    if (value) {
        frame_bitmap[byte] |= (1 << bit);
    } else {
        frame_bitmap[byte] &= ~(1 << bit);
    }
}

/* Helper: mark a range of frames in bitmap */
static void bitmap_mark_range(uint64_t start, uint64_t count, int value) {
    for (uint64_t i = 0; i < count; i++) {
        bitmap_set(start + i, value);
    }
}

/* Initialize the physical memory manager */
void pmm_init(mmap_entry_t *mmap, uint32_t entries) {
    /* First pass: find total memory to determine bitmap size */
    uint64_t max_addr = 0;
    uint64_t usable_pages = 0;

    for (uint32_t i = 0; i < entries; i++) {
        uint64_t end = mmap[i].base + mmap[i].length;
        if (end > max_addr) max_addr = end;
        if (mmap[i].type == 1) { /* Available */
            usable_pages += mmap[i].length / PMM_PAGE_SIZE;
        }
    }

    total_frames = max_addr / PMM_PAGE_SIZE;
    frame_bitmap_size = (total_frames + 7) / 8;

    /* Place bitmap at a fixed location after kernel (assume loaded at 1MB, kernel ~256KB) */
    frame_bitmap = (uint8_t *)0x200000; /* 2MB mark */

    /* Initialize bitmap - mark everything as reserved */
    for (uint64_t i = 0; i < frame_bitmap_size; i++) {
        frame_bitmap[i] = 0xFF;
    }

    /* Second pass: mark available frames as free */
    for (uint32_t i = 0; i < entries; i++) {
        if (mmap[i].type == 1) {
            uint64_t start_frame = mmap[i].base / PMM_PAGE_SIZE;
            uint64_t num_frames  = mmap[i].length / PMM_PAGE_SIZE;
            bitmap_mark_range(start_frame, num_frames, FRAME_FREE);
            free_frames_count += num_frames;
        }
    }

    /* Reserve the first 2MB (kernel + bitmap area) */
    uint64_t kernel_frames = (2 * 1024 * 1024) / PMM_PAGE_SIZE;
    bitmap_mark_range(0, kernel_frames, FRAME_RESERVED);
    free_frames_count -= kernel_frames;

    /* Initialize free lists to empty */
    for (int i = 0; i < PMM_FREE_LISTS; i++) {
        free_lists[i] = 0; /* 0 means empty list */
    }

    /* Populate buddy allocator free lists with available memory */
    /* Simple approach: add all available frames to order 0 list */
    for (uint64_t f = kernel_frames; f < total_frames; f++) {
        if (bitmap_get(f) == FRAME_FREE) {
            /* Add to order 0 free list (linked list at frame start) */
            /* We store next pointer at the frame itself */
            uint64_t *frame_ptr = (uint64_t *)pmm_frame_to_addr(f);
            *frame_ptr = free_lists[0];
            free_lists[0] = f;
        }
    }

    /* Set statistics */
    stats.total_frames = total_frames;
    stats.free_frames = free_frames_count;
    stats.used_frames = 0;
    stats.reserved_frames = kernel_frames;
}

/* Allocate 2^order contiguous frames */
void *pmm_alloc(uint8_t order) {
    if (order > PMM_MAX_ORDER) return (void *)0;

    /* Find smallest available block >= requested order */
    uint8_t found_order = order;
    while (found_order < PMM_FREE_LISTS && free_lists[found_order] == 0) {
        found_order++;
    }

    if (found_order >= PMM_FREE_LISTS) {
        return (void *)0; /* Out of memory */
    }

    /* Remove block from free list */
    uint64_t frame = free_lists[found_order];
    uint64_t *frame_ptr = (uint64_t *)pmm_frame_to_addr(frame);
    free_lists[found_order] = *frame_ptr;

    /* Split larger blocks down to requested order */
    while (found_order > order) {
        found_order--;
        /* Split: second half goes to lower order list */
        uint64_t buddy_frame = frame + (1ULL << found_order);
        uint64_t *buddy_ptr = (uint64_t *)pmm_frame_to_addr(buddy_frame);
        *buddy_ptr = free_lists[found_order];
        free_lists[found_order] = buddy_frame;
    }

    /* Mark frames as used */
    uint64_t num_frames = 1ULL << order;
    bitmap_mark_range(frame, num_frames, FRAME_USED);
    free_frames_count -= num_frames;

    /* Update stats */
    stats.free_frames = free_frames_count;
    stats.used_frames += num_frames;

    return (void *)pmm_frame_to_addr(frame);
}

/* Free 2^order contiguous frames back to buddy system */
void pmm_free(void *ptr, uint8_t order) {
    if (order > PMM_MAX_ORDER || ptr == (void *)0) return;

    uint64_t frame = pmm_addr_to_frame((uint64_t)ptr);
    uint64_t num_frames = 1ULL << order;

    /* Mark frames as free */
    bitmap_mark_range(frame, num_frames, FRAME_FREE);
    free_frames_count += num_frames;

    /* Update stats */
    stats.free_frames = free_frames_count;
    stats.used_frames -= num_frames;

    /* Try to coalesce with buddy */
    uint64_t current_frame = frame;
    uint8_t current_order = order;

    while (current_order < PMM_MAX_ORDER) {
        uint64_t buddy_frame = current_frame ^ (1ULL << current_order);

        /* Check if buddy is free and in the same order list */
        /* Simple check: scan free list for buddy */
        int buddy_found = 0;
        uint64_t *prev = &free_lists[current_order];
        uint64_t cur = free_lists[current_order];

        while (cur != 0) {
            if (cur == buddy_frame) {
                buddy_found = 1;
                /* Remove buddy from list */
                *prev = *(uint64_t *)pmm_frame_to_addr(cur);
                break;
            }
            prev = (uint64_t *)pmm_frame_to_addr(cur);
            cur = *prev;
        }

        if (!buddy_found) break;

        /* Coalesce: new block starts at min(current, buddy) */
        current_frame = (current_frame < buddy_frame) ? current_frame : buddy_frame;
        current_order++;
    }

    /* Add coalesced block to appropriate free list */
    uint64_t *frame_ptr = (uint64_t *)pmm_frame_to_addr(current_frame);
    *frame_ptr = free_lists[current_order];
    free_lists[current_order] = current_frame;
}

/* Get memory statistics */
pmm_stats_t pmm_get_stats(void) {
    return stats;
}

/* Convert bytes to pages (rounded up) */
uint64_t pmm_bytes_to_pages(uint64_t bytes) {
    return (bytes + PMM_PAGE_SIZE - 1) / PMM_PAGE_SIZE;
}
