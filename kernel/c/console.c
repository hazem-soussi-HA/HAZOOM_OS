/* HAZOOM OS v6.0 - VGA Text Mode Console Driver */
#include "console.h"
#include <stdint.h>

uint16_t console_row = 0;
uint16_t console_column = 0;
uint8_t  console_color = 0x03;

static inline void outb(uint16_t port, uint8_t value) {
    __asm__ volatile("outb %0, %1" : : "a"(value), "Nd"(port));
}

void vga_update_cursor(void) {
    uint16_t pos = console_row * VGA_WIDTH + console_column;
    outb(0x3D4, 14);
    outb(0x3D5, (pos >> 8) & 0xFF);
    outb(0x3D4, 15);
    outb(0x3D5, pos & 0xFF);
}

void vga_set_color(uint8_t fg, uint8_t bg) {
    console_color = (bg << 4) | (fg & 0x0F);
}

void vga_clear(void) {
    volatile uint16_t *buffer = (volatile uint16_t *)VGA_BUFFER;
    uint16_t blank = (uint16_t)' ' | ((uint16_t)console_color << 8);
    for (int i = 0; i < VGA_WIDTH * VGA_HEIGHT; i++) {
        buffer[i] = blank;
    }
    console_row = 0;
    console_column = 0;
    vga_update_cursor();
}

void vga_putchar(char c) {
    volatile uint16_t *buffer = (volatile uint16_t *)VGA_BUFFER;
    uint16_t index;
    uint16_t entry = (uint16_t)c | ((uint16_t)console_color << 8);

    if (c == '\n') {
        console_column = 0;
        console_row++;
    } else if (c == '\r') {
        console_column = 0;
    } else if (c == '\t') {
        console_column = (console_column + 8) & ~7;
    } else {
        index = console_row * VGA_WIDTH + console_column;
        buffer[index] = entry;
        console_column++;
    }

    /* Handle line wrap */
    if (console_column >= VGA_WIDTH) {
        console_column = 0;
        console_row++;
    }

    /* Handle screen scroll */
    if (console_row >= VGA_HEIGHT) {
        /* Move all lines up by one */
        for (uint16_t i = 0; i < (VGA_HEIGHT - 1) * VGA_WIDTH; i++) {
            buffer[i] = buffer[i + VGA_WIDTH];
        }
        /* Clear last line */
        for (uint16_t i = (VGA_HEIGHT - 1) * VGA_WIDTH; i < VGA_HEIGHT * VGA_WIDTH; i++) {
            buffer[i] = (uint16_t)' ' | ((uint16_t)console_color << 8);
        }
        console_row = VGA_HEIGHT - 1;
    }

    vga_update_cursor();
}

/* Print a null-terminated string */
void vga_print(const char *str) {
    while (*str) {
        vga_putchar(*str);
        str++;
    }
}

/* Print a string at specific position */
void vga_print_at(const char *str, uint16_t row, uint16_t col) {
    uint16_t saved_row = console_row;
    uint16_t saved_col = console_column;

    console_row = row;
    console_column = col;
    vga_print(str);

    console_row = saved_row;
    console_column = saved_col;
}
