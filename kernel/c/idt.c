/* HAZOOM OS v6.0 - IDT Implementation */
#include "idt.h"
#include "gdt.h"
#include "console.h"

/* IDT with 256 entries */
static idt_entry_t idt[256] __attribute__((aligned(16)));
static idt_ptr_t   idt_ptr;

/* Exception messages for default handlers */
static const char *exception_messages[] = {
    "Division By Zero",
    "Debug",
    "Non Maskable Interrupt",
    "Breakpoint",
    "Overflow",
    "Bound Range Exceeded",
    "Invalid Opcode",
    "Device Not Available",
    "Double Fault",
    "Coprocessor Segment Overrun",
    "Invalid TSS",
    "Segment Not Present",
    "Stack Fault",
    "General Protection Fault",
    "Page Fault",
    "Reserved",
    "x87 FPU Error",
    "Alignment Check",
    "Machine Check",
    "SIMD FPU Error"
};

/* Encode a single IDT entry */
void encode_idt_entry(idt_entry_t *entry, uint64_t offset, uint16_t selector,
                      uint8_t type) {
    entry->offset_low  = offset & 0xFFFF;
    entry->selector    = selector;
    entry->ist         = 0;
    entry->type_attr   = type;
    entry->offset_mid  = (offset >> 16) & 0xFFFF;
    entry->offset_high = (offset >> 32) & 0xFFFFFFFF;
    entry->reserved    = 0;
}

/* Load IDT using lidt instruction */
void load_idt(idt_ptr_t *ptr) {
    asm volatile("lidt %0" : : "m"(*ptr) : "memory");
}

/* Set a specific interrupt gate */
void set_idt_gate(uint8_t vector, uint64_t handler, uint8_t type) {
    encode_idt_entry(&idt[vector], handler, GDT_KERNEL_CODE, type);
}

/* Default exception handler */
void general_protection_fault(uint64_t error_code) {
    vga_set_color(VGA_WHITE, VGA_RED);
    vga_print("\n[FAULT] General Protection Fault! Error code: ");
    /* Print error code as hex - simplified */
    vga_print("0x");
    /* Just halt for now */
    asm volatile("cli; hlt");
}

void page_fault_handler(uint64_t address, uint64_t error_code) {
    vga_set_color(VGA_WHITE, VGA_RED);
    vga_print("\n[FAULT] Page Fault! Address: ");
    vga_print(" Error code: ");
    asm volatile("cli; hlt");
}

void double_fault(uint64_t error_code) {
    vga_set_color(VGA_WHITE, VGA_RED);
    vga_print("\n[FATAL] Double Fault! System halted.");
    asm volatile("cli; hlt");
}

/* Default interrupt handler for unhandled interrupts */
void default_interrupt_handler(void) {
    /* Do nothing, just return */
}

/* Common ISR handler called from assembly stubs */
void isr_handler(uint64_t int_num, void *frame) {
    if (int_num < 20) {
        /* Exception */
        vga_set_color(VGA_WHITE, VGA_RED);
        vga_print("\n[EXCEPTION] ");
        vga_print(exception_messages[int_num]);
        vga_print(" - System halted.");
        asm volatile("cli; hlt");
    }
}

/* Common IRQ handler called from assembly stubs */
void irq_handler(uint64_t int_num, void *frame) {
    /* Handle IRQs - for now just acknowledge */
    /* Timer (IRQ0) - just return, will be used for scheduling later */
    /* Keyboard (IRQ1) - read and discard */
    if (int_num == 33) { /* Keyboard */
        uint8_t scancode;
        asm volatile("inb $0x60, %0" : "=a"(scancode));
    }
}

/* Initialize the IDT */
void idt_init(void) {
    /* Clear IDT */
    for (int i = 0; i < 256; i++) {
        idt[i].offset_low  = 0;
        idt[i].selector    = 0;
        idt[i].ist         = 0;
        idt[i].type_attr   = 0;
        idt[i].offset_mid  = 0;
        idt[i].offset_high = 0;
        idt[i].reserved    = 0;
    }

    /* Install exception handlers (0-31) using extern assembly stubs */
    set_idt_gate(0,  (uint64_t)isr0,  IDT_TYPE_INTERRUPT);
    set_idt_gate(1,  (uint64_t)isr1,  IDT_TYPE_INTERRUPT);
    set_idt_gate(2,  (uint64_t)isr2,  IDT_TYPE_INTERRUPT);
    set_idt_gate(3,  (uint64_t)isr3,  IDT_TYPE_TRAP);
    set_idt_gate(4,  (uint64_t)isr4,  IDT_TYPE_INTERRUPT);
    set_idt_gate(5,  (uint64_t)isr5,  IDT_TYPE_INTERRUPT);
    set_idt_gate(6,  (uint64_t)isr6,  IDT_TYPE_INTERRUPT);
    set_idt_gate(7,  (uint64_t)isr7,  IDT_TYPE_INTERRUPT);
    set_idt_gate(8,  (uint64_t)isr8,  IDT_TYPE_INTERRUPT);
    set_idt_gate(10, (uint64_t)isr10, IDT_TYPE_INTERRUPT);
    set_idt_gate(11, (uint64_t)isr11, IDT_TYPE_INTERRUPT);
    set_idt_gate(12, (uint64_t)isr12, IDT_TYPE_INTERRUPT);
    set_idt_gate(13, (uint64_t)isr13, IDT_TYPE_INTERRUPT);
    set_idt_gate(14, (uint64_t)isr14, IDT_TYPE_INTERRUPT);
    set_idt_gate(16, (uint64_t)isr16, IDT_TYPE_INTERRUPT);
    set_idt_gate(17, (uint64_t)isr17, IDT_TYPE_INTERRUPT);
    set_idt_gate(18, (uint64_t)isr18, IDT_TYPE_INTERRUPT);
    set_idt_gate(19, (uint64_t)isr19, IDT_TYPE_INTERRUPT);

    /* Install IRQ handlers (32-47) */
    set_idt_gate(32, (uint64_t)irq0, IDT_TYPE_INTERRUPT);
    set_idt_gate(33, (uint64_t)irq1, IDT_TYPE_INTERRUPT);

    /* Install syscall handler (0x80) - user-callable */
    set_idt_gate(0x80, (uint64_t)irq128, IDT_TYPE_USER);

    /* Set up IDT pointer and load */
    idt_ptr.limit = sizeof(idt) - 1;
    idt_ptr.base  = (uint64_t)&idt;

    load_idt(&idt_ptr);
}
