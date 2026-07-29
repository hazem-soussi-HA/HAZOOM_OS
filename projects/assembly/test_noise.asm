; test_noise.asm — test noise function in isolation
section .data
    align 16
    ONE_F:      dd 1.0
    ZERO_F:     dd 0.0
    TWO_F:      dd 2.0
    THREE_F:    dd 3.0
    HALF_F:     dd 0.5
    INTMAX_F:   dd 2147483648.0
    NOISE_S1:   dd 0.08
    H_MUL:      dd 4.0
    TERR_SC:    dd 20.0
    HALF_SC:    dd 10.0
    GRID_WF:    dd 256.0
    GRID_HF:    dd 256.0
    V_S:        dd 0.04
    V_O:        dd 99.0
    SIGN_M:     dd 0x80000000
                dd 0x80000000
                dd 0x80000000
                dd 0x80000000
    fmt:        db "noise=",0x0a,0
    newline:    db 10

section .bss
    heightmap:  resd 256 * 256
    tmp_d:      resd 1

section .text
    global _start

_start:
    ; Test: compute one noise value
    movss   xmm0, [NOISE_S1]
    movss   xmm1, [NOISE_S1]
    call    noise2d

    ; Write result as raw float bytes
    movss   [tmp_d], xmm0
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [tmp_d]
    mov     rdx, 4
    syscall

    ; Write newline
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [newline]
    mov     rdx, 1
    syscall

    ; Test fbm
    movss   xmm0, [NOISE_S1]
    movss   xmm1, [NOISE_S1]
    call    fbm

    movss   [tmp_d], xmm0
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [tmp_d]
    mov     rdx, 4
    syscall

    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [newline]
    mov     rdx, 1
    syscall

    ; Test gen_heightmap (just first few pixels)
    call    gen_heightmap

    ; Write first height value
    movss   xmm0, [heightmap]
    movss   [tmp_d], xmm0
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [tmp_d]
    mov     rdx, 4
    syscall

    mov     rax, 60
    xor     rdi, rdi
    syscall

; ---- hash2i ----
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

; ---- noise2d ----
noise2d:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 32

    cvttss2si   r12d, xmm0
    cvttss2si   r13d, xmm1

    cvtsi2ss    xmm2, r12d
    subss       xmm0, xmm2       ; fx
    cvtsi2ss    xmm2, r13d
    subss       xmm1, xmm2       ; fz

    ; smoothstep sx
    movss       xmm4, xmm0
    mulss       xmm4, xmm0
    movss       xmm5, xmm0
    addss       xmm5, xmm5
    movss       xmm6, [THREE_F]
    subss       xmm6, xmm5
    mulss       xmm4, xmm6       ; sx

    ; smoothstep sz
    movss       xmm5, xmm1
    mulss       xmm5, xmm1
    movss       xmm6, xmm1
    addss       xmm6, xmm6
    movss       xmm7, [THREE_F]
    subss       xmm7, xmm6
    mulss       xmm5, xmm7       ; sz

    ; Hash 4 corners
    mov     r8d, r12d
    mov     r9d, r13d
    call    hash2i
    cvtsi2ss    xmm1, eax
    divss       xmm1, [INTMAX_F] ; n00

    mov     r8d, r12d
    inc     r8d
    mov     r9d, r13d
    call    hash2i
    cvtsi2ss    xmm2, eax
    divss       xmm2, [INTMAX_F] ; n10

    mov     r8d, r12d
    mov     r9d, r13d
    inc     r9d
    call    hash2i
    cvtsi2ss    xmm3, eax
    divss       xmm3, [INTMAX_F] ; n01

    mov     r8d, r12d
    inc     r8d
    mov     r9d, r13d
    inc     r9d
    call    hash2i
    cvtsi2ss    xmm6, eax
    divss       xmm6, [INTMAX_F] ; n11

    ; Bilinear lerp
    movss       xmm7, xmm2
    subss       xmm7, xmm1
    mulss       xmm7, xmm4
    addss       xmm7, xmm1       ; nx0

    movss       xmm0, xmm6
    subss       xmm0, xmm3
    mulss       xmm0, xmm4
    addss       xmm0, xmm3       ; nx1

    subss       xmm0, xmm7
    mulss       xmm0, xmm5
    addss       xmm0, xmm7

    add     rsp, 32
    pop     r13
    pop     r12
    pop     rbp
    ret

; ---- fbm ----
fbm:
    push    rbp
    mov     rbp, rsp
    push    r12
    sub     rsp, 16

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
    add     rsp, 16
    pop     r12
    pop     rbp
    ret

; ---- gen_heightmap ----
gen_heightmap:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12

.gh_j:
    cmp     r12, 256
    jge     .gh_done

    xor     r13, r13

.gh_i:
    cmp     r13, 256
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

    ; Valley
    movss       xmm0, [rbp-8]
    mulss       xmm0, [V_S]
    addss       xmm0, [V_O]
    movss       xmm1, [rbp-4]
    mulss       xmm1, [V_S]
    call    noise2d
    mulss       xmm4, [HALF_F]
    addss       xmm4, [HALF_F]

    mov     rax, r12
    imul    rax, 256
    add     rax, r13
    lea     r14, [heightmap]
    movss   [r14 + rax*4], xmm4

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
