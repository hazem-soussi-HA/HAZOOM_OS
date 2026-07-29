; test_gh2.asm — test gen_heightmap step by step, proper NASM syntax
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

    ; Write first 4 bytes of heightmap as proof
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [heightmap]
    mov     rdx, 4
    syscall

    mov     rax, 60
    xor     rdi, rdi
    syscall

; ---- hash2i ----
; Input: r8d=i, r9d=j  Output: eax=hash
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
; Input: xmm0=x, xmm1=z  Output: xmm0=noise
noise2d:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 32

    cvttss2si   r12d, xmm0       ; ix
    cvttss2si   r13d, xmm1       ; iz

    cvtsi2ss    xmm2, r12d
    subss       xmm0, xmm2       ; fx
    cvtsi2ss    xmm2, r13d
    subss       xmm1, xmm2       ; fz

    ; sx = fx*fx*(3-2*fx)
    movss       xmm4, xmm0
    mulss       xmm4, xmm0       ; fx*fx
    movss       xmm5, xmm0
    addss       xmm5, xmm5       ; 2*fx
    movss       xmm6, [THREE_F]
    subss       xmm6, xmm5       ; 3-2*fx
    mulss       xmm4, xmm6       ; sx

    ; sz = fz*fz*(3-2*fz)
    movss       xmm5, xmm1
    mulss       xmm5, xmm1       ; fz*fz
    movss       xmm6, xmm1
    addss       xmm6, xmm6       ; 2*fz
    movss       xmm7, [THREE_F]
    subss       xmm7, xmm6       ; 3-2*fz
    mulss       xmm5, xmm7       ; sz

    ; 4 corner hashes
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

    ; lerp
    movss       xmm7, xmm2
    subss       xmm7, xmm1
    mulss       xmm7, xmm4       ; (n10-n00)*sx
    addss       xmm7, xmm1       ; nx0

    movss       xmm0, xmm6
    subss       xmm0, xmm3
    mulss       xmm0, xmm4       ; (n11-n01)*sx
    addss       xmm0, xmm3       ; nx1

    subss       xmm0, xmm7
    mulss       xmm0, xmm5       ; (nx1-nx0)*sz
    addss       xmm0, xmm7       ; result

    add     rsp, 32
    pop     r13
    pop     r12
    pop     rbp
    ret

; ---- fbm ----
; Input: xmm0=x, xmm1=z  Output: xmm0=fbm
fbm:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 32

    movss   [rbp-8], xmm0        ; save x
    movss   [rbp-4], xmm1        ; save z
    mov     r12, 0               ; octave counter
    pxor    xmm6, xmm6           ; accumulator = 0
    movss   xmm7, [ONE_F]        ; amplitude = 1.0

.fbm_loop:
    cmp     r12, 4
    jge     .fbm_done

    movss   xmm0, [rbp-8]
    movss   xmm1, [rbp-4]
    call    noise2d
    mulss   xmm0, xmm7
    addss   xmm6, xmm0           ; acc += noise * amp

    mulss   xmm7, [HALF_F]       ; amp *= 0.5

    movss   xmm0, [rbp-8]
    addss   xmm0, xmm0
    movss   [rbp-8], xmm0        ; x *= 2

    movss   xmm0, [rbp-4]
    addss   xmm0, xmm0
    movss   [rbp-4], xmm0        ; z *= 2

    inc     r12
    jmp     .fbm_loop

.fbm_done:
    movss   xmm0, xmm6
    add     rsp, 32
    pop     r13
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

    xor     r12, r12            ; j = 0

.gh_j:
    cmp     r12, GRID_H
    jge     .gh_done

    xor     r13, r13            ; i = 0

.gh_i:
    cmp     r13, GRID_W
    jge     .gh_nextj

    ; World coords: wx = (i/GRID_W)*SCALE - HALF
    cvtsi2ss    xmm0, r13d
    cvtsi2ss    xmm1, r12d
    divss       xmm0, [GRID_WF]
    divss       xmm1, [GRID_HF]
    mulss       xmm0, [TERR_SC]
    mulss       xmm1, [TERR_SC]
    subss       xmm0, [HALF_SC]
    subss       xmm1, [HALF_SC]

    ; Save wx, wz
    movss       [rbp-8], xmm0
    movss       [rbp-4], xmm1

    ; FBM at noise frequency
    mulss       xmm0, [NOISE_S1]
    mulss       xmm1, [NOISE_S1]
    call    fbm                 ; xmm0 = fbm(wx*0.08, wz*0.08)

    mulss       xmm0, [H_MUL]   ; h = fbm * 4.0

    ; Valley modulation
    movss       xmm4, xmm0      ; save h

    movss       xmm0, [rbp-8]
    mulss       xmm0, [V_S]
    addss       xmm0, [V_O]
    movss       xmm1, [rbp-4]
    mulss       xmm1, [V_S]
    call    noise2d             ; valley noise

    ; Simplified: h = h * 0.5 + 0.5 (normalize to 0..1 range roughly)
    mulss       xmm4, [HALF_F]
    addss       xmm4, [HALF_F]

    ; Store
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2              ; * 4 bytes
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
