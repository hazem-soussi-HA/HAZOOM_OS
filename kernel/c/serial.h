/* HAZOOM OS v6.0 - 16550 UART serial driver (COM1 @ 0x3F8) */
#ifndef HAZOOM_SERIAL_H
#define HAZOOM_SERIAL_H

#include <stdint.h>

/* Initialize COM1 at 115200 8N1. Safe to call once at boot. */
void serial_init(void);

/* Write one byte to the serial port (blocking until the FIFO is ready). */
void serial_putchar(char c);

/* Write a NUL-terminated string. */
void serial_print(const char *s);

/* Write a decimal unsigned 32/64-bit integer (used by the selftest). */
void serial_print_u32(uint32_t v);
void serial_print_u64(uint64_t v);

#endif /* HAZOOM_SERIAL_H */
