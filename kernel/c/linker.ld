/* HAZOOM OS v6.0 - Linker Script */
/* Kernel loaded at 1MB (0x100000) by bootloader */

ENTRY(_start)

SECTIONS
{
    /* Kernel starts at 1MB */
    . = 0x100000;

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
        *(.note.*)
        *(.eh_frame)
        *(.eh_frame_hdr)
    }
}
