; test_bare.asm — minimal ELF test
section .data
    magic: db 'HZSTR'
    grid_w: dd 16
    grid_h: dd 16
    stride: dd 48
    idx_cnt: dd 15*15*6
    reserved: dd 0
section .bss
    buf: resb 64
section .text
    global _start
_start:
    mov rax, 1
    mov rdi, 1
    lea rsi, [magic]
    mov rdx, 5
    syscall

    mov rax, 1
    mov rdi, 1
    lea rsi, [grid_w]
    mov rdx, 4
    syscall

    mov rax, 1
    mov rdi, 1
    lea rsi, [grid_h]
    mov rdx, 4
    syscall

    mov rax, 1
    mov rdi, 1
    lea rsi, [stride]
    mov rdx, 4
    syscall

    mov rax, 1
    mov rdi, 1
    lea rsi, [idx_cnt]
    mov rdx, 4
    syscall

    mov rax, 1
    mov rdi, 1
    lea rsi, [reserved]
    mov rdx, 4
    syscall

    mov r12, 256
.loop:
    mov rax, 1
    mov rdi, 1
    lea rsi, [buf]
    mov rdx, 48
    syscall
    dec r12
    jnz .loop

    mov rax, 60
    xor rdi, rdi
    syscall
