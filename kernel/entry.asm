global _start

section .multiboot_header
    header_type    equ 0xe3fe5fae
    header_flags   equ 0x00000003

    dd 0xe3fe5fae
    dd 0x00000003
    dd 0x00000000
    dd 0xf0000000
    dd 0xc0200000
    dd 0xc0200000
    dd 0xc0200000
    dd _start

section .text
_start:
    mov esp, stack_space
    call kernel_main

section .bss
    resb 8192
stack_space:
    resb 4096