#include "../kernel.h"

static uint32_t free_frame_list[1024];
static uint32_t free_frame_count = 0;
static uint32_t used_frames = 0;

void pmm_init(void) {
    for (uint32_t frame = 0x100000; frame < 0x1000000; frame += PAGE_SIZE) {
        free_frame_list[free_frame_count++] = frame;
    }
}

uint32_t frame_alloc(void) {
    if (free_frame_count == 0) return 0;
    uint32_t frame = free_frame_list[--free_frame_count];
    used_frames++;
    return frame;
}

void frame_free(uint32_t frame) {
    free_frame_list[free_frame_count++] = frame;
    used_frames--;
}

uint32_t vmem_alloc(uint32_t bytes) {
    uint32_t frames = (bytes + PAGE_SIZE - 1) / PAGE_SIZE;
    uint32_t virt = next_frame;
    next_frame += frames * PAGE_SIZE;
    return virt;
}