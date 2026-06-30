#include "idt.h"
#include "gdt.h"
#include "console.h"
#include "process.h"
#include <stdint.h>

static idt_entry_t idt[256] __attribute__((aligned(16)));
static idt_ptr_t   idt_ptr;

#define KEYBUF_SIZE 256
static volatile char keybuf[KEYBUF_SIZE];
static volatile int keybuf_head = 0;
static volatile int keybuf_tail = 0;
static volatile int keybuf_count = 0;

static const char scancode_ascii[] = {
    0, 0, '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 0,
    0, 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', 0,
    0, 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', '\'', '`',
    0, '\\', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 0,
    '*', 0, ' '
};

static const char scancode_shift[] = {
    0, 0, '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', 0,
    0, 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '{', '}', 0,
    0, 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ':', '"', '~',
    0, '|', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '<', '>', '?', 0,
    '*', 0, ' '
};

static const char *exception_messages[] = {
    "Division By Zero", "Debug", "Non Maskable Interrupt", "Breakpoint",
    "Overflow", "Bound Range Exceeded", "Invalid Opcode",
    "Device Not Available", "Double Fault", "Coprocessor Segment Overrun",
    "Invalid TSS", "Segment Not Present", "Stack Fault",
    "General Protection Fault", "Page Fault", "Reserved",
    "x87 FPU Error", "Alignment Check", "Machine Check", "SIMD FPU Error"
};

void encode_idt_entry(idt_entry_t *entry, uint64_t offset, uint16_t selector, uint8_t type) {
    entry->offset_low  = offset & 0xFFFF;
    entry->selector    = selector;
    entry->ist         = 0;
    entry->type_attr   = type;
    entry->offset_mid  = (offset >> 16) & 0xFFFF;
    entry->offset_high = (offset >> 32) & 0xFFFFFFFF;
    entry->reserved    = 0;
}

void load_idt(idt_ptr_t *ptr) {
    asm volatile("lidt %0" : : "m"(*ptr) : "memory");
}

void set_idt_gate(uint8_t vector, uint64_t handler, uint8_t type) {
    encode_idt_entry(&idt[vector], handler, GDT_KERNEL_CODE, type);
}

void general_protection_fault(uint64_t error_code) {
    vga_set_color(VGA_WHITE, VGA_RED);
    vga_print("\n[FAULT] General Protection Fault! Halting.\n");
    asm volatile("cli; hlt");
}

void page_fault_handler(uint64_t address, uint64_t error_code) {
    vga_set_color(VGA_WHITE, VGA_RED);
    vga_print("\n[FAULT] Page Fault at ");
    vga_print(" - Halting.\n");
    asm volatile("cli; hlt");
}

void double_fault(uint64_t error_code) {
    vga_set_color(VGA_WHITE, VGA_RED);
    vga_print("\n[FATAL] Double Fault! System halted.\n");
    asm volatile("cli; hlt");
}

void isr_handler(uint64_t int_num, void *frame) {
    if (int_num < 20 && int_num != 3) {
        vga_set_color(VGA_WHITE, VGA_RED);
        vga_print("\n[EXCEPTION] ");
        if (int_num < sizeof(exception_messages)/sizeof(exception_messages[0])) {
            vga_print(exception_messages[int_num]);
        }
        vga_print(" - System halted.\n");
        asm volatile("cli; hlt");
    }
}

void irq_handler(uint64_t int_num, void *frame) {
    if (int_num == IDT_IRQ_TIMER) {
        system_ticks++;
        if (current_process) {
            if (current_process->ticks_remaining > 0) {
                current_process->ticks_remaining--;
            }
            if (current_process->ticks_remaining == 0) {
                if (current_process->cpu_state.rip != (uint64_t)0) {
                    cpu_state_t *old_state = (cpu_state_t *)frame;
                    PCB_t *old = current_process;
                    schedule(old_state);
                    if (old != current_process) {
                        old->ticks_remaining = TIME_QUANTUM + old->priority;
                    }
                }
            }
        }
    }
    else if (int_num == IDT_IRQ_KEYBOARD) {
        uint8_t scancode;
        asm volatile("inb $0x60, %0" : "=a"(scancode));
        if (!(scancode & 0x80)) {
            char c = scancode_ascii[scancode];
            if (c && keybuf_count < KEYBUF_SIZE) {
                keybuf[keybuf_head] = c;
                keybuf_head = (keybuf_head + 1) % KEYBUF_SIZE;
                keybuf_count++;
            }
        }
    }
}

void syscall_handler(uint64_t syscall_num, uint64_t arg1, uint64_t arg2, uint64_t arg3, uint64_t arg4, uint64_t arg5) {
    switch (syscall_num) {
        case 0:
            vga_print("[SYSCALL] getpid\n");
            current_process->cpu_state.rax = current_process->pid;
            break;
        case 1:
            if (current_process) {
                terminate_process(current_process->pid);
            }
            break;
        case 2:
            vga_print("[SYSCALL] write: ");
            {
                char *str = (char *)arg1;
                while (*str && *str != '\n') {
                    vga_putchar(*str);
                    str++;
                }
                vga_putchar('\n');
            }
            break;
        case 3:
            current_process->cpu_state.rax = keyboard_getchar();
            break;
        default:
            vga_print("[SYSCALL] Unknown syscall: ");
            break;
    }
}

void idt_init(void) {
    for (int i = 0; i < 256; i++) {
        idt[i].offset_low  = 0;
        idt[i].selector    = 0;
        idt[i].ist         = 0;
        idt[i].type_attr   = 0;
        idt[i].offset_mid  = 0;
        idt[i].offset_high = 0;
        idt[i].reserved    = 0;
    }

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

    set_idt_gate(32, (uint64_t)irq0, IDT_TYPE_INTERRUPT);
    set_idt_gate(33, (uint64_t)irq1, IDT_TYPE_INTERRUPT);

    set_idt_gate(0x80, (uint64_t)irq128, IDT_TYPE_USER);

    idt_ptr.limit = sizeof(idt) - 1;
    idt_ptr.base  = (uint64_t)&idt;
    load_idt(&idt_ptr);

    keybuf_head = 0;
    keybuf_tail = 0;
    keybuf_count = 0;
}

void keyboard_init(void) {
    vga_print("[KBD] Initializing keyboard...\n");
    keybuf_head = 0;
    keybuf_tail = 0;
    keybuf_count = 0;
}

int keyboard_data_available(void) {
    return keybuf_count > 0;
}

char keyboard_getchar(void) {
    while (keybuf_count == 0) {
        asm volatile("pause");
    }
    char c = keybuf[keybuf_tail];
    keybuf_tail = (keybuf_tail + 1) % KEYBUF_SIZE;
    keybuf_count--;
    return c;
}
