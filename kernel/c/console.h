/* HAZOOM OS v6.0 - VGA Console Driver Header */
#ifndef HAZOOM_CONSOLE_H
#define HAZOOM_CONSOLE_H

#include <stdint.h>

/* VGA text mode constants */
#define VGA_WIDTH   80
#define VGA_HEIGHT  25
#define VGA_BUFFER  ((volatile uint16_t *)0xB8000)

/* VGA color enum */
enum vga_color {
    VGA_BLACK = 0,
    VGA_BLUE = 1,
    VGA_GREEN = 2,
    VGA_CYAN = 3,
    VGA_RED = 4,
    VGA_MAGENTA = 5,
    VGA_BROWN = 6,
    VGA_LIGHT_GREY = 7,
    VGA_DARK_GREY = 8,
    VGA_LIGHT_BLUE = 9,
    VGA_LIGHT_GREEN = 10,
    VGA_LIGHT_CYAN = 11,
    VGA_LIGHT_RED = 12,
    VGA_LIGHT_MAGENTA = 13,
    VGA_LIGHT_BROWN = 14,
    VGA_WHITE = 15
};

/* Console state */
extern uint16_t console_row;
extern uint16_t console_column;
extern uint8_t  console_color;

/* Function prototypes */
void vga_clear(void);
void vga_set_color(uint8_t fg, uint8_t bg);
void vga_putchar(char c);
void vga_print(const char *str);
void vga_print_at(const char *str, uint16_t row, uint16_t col);
void vga_update_cursor(void);

#endif /* HAZOOM_CONSOLE_H */
