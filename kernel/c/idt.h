#ifndef HAZOOM_IDT_H
#define HAZOOM_IDT_H

#include <stdint.h>

typedef struct {
    uint16_t offset_low;
    uint16_t selector;
    uint8_t  ist;
    uint8_t  type_attr;
    uint16_t offset_mid;
    uint32_t offset_high;
    uint32_t reserved;
} __attribute__((packed)) idt_entry_t;

typedef struct {
    uint16_t limit;
    uint64_t base;
} __attribute__((packed)) idt_ptr_t;

#define IDT_TYPE_INTERRUPT  0x8E
#define IDT_TYPE_TRAP       0x8F
#define IDT_TYPE_USER       0xEE

#define IDT_IRQ_BASE        32
#define IDT_IRQ_TIMER       32
#define IDT_IRQ_KEYBOARD    33
#define IDT_SYSCALL         0x80

void idt_init(void);
void set_idt_gate(uint8_t vector, uint64_t handler, uint8_t type);
void load_idt(idt_ptr_t *ptr);
void encode_idt_entry(idt_entry_t *entry, uint64_t offset, uint16_t selector, uint8_t type);
void keyboard_init(void);
char keyboard_getchar(void);
int keyboard_data_available(void);

extern void isr0(void);
extern void isr1(void);
extern void isr2(void);
extern void isr3(void);
extern void isr4(void);
extern void isr5(void);
extern void isr6(void);
extern void isr7(void);
extern void isr8(void);
extern void isr10(void);
extern void isr11(void);
extern void isr12(void);
extern void isr13(void);
extern void isr14(void);
extern void isr16(void);
extern void isr17(void);
extern void isr18(void);
extern void isr19(void);
extern void irq0(void);
extern void irq1(void);
extern void irq128(void);

#endif
