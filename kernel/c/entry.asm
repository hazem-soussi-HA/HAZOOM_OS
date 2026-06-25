; HAZOOM OS v6.0 - Kernel Entry Point
; x86-64 Assembly entry point

section .text
global _start
extern kernel_main

_start:
    ; Set up initial stack at top of 4MB identity-mapped area
    ; UEFI/bootloader should have identity-mapped first 4MB
    mov rsp, 0x3FFFFF0000    ; Top of 4MB area (below 4MB mark)
    and rsp, ~0xF            ; Align to 16 bytes

    ; Clear direction flag for string operations
    cld

    ; Pass boot info (if in rdi/esi from bootloader) to kernel_main
    ; kernel_main receives: boot_magic (rdi), boot_info (rsi)
    ; For now, pass 0, 0 as defaults
    xor rdi, rdi
    xor rsi, rsi

    ; Call the C kernel main
    call kernel_main

    ; If kernel_main returns, halt the CPU
.hang:
    cli
    hlt
    jmp .hang
