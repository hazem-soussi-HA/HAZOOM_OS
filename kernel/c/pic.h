/* HAZOOM OS v6.0 - 8259A Programmable Interrupt Controller */
#ifndef HAZOOM_PIC_H
#define HAZOOM_PIC_H

#include <stdint.h>

/* Remap the master/slave PIC so IRQs no longer collide with CPU
   exceptions (which occupy vectors 0-31). After this, IRQ0=vector 0x20,
   IRQ1=vector 0x21, ... IRQ15=vector 0x2F. */
void pic_remap(uint8_t offset_master, uint8_t offset_slave);

/* Remap to the standard 0x20/0x28 layout and unmask only the timer
   (IRQ0) and keyboard (IRQ1). All other IRQs stay masked to avoid
   spurious interrupts. */
void pic_init(void);

/* End-of-interrupt: tell the PIC(s) an IRQ handler has finished. */
void pic_eoi(uint8_t irq);

#endif /* HAZOOM_PIC_H */
