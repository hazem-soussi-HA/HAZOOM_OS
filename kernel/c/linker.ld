/* HAZOOM OS v6.0 - Linker Script */

ENTRY(_start)

SECTIONS
{
    /* The multiboot headers MUST sit at file offset 0 so bootloaders and
       QEMU's -kernel multiboot probe (which scans the first bytes of the
       file) can find the 0x1BADB002 / 0xe85250d6 magic. We give it vaddr 0
       but it is never executed there; the kernel proper lives at 1 MiB. */
    . = 0x0;
    .multiboot : {
        *(.multiboot)
    }

    /* Kernel proper starts at 1 MiB. */
    . = 0x100000;

    /* Boot-time page tables and GDT (must be in the loaded image). */
    .bootbss : {
        *(.bootbss)
    }
    .bootdata : {
        *(.bootdata)
    }

    /* Align to 4KB page boundary */
    . = ALIGN(4K);

    /* .text section - executable code */
    .text : {
        *(.text)
        *(.text.*)
    }

    /* Align to 4KB page boundary */
    . = ALIGN(4K);

    /* .rodata section - read-only data */
    .rodata : {
        *(.rodata)
        *(.rodata.*)
    }

    /* Align to 4KB page boundary */
    . = ALIGN(4K);

    /* .data section - initialized data */
    .data : {
        *(.data)
        *(.data.*)
    }

    /* Align to 4KB page boundary */
    . = ALIGN(4K);

    /* .bss section - uninitialized data */
    .bss : {
        __bss_start = .;
        *(.bss)
        *(.bss.*)
        *(COMMON)
        __bss_end = .;
    }

    /* Align to 4KB page boundary */
    . = ALIGN(4K);

    /* Kernel end marker */
    __kernel_end = .;

    /* Discard unnecessary sections */
    /DISCARD/ : {
        *(.comment)
        *(.eh_frame)
        *(.eh_frame_hdr)
    }
}
