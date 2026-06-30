section .multiboot
align 8
mb_header_start:
    dd 0xe85250d6
    dd 0
    dd mb_header_end - mb_header_start
    dd 0x100000000 - (0xe85250d6 + 0 + (mb_header_end - mb_header_start))

    dw 0
    dw 0
    dd 8
mb_header_end:

section .text
global _start
extern kernel_main

_start:
    mov rsp, 0x3FFFFF0000
    and rsp, ~0xF
    cld
    xor rdi, rdi
    xor rsi, rsi
    call kernel_main
.hang:
    cli
    hlt
    jmp .hang
