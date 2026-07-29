/* HAZOOM OS v6.0 - Linker Script */

ENTRY(_start)

SECTIONS
{
    /* Kernel starts at 1 MiB. */
    . = 0x100000;

    /* Multiboot2 header MUST be within the first 32KB of the image so the
       bootloader can find the magic. Place it first. */
    .multiboot : {
        *(.multiboot)
    }

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
