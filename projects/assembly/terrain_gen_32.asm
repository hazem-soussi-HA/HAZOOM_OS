; terrain_gen_v2.asm — x86-64 Assembly Terrain Generator (fixed)
; Build: nasm -f elf64 terrain_gen_v2.asm -o terrain_gen_v2.o && ld terrain_gen_v2.o -o terrain_gen_v2
; Run:   ./terrain_gen_v2 > terrain.bin
%define GRID_W 32
%define GRID_H 32

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
    SIGN_M:     dd 0x80000000
    GRASS_R:    dd 0.2
    GRASS_G:    dd 0.5
    GRASS_B:    dd 0.1
    SAND_R:     dd 0.7
    SAND_G:     dd 0.6
    SAND_B:     dd 0.35
    magic:      db 'HZSTR'

section .bss
    align 16
    heightmap:  resd GRID_W * GRID_H
    normx:      resd GRID_W * GRID_H
    normy:      resd GRID_W * GRID_H
    normz:      resd GRID_W * GRID_H
    color_r:    resd GRID_W * GRID_H
    color_g:    resd GRID_W * GRID_H
    color_b:    resd GRID_W * GRID_H
    tmp_buf:    resb 64

section .text
    global _start

_start:
    call    gen_heightmap
    call    gen_normals
    call    gen_colors
    call    write_binary
    mov     rax, 60
    xor     rdi, rdi
    syscall

; ---- hash2i: r8d=i, r9d=j -> eax ----
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

; ---- noise2d: xmm0=x, xmm1=z -> xmm0 ----
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

; ---- fbm: xmm0=x, xmm1=z -> xmm0 ----
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

; ---- gen_normals ----
gen_normals:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16
    xor     r12, r12
.gn_j:
    cmp     r12, GRID_H
    jge     .gn_done
    xor     r13, r13
.gn_i:
    cmp     r13, GRID_W
    jge     .gn_nextj
    mov     r8, r13
    dec     r8
    cmp     r8, 0
    cmovl   r8, r13
    mov     r9, r13
    inc     r9
    cmp     r9, GRID_W
    jl      .gn_wok
    mov     r9, r13
.gn_wok:
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r8
    lea     r14, [heightmap]
    movss   xmm0, [r14 + rax*4]
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r9
    movss   xmm1, [r14 + rax*4]
    subss   xmm1, xmm0
    mulss   xmm1, [HALF_F]
    mov     r8, r12
    dec     r8
    cmp     r8, 0
    jge     .gn_z1
    xor     r8, r8
.gn_z1:
    mov     r9, r12
    inc     r9
    cmp     r9, GRID_H
    jl      .gn_z2
    mov     r9, r12
.gn_z2:
    mov     rax, r8
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm2, [r14 + rax*4]
    mov     rax, r9
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm3, [r14 + rax*4]
    subss   xmm3, xmm2
    mulss   xmm3, [HALF_F]
    xorps   xmm1, [SIGN_M]
    movss   xmm4, [TWO_F]
    xorps   xmm3, [SIGN_M]
    movss   xmm5, xmm1
    mulss   xmm5, xmm1
    movss   xmm6, xmm4
    mulss   xmm6, xmm4
    addss   xmm5, xmm6
    movss   xmm6, xmm3
    mulss   xmm6, xmm3
    addss   xmm5, xmm6
    sqrtss  xmm5, xmm5
    divss   xmm1, xmm5
    divss   xmm4, xmm5
    divss   xmm3, xmm5
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    lea     r14, [normx]
    movss   [r14 + rax*4], xmm1
    lea     r14, [normy]
    movss   [r14 + rax*4], xmm4
    lea     r14, [normz]
    movss   [r14 + rax*4], xmm3
    inc     r13
    jmp     .gn_i
.gn_nextj:
    inc     r12
    jmp     .gn_j
.gn_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; ---- gen_colors ----
gen_colors:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    xor     r12, r12
.gc_j:
    cmp     r12, GRID_H
    jge     .gc_done
    xor     r13, r13
.gc_i:
    cmp     r13, GRID_W
    jge     .gc_nextj
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [color_r]
    mov     dword [r14 + rax], 0x3E99999A  ; 0.3f
    lea     r14, [color_g]
    mov     dword [r14 + rax], 0x3F000000  ; 0.5f
    lea     r14, [color_b]
    mov     dword [r14 + rax], 0x3DCCCCCD  ; 0.1f
    inc     r13
    jmp     .gc_i
.gc_nextj:
    inc     r12
    jmp     .gc_j
