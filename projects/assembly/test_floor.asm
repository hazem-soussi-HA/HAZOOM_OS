; test_floor.asm — test floor fix
section .data
    align 16
    TEST1:  dd -0.8
    TEST2:  dd -1.5
    TEST3:  dd 0.5
    TEST4:  dd -0.1
    ONE_F:  dd 1.0
section .bss
    align 16
    results: resd 8
section .text
    global _start
_start:
    ; Test floor of -0.8 using cvttss2si + fix
    movss   xmm0, [TEST1]
    call    my_floor
    mov     [results], eax

    movss   xmm0, [TEST2]
    call    my_floor
    mov     [results+4], eax

    movss   xmm0, [TEST3]
    call    my_floor
    mov     [results+8], eax

    movss   xmm0, [TEST4]
    call    my_floor
    mov     [results+12], eax

    ; Write results
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [results]
    mov     rdx, 16
    syscall

    mov     rax, 60
    xor     rdi, rdi
    syscall

; my_floor: xmm0 -> eax (floor using cvttss2si + fixup)
my_floor:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 8

    cvttss2si   eax, xmm0       ; truncate toward zero
    cvtsi2ss    xmm1, eax       ; convert back to float
    ; if original < truncated (i.e. original was negative and not integer), subtract 1
    ucomiss     xmm0, xmm1      ; compare original vs truncated
    jae         .no_fix         ; if original >= truncated, no fix needed
    ; Check if original is negative (not just less due to NaN)
    xor         ecx, ecx
    ucomiss     xmm0, xmm0      ; check NaN
    jp          .no_fix         ; NaN: skip fix
    sub     eax, 1              ; floor fix: subtract 1
.no_fix:
    leave
    ret
