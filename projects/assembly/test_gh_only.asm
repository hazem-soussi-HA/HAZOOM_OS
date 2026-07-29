; test_gh_only.asm — ONLY gen_heightmap, nothing else, 256x256
%define GRID_W 256
%define GRID_H 256

section .data
    align 16
    GRID_WF:    dd 256.0
    GRID_HF:    dd 256.0
    TERR_SC:    dd 20.0
    HALF_SC:    dd 10.0
    H_MUL:      dd 4.0
    NOISE_S1:   dd 0.08
    ONE_F:      dd 1.0
    TWO_F:      dd 2.0
    THREE_F:    dd 3.0
    HALF_F:     dd 0.5
    INTMAX_F:   dd 2147483648.0
    V_S:        dd 0.04
    V_O:        dd 99.0

section .bss
    align 16
    heightmap:  resd GRID_W * GRID_H

section .text
    global _start

_start:
    call    gen_heightmap
    ; Write first height value
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [heightmap]
    mov     rdx, 4
    syscall
    mov     rax, 60
    xor     rdi, rdi
    syscall

hash2i:
    mov     eax, r8d
    imul    eax, 127
    mov     ecx, r9d
    imul    ecx, 311
    add     eax, ecx
    mov     ecx, r8d
    imul    ecx, 269
    mov     edx, r9d
    imul    edx, 173
    add     ecx, edx
    xor     eax, ecx
    and     eax, 0x7FFFFFFF
    ret

noise2d:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 32
    cvttss2si   r12d, xmm0
    cvttss2si   r13d, xmm1
    cvtsi2ss    xmm2, r12d
    subss       xmm0, xmm2
    cvtsi2ss    xmm2, r13d
    subss       xmm1, xmm2
    movss   xmm4, xmm0
    mulss   xmm4, xmm0
    movss   xmm5, xmm0
    addss   xmm5, xmm5
    movss   xmm6, [THREE_F]
    subss   xmm6, xmm5
    mulss   xmm4, xmm6
    movss   xmm5, xmm1
    mulss   xmm5, xmm1
    movss   xmm6, xmm1
    addss   xmm6, xmm6
    movss   xmm7, [THREE_F]
    subss   xmm7, xmm6
    mulss   xmm5, xmm7
    mov     r8d, r12d
    mov     r9d, r13d
    call    hash2i
    cvtsi2ss    xmm1, eax
    divss       xmm1, [INTMAX_F]
    lea     r8d, [r12d + 1]
    mov     r9d, r13d
    call    hash2i
    cvtsi2ss    xmm2, eax
    divss       xmm2, [INTMAX_F]
    mov     r8d, r12d
    lea     r9d, [r13d + 1]
    call    hash2i
    cvtsi2ss    xmm3, eax
    divss       xmm3, [INTMAX_F]
    lea     r8d, [r12d + 1]
    lea     r9d, [r13d + 1]
    call    hash2i
    cvtsi2ss    xmm6, eax
    divss       xmm6, [INTMAX_F]
    movss   xmm7, xmm2
    subss   xmm7, xmm1
    mulss   xmm7, xmm4
    addss   xmm7, xmm1
    movss   xmm0, xmm6
    subss   xmm0, xmm3
    mulss   xmm0, xmm4
    addss   xmm0, xmm3
    subss   xmm0, xmm7
    mulss   xmm0, xmm5
    addss   xmm0, xmm7
    add     rsp, 32
    pop     r13
    pop     r12
    pop     rbp
    ret

fbm:
    push    rbp
    mov     rbp, rsp
    push    r12
    sub     rsp, 32
    movss   [rbp-8], xmm0
    movss   [rbp-4], xmm1
    xor     r12, r12
    pxor    xmm6, xmm6
    movss   xmm7, [ONE_F]
.fbm_loop:
    cmp     r12, 4
    jge     .fbm_done
    movss   xmm0, [rbp-8]
    movss   xmm1, [rbp-4]
    call    noise2d
    mulss   xmm0, xmm7
    addss   xmm6, xmm0
    mulss   xmm7, [HALF_F]
    movss   xmm0, [rbp-8]
    addss   xmm0, xmm0
    movss   [rbp-8], xmm0
    movss   xmm0, [rbp-4]
    addss   xmm0, xmm0
    movss   [rbp-4], xmm0
    inc     r12
    jmp     .fbm_loop
.fbm_done:
    movss   xmm0, xmm6
    add     rsp, 32
    pop     r12
    pop     rbp
    ret

gen_heightmap:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16
    xor     r12, r12
.gh_j:
    cmp     r12, GRID_H
    jge     .gh_done
    xor     r13, r13
.gh_i:
    cmp     r13, GRID_W
    jge     .gh_nextj
    cvtsi2ss    xmm0, r13d
    cvtsi2ss    xmm1, r12d
    divss       xmm0, [GRID_WF]
    divss       xmm1, [GRID_HF]
    mulss       xmm0, [TERR_SC]
    mulss       xmm1, [TERR_SC]
    subss       xmm0, [HALF_SC]
    subss       xmm1, [HALF_SC]
    movss       [rbp-8], xmm0
    movss       [rbp-4], xmm1
    mulss       xmm0, [NOISE_S1]
    mulss       xmm1, [NOISE_S1]
    call    fbm
    mulss       xmm0, [H_MUL]
    movss       xmm4, xmm0
    movss       xmm0, [rbp-8]
    mulss       xmm0, [V_S]
    addss       xmm0, [V_O]
    movss       xmm1, [rbp-4]
    mulss       xmm1, [V_S]
    call    noise2d
    mulss       xmm4, [HALF_F]
    addss       xmm4, [HALF_F]
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [heightmap]
    movss   [r14 + rax], xmm4
    inc     r13
    jmp     .gh_i
.gh_nextj:
    inc     r12
    jmp     .gh_j
.gh_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret
