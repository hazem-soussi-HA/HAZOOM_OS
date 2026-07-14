/* HAZOOM OS v6.0 - 16550 UART serial driver */
#include "serial.h"

#define COM1_PORT 0x3F8

static inline void outb(uint16_t port, uint8_t value) {
    __asm__ volatile("outb %0, %1" : : "a"(value), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

static int serial_ready(void) {
    /* Line Status Register: bit 5 = THR empty. */
    return (inb(COM1_PORT + 5) & 0x20) != 0;
}

void serial_init(void) {
    /* Disable interrupts, set DLAB, 115200 baud (divisor 1), 8N1,
       then clear DLAB and enable FIFO. */
    outb(COM1_PORT + 1, 0x00);
    outb(COM1_PORT + 3, 0x80);
    outb(COM1_PORT + 0, 0x01);
    outb(COM1_PORT + 1, 0x00);
    outb(COM1_PORT + 3, 0x03);
    outb(COM1_PORT + 2, 0xC7);
    outb(COM1_PORT + 1, 0x00);
}

void serial_putchar(char c) {
    while (!serial_ready()) __asm__ volatile("pause");
    outb(COM1_PORT, (uint8_t)c);
}

void serial_print(const char *s) {
    while (*s) serial_putchar(*s++);
}

void serial_print_u64(uint64_t v) {
    char buf[24];
    int pos = 0;
    if (v == 0) { serial_putchar('0'); return; }
    while (v > 0 && pos < 23) {
        buf[pos++] = '0' + (v % 10);
        v /= 10;
    }
    for (int i = pos - 1; i >= 0; i--) serial_putchar(buf[i]);
}

void serial_print_u32(uint32_t v) {
    serial_print_u64((uint64_t)v);
}
