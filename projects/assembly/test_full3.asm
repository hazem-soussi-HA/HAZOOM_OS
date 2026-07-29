; test_full3.asm — full 256x256, write multiple height values
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
    THREE_F:    dd 3.0
    HALF_F:     dd 0.5
    INTMAX_F:   dd 2147483648.0
section .bss
    align 16
    heightmap:  resd GRID_W * GRID_H
section .text
    global _start

_start:
    call    gen_heightmap

    ; Write 16 height values to see the range
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [heightmap]
    mov     rdx, 64
    syscall

    mov     rax, 60
    xor     rdi, rdi
    syscall

hash2i:
    mov     eax, edi
    imul    eax, 127
    mov     ecx, esi
    imul    ecx, 311
    add     eax, ecx
    mov     ecx, edi
    imul    ecx, 269
    mov     edx, esi
    imul    edx, 173
    add     ecx, edx
    xor     eax, ecx
    and     eax, 0x7FFFFFFF
    ret

noise2d:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 16
    mov     eax, 0x42C80000
    movd    xmm4, eax
    mulss   xmm0, xmm4
    mulss   xmm1, xmm4
    cvttss2si   edi, xmm0
    cvttss2si   esi, xmm1
    call    hash2i
    cvtsi2ss    xmm0, eax
    divss       xmm0, [INTMAX_F]
    add     rsp, 16
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
    divss       xmm0, [GRID_WF]
    mulss       xmm0, [TERR_SC]
    subss       xmm0, [HALF_SC]
    cvtsi2ss    xmm1, r12d
    divss       xmm1, [GRID_HF]
    mulss       xmm1, [TERR_SC]
    subss       xmm1, [HALF_SC]
    movss       [rbp-8], xmm0
    movss       [rbp-4], xmm1
    mulss       xmm0, [NOISE_S1]
    mulss       xmm1, [NOISE_S1]
    call    fbm
    mulss       xmm0, [H_MUL]
    mulss       xmm0, [HALF_F]
    addss       xmm0, [HALF_F]
    lea     rax, [r12 + r12*4]   ; rax = j*5
    lea     rax, [rax + rax*4]   ; rax = j*25
    shl     rax, 6               ; rax = j*25*64 = j*1600... no this is wrong
    ; Actually: j*256 + i = j<<8 + i
    mov     rax, r12
    shl     rax, 8               ; j*256
    add     rax, r13             ; j*256+i
    shl     rax, 2               ; *4 bytes
    lea     r14, [heightmap]
    movss   [r14 + rax], xmm0
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