.gc_done:
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; ---- write_binary ----
write_binary:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    push    r15
    sub     rsp, 64

    ; magic (5 bytes)
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [magic]
    mov     rdx, 5
    syscall

    ; grid_w (4 bytes)
    mov     dword [rbp-8], GRID_W
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-8]
    mov     rdx, 4
    syscall

    ; grid_h
    mov     dword [rbp-8], GRID_H
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-8]
    mov     rdx, 4
    syscall

    ; stride = 48
    mov     dword [rbp-8], 48
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-8]
    mov     rdx, 4
    syscall

    ; index count
    mov     eax, GRID_W - 1
    imul    eax, GRID_H - 1
    imul    eax, 6
    mov     [rbp-8], eax
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-8]
    mov     rdx, 4
    syscall

    ; reserved
    mov     dword [rbp-8], 0
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-8]
    mov     rdx, 4
    syscall

    ; ---- Vertices ----
    xor     r12, r12
.wv_j:
    cmp     r12, GRID_H
    jge     .wv_done
    xor     r13, r13
.wv_i:
    cmp     r13, GRID_W
    jge     .wv_nextj

    ; pos.x = i * SCALE / GRID_W - HALF
    cvtsi2ss    xmm0, r13d
    cvtsi2ss    xmm1, r12d
    divss       xmm0, [GRID_WF]
    divss       xmm1, [GRID_HF]
    mulss       xmm0, [TERR_SC]
    mulss       xmm1, [TERR_SC]
    subss       xmm0, [HALF_SC]
    subss       xmm1, [HALF_SC]

    movss   [rbp-48], xmm0      ; pos.x

    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2

    lea     r15, [heightmap]
    movss   xmm2, [r15 + rax]
    movss   [rbp-44], xmm2      ; pos.y
    movss   [rbp-40], xmm1      ; pos.z

    lea     r15, [normx]
    movss   xmm3, [r15 + rax]
    movss   [rbp-36], xmm3      ; normal.x
    lea     r15, [normy]
    movss   xmm3, [r15 + rax]
    movss   [rbp-32], xmm3      ; normal.y
    lea     r15, [normz]
    movss   xmm3, [r15 + rax]
    movss   [rbp-28], xmm3      ; normal.z

    cvtsi2ss    xmm4, r13d
    divss       xmm4, [GRID_WF]
    movss   [rbp-24], xmm4      ; uv.u
    cvtsi2ss    xmm4, r12d
    divss       xmm4, [GRID_HF]
    movss   [rbp-20], xmm4      ; uv.v

    lea     r15, [color_r]
    movss   xmm5, [r15 + rax]
    movss   [rbp-16], xmm5      ; color.r
    lea     r15, [color_g]
    movss   xmm5, [r15 + rax]
    movss   [rbp-12], xmm5      ; color.g
    lea     r15, [color_b]
    movss   xmm5, [r15 + rax]
    movss   [rbp-8], xmm5       ; color.b
    mov     dword [rbp-4], 0x3F800000  ; 1.0f alpha

    ; Write 48 bytes
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-48]
    mov     rdx, 48
    syscall

    inc     r13
    jmp     .wv_i
.wv_nextj:
    inc     r12
    jmp     .wv_j
.wv_done:

    ; ---- Indices ----
    xor     r12, r12
.wi_j:
    cmp     r12, GRID_H - 1
    jge     .wi_done
    xor     r13, r13
.wi_i:
    cmp     r13, GRID_W - 1
    jge     .wi_nextj

    mov     eax, r12d
    imul    eax, GRID_W
    add     eax, r13d
    mov     [rbp-24], eax       ; v0

    mov     eax, r12d
    imul    eax, GRID_W
    add     eax, r13d
    inc     eax
    mov     [rbp-20], eax       ; v1

    mov     eax, r12d
    inc     eax
    imul    eax, GRID_W
    add     eax, r13d
    mov     [rbp-16], eax       ; v2

    mov     eax, r12d
    imul    eax, GRID_W
    add     eax, r13d
    inc     eax
    mov     [rbp-12], eax       ; v1

    mov     eax, r12d
    inc     eax
    imul    eax, GRID_W
    add     eax, r13d
    inc     eax
    mov     [rbp-8], eax        ; v3

    mov     eax, r12d
    inc     eax
    imul    eax, GRID_W
    add     eax, r13d
    mov     [rbp-4], eax        ; v2

    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-24]
    mov     rdx, 24
    syscall

    inc     r13
    jmp     .wi_i
.wi_nextj:
    inc     r12
    jmp     .wi_j
.wi_done:

    add     rsp, 64
    pop     r15
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret
