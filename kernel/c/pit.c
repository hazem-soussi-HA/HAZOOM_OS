/* HAZOOM OS v6.0 - 8253/8254 Programmable Interval Timer (PIT) driver */
#include "pit.h"
#include "console.h"

#define PIT_CH0_DATA 0x40
#define PIT_COMMAND  0x43

/* Channel 0, access mode lobyte/hibyte, mode 3 (square wave), binary. */
#define PIT_CMD_CH0_LOHIBYTE_MODE3 0x36

static uint32_t tick_hz = 0;

void pit_init(uint32_t hz) {
    if (hz == 0) hz = 100;

    uint32_t divisor = PIT_BASE_FREQ / hz;
    if (divisor == 0) divisor = 1;
    if (divisor > 0xFFFF) divisor = 0xFFFF;

    /* The real rate is PIT_BASE_FREQ / divisor, so derive it back rather
       than echoing back a requested value the hardware cannot produce. */
    tick_hz = PIT_BASE_FREQ / divisor;

    outb(PIT_COMMAND, PIT_CMD_CH0_LOHIBYTE_MODE3);
    outb(PIT_CH0_DATA, (uint8_t)(divisor & 0xFF));        /* low byte  */
    outb(PIT_CH0_DATA, (uint8_t)((divisor >> 8) & 0xFF)); /* high byte */
}

uint32_t pit_hz(void) {
    return tick_hz;
}
