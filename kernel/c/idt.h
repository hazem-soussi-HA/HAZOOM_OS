/* HAZOOM OS v6.0 - IDT Header */
#ifndef HAZOOM_IDT_H
#define HAZOOM_IDT_H

#include <stdint.h>

/* IDT entry structure - 16 bytes for x86-64 */
typedef struct {
    uint16_t offset_low;     /* Offset bits 0-15 */
    uint16_t selector;       /* Segment selector */
    uint8_t  ist;            /* Interrupt Stack Table index (0 = disabled) */
    uint8_t  type_attr;      /* Type and attributes */
    uint16_t offset_mid;     /* Offset bits 16-31 */
    uint32_t offset_high;    /* Offset bits 32-63 */
    uint32_t reserved;       /* Reserved, must be 0 */
} __attribute__((packed)) idt_entry_t;

/* IDT pointer structure for lidt */
typedef struct {
    uint16_t limit;          /* Size of IDT - 1 */
    uint64_t base;           /* Base address of IDT */
} __attribute__((packed)) idt_ptr_t;

/* Interrupt type attribute flags */
#define IDT_TYPE_INTERRUPT  0x8E  /* Present, Ring 0, 64-bit Interrupt Gate */
#define IDT_TYPE_TRAP       0x8F  /* Present, Ring 0, 64-bit Trap Gate */
#define IDT_TYPE_USER       0xEE  /* Present, Ring 3, 64-bit Interrupt Gate */

/* Exception numbers (0-31) */
#define IDT_EX_DIVIDE_BY_ZERO    0
#define IDT_EX_DEBUG             1
#define IDT_EX_NMI               2
#define IDT_EX_BREAKPOINT        3
#define IDT_EX_OVERFLOW          4
#define IDT_EX_BOUND_RANGE       5
#define IDT_EX_INVALID_OPCODE    6
#define IDT_EX_DEVICE_NOT_AVAIL  7
#define IDT_EX_DOUBLE_FAULT      8
#define IDT_EX_INVALID_TSS       10
#define IDT_EX_SEG_NOT_PRESENT   11
#define IDT_EX_STACK_FAULT       12
#define IDT_EX_GENERAL_PROTECT   13
#define IDT_EX_PAGE_FAULT        14
#define IDT_EX_FPU_ERROR         16
#define IDT_EX_ALIGNMENT_CHECK   17
#define IDT_EX_MACHINE_CHECK     18
#define IDT_EX_SIMD_FPU_ERROR    19

/* IRQ numbers (mapped to 32-47) */
#define IDT_IRQ_BASE            32
#define IDT_IRQ_TIMER           32
#define IDT_IRQ_KEYBOARD        33
#define IDT_IRQ_SYSCALL         48  /* Remapped PIC2 cascade */

/* Syscall interrupt */
#define IDT_SYSCALL             0x80

/* Function prototypes */
void idt_init(void);
void encode_idt_entry(idt_entry_t *entry, uint64_t offset, uint16_t selector,
                      uint8_t type);
void load_idt(idt_ptr_t *ptr);
void set_idt_gate(uint8_t vector, uint64_t handler, uint8_t type);

/* Exception/SYScall handler stubs (defined in assembly or idt.c) */
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
extern void irq128(void);  /* 0x80 syscall */

#endif /* HAZOOM_IDT_H */
