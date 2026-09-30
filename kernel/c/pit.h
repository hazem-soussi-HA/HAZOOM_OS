/* HAZOOM OS v6.0 - 8253/8254 Programmable Interval Timer (PIT) driver
 *
 * The PIC unmasked IRQ0 expecting a periodic tick, but nothing ever
 * programmed the timer chip itself, so IRQ0 never asserted and the
 * scheduler heartbeat in irq_handler() never ran. This driver supplies
 * the missing clock.
 */
#ifndef PIT_H
#define PIT_H

#include <stdint.h>

#define PIT_BASE_FREQ 1193182u   /* input frequency of the 8254, Hz */

/* Program channel 0 to fire at `hz` interrupts per second. */
void pit_init(uint32_t hz);

/* Current tick rate, as programmed. */
uint32_t pit_hz(void);

#endif /* PIT_H */
