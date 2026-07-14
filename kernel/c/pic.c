/* HAZOOM OS v6.0 - 8259A PIC driver */
#include "pic.h"

#define PIC1_CMD  0x20
#define PIC1_DATA 0x21
#define PIC2_CMD  0xA0
#define PIC2_DATA 0xA1

#define ICW1_ICW4      0x01
#define ICW1_SINGLE    0x02
#define ICW1_INTERVAL4 0x04
#define ICW1_LEVEL     0x08
#define ICW1_INIT      0x10

#define ICW4_8086       0x01
#define ICW4_AUTO       0x02
#define ICW4_BUF_SLAVE  0x08
#define ICW4_BUF_MASTER 0x0C
#define ICW4_SFNM       0x10

static inline void outb(uint16_t port, uint8_t value) {
    __asm__ volatile("outb %0, %1" : : "a"(value), "Nd"(port));
}

static inline uint8_t inb(uint16_t port) {
    uint8_t ret;
    __asm__ volatile("inb %1, %0" : "=a"(ret) : "Nd"(port));
    return ret;
}

void pic_remap(uint8_t offset_master, uint8_t offset_slave) {
    uint8_t mask_master = inb(PIC1_DATA);
    uint8_t mask_slave  = inb(PIC2_DATA);

    outb(PIC1_CMD, ICW1_INIT | ICW1_ICW4);
    outb(PIC2_CMD, ICW1_INIT | ICW1_ICW4);
    outb(PIC1_DATA, offset_master);
    outb(PIC2_DATA, offset_slave);
    outb(PIC1_DATA, 4);   /* PIC2 is slave, connected to IRQ2 of master */
    outb(PIC2_DATA, 2);
    outb(PIC1_DATA, ICW4_8086);
    outb(PIC2_DATA, ICW4_8086);

    outb(PIC1_DATA, mask_master);
    outb(PIC2_DATA, mask_slave);
}

void pic_init(void) {
    /* Remap to 0x20 (master) / 0x28 (slave). */
    pic_remap(0x20, 0x28);

    /* Mask all IRQs, then explicitly unmask the timer (0) and keyboard (1). */
    outb(PIC1_DATA, 0xFF);
    outb(PIC2_DATA, 0xFF);
    uint8_t master_mask = inb(PIC1_DATA);
    master_mask &= ~(1 << 0);   /* IRQ0 - timer */
    master_mask &= ~(1 << 1);   /* IRQ1 - keyboard */
    outb(PIC1_DATA, master_mask);
}

void pic_eoi(uint8_t irq) {
    if (irq >= 8) outb(PIC2_CMD, 0x20);
    outb(PIC1_CMD, 0x20);
}
