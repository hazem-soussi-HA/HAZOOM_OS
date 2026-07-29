; test_minimal.asm — minimal test to find the crash
section .text
    global _start

_start:
    ; Test: just write "OK" and exit
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [msg]
    mov     rdx, 3
    syscall

    mov     rax, 60
    xor     rdi, rdi
    syscall

section .data
    msg: db "OK\n"
