; =============================================================================
; terrain_gen.asm — x86-64 Assembly Nature Landscape Generator
; Assemble: nasm -f elf64 terrain_gen.asm -o terrain_gen.o
; Link:     ld terrain_gen.o -o terrain_gen
; Run:      ./terrain_gen > terrain.bin
; =============================================================================
; Generates raw binary terrain mesh via x86-64 SSE instructions:
;   Header: 24 bytes (magic "HZTR" + grid_w + grid_h + vstride + idx_count + reserved)
;   Vertices: GRID_W * GRID_H * 48 bytes (pos xyz, normal xyz, uv, color rgba)
;   Indices:  (grid_w-1)*(grid_h-1)*6 uint32 triangle indices
; =============================================================================

%define GRID_W      256
%define GRID_H      256

section .data
    align 16
    GRID_WF:    dd 256.0
    GRID_HF:    dd 256.0
    TERR_SC:    dd 20.0        ; world size
    HALF_SC:    dd 10.0        ; world size / 2
    H_MUL:      dd 4.0         ; height multiplier
    NOISE_S1:   dd 0.08
    NOISE_A1:   dd 8.0
    NOISE_S2:   dd 0.2
    NOISE_A2:   dd 2.5
    NOISE_S3:   dd 0.8
    NOISE_A3:   dd 0.6
    NOISE_O2:   dd 5.3
    NOISE_O3:   dd 13.7
    V_S:        dd 0.04
    V_O:        dd 99.0
    R_S:        dd 0.1
    R_FREQ:     dd 0.05
    R_AMP:      dd 3.0
    R_BIAS:     dd 0.02
    ONE_F:      dd 1.0
    ZERO_F:     dd 0.0
    TWO_F:      dd 2.0
    THREE_F:    dd 3.0
    FOUR_F:     dd 4.0
    HALF_F:     dd 0.5
    QUART_F:    dd 0.25
    EPS_F:      dd 0.001
    INTMAX_F:   dd 2147483648.0
    SAND_R:     dd 0.7
    SAND_G:     dd 0.6
    SAND_B:     dd 0.35
    GRASS_R:    dd 0.2
    GRASS_G:    dd 0.5
    GRASS_B:    dd 0.1
    DIRT_R:     dd 0.35
    DIRT_G:     dd 0.25
    DIRT_B:     dd 0.12
    ROCK_R:     dd 0.45
    ROCK_G:     dd 0.42
    ROCK_B:     dd 0.38
    SNOW_R:     dd 0.92
    SNOW_G:     dd 0.94
    SNOW_B:     dd 0.97
    IOFF:       dd 100
    JOFF:       dd 311
    IHASH2:     dd 269
    JHASH2:     dd 173
    SIGN_M:     dd 0x80000000
                dd 0x80000000
                dd 0x80000000
                dd 0x80000000
    magic:      db 'HZTR'      ; HAZOOM Terrain binary format

section .bss
    align 16
    heightmap:  resd GRID_W * GRID_H
    normx:      resd GRID_W * GRID_H
    normy:      resd GRID_W * GRID_H
    normz:      resd GRID_W * GRID_H
    color_r:    resd GRID_W * GRID_H
    color_g:    resd GRID_W * GRID_H
    color_b:    resd GRID_W * GRID_H
    tmp_d:      resd 1

section .text
    global _start

; =============================================================================
; _start
; =============================================================================
_start:
    call    gen_heightmap
    call    gen_normals
    call    gen_colors
    call    write_binary

    mov     rax, 60         ; sys_exit
    xor     rdi, rdi
    syscall

; =============================================================================
; hash2i — integer hash (mirrors assembly imul/xor pattern)
; Input:  r8d = i, r9d = j
; Output: eax = hash [0..2^31-1]
; =============================================================================
hash2i:
    mov     eax, r8d
    imul    eax, 127
    mov     ecx, r9d
    imul    ecx, 311
    add     eax, ecx        ; i*127 + j*311

    mov     ecx, r8d
    imul    ecx, 269
    mov     edx, r9d
    imul    edx, 173
    add     ecx, edx        ; i*269 + j*173

    xor     eax, ecx
    and     eax, 0x7FFFFFFF
    ret

; =============================================================================
; noise2d — 2D value noise
; Input:  xmm0 = x, xmm1 = z
; Output: xmm0 = noise [0..1]
; =============================================================================
noise2d:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 32

    cvttss2si   r12d, xmm0       ; ix = floor(x)
    cvttss2si   r13d, xmm1       ; iz = floor(z)

    cvtsi2ss    xmm2, r12d
    subss       xmm0, xmm2       ; fx
    cvtsi2ss    xmm2, r13d
    subss       xmm1, xmm2       ; fz

    ; smoothstep sx = fx*fx*(3-2*fx)
    movss       xmm4, xmm0
    mulss       xmm4, xmm0       ; fx*fx
    movss       xmm5, xmm0
    addss       xmm5, xmm5       ; 2*fx
    movss       xmm6, [THREE_F]
    subss       xmm6, xmm5       ; 3-2*fx
    mulss       xmm4, xmm6       ; sx

    ; smoothstep sz = fz*fz*(3-2*fz)
    movss       xmm5, xmm1
    mulss       xmm5, xmm1       ; fz*fz
    movss       xmm6, xmm1
    addss       xmm6, xmm6       ; 2*fz
    movss       xmm7, [THREE_F]
    subss       xmm7, xmm6       ; 3-2*fz
    mulss       xmm5, xmm7       ; sz

    ; Hash 4 corners
    mov     r8d, r12d
    mov     r9d, r13d
    call    hash2i
    cvtsi2ss    xmm1, eax        ; n00
    divss       xmm1, [INTMAX_F]

    mov     r8d, r12d
    inc     r8d
    mov     r9d, r13d
    call    hash2i
    cvtsi2ss    xmm2, eax        ; n10
    divss       xmm2, [INTMAX_F]

    mov     r8d, r12d
    mov     r9d, r13d
    inc     r9d
    call    hash2i
    cvtsi2ss    xmm3, eax        ; n01
    divss       xmm3, [INTMAX_F]

    mov     r8d, r12d
    inc     r8d
    mov     r9d, r13d
    inc     r9d
    call    hash2i
    cvtsi2ss    xmm6, eax        ; n11
    divss       xmm6, [INTMAX_F]

    ; Bilinear lerp: nx0 = n00 + (n10-n00)*sx
    movss       xmm7, xmm2
    subss       xmm7, xmm1
    mulss       xmm7, xmm4
    addss       xmm7, xmm1       ; nx0

    ; nx1 = n01 + (n11-n01)*sx
    movss       xmm0, xmm6
    subss       xmm0, xmm3
    mulss       xmm0, xmm4
    addss       xmm0, xmm3       ; nx1

    ; result = nx0 + (nx1-nx0)*sz
    subss       xmm0, xmm7
    mulss       xmm0, xmm5
    addss       xmm0, xmm7

    add     rsp, 32
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; fbm — Fractal Brownian Motion (4 octaves)
; Input:  xmm0 = x, xmm1 = z
; Output: xmm0 = fbm value
; =============================================================================
fbm:
    push    rbp
    mov     rbp, rsp
    push    r12
    sub     rsp, 16

    movss   [rbp-8], xmm0
    movss   [rbp-4], xmm1
    xor     r12, r12            ; octave
    pxor    xmm6, xmm6          ; accumulator
    movss   xmm7, [ONE_F]       ; amplitude

.fbm_loop:
    cmp     r12, 4
    jge     .fbm_done

    movss   xmm0, [rbp-8]
    movss   xmm1, [rbp-4]
    call    noise2d
    mulss   xmm0, xmm7
    addss   xmm6, xmm0

    mulss   xmm7, [HALF_F]      ; amp *= 0.5
    movss   xmm0, [rbp-8]
    addss   xmm0, xmm0
    movss   [rbp-8], xmm0       ; x *= 2
    movss   xmm0, [rbp-4]
    addss   xmm0, xmm0
    movss   [rbp-4], xmm0       ; z *= 2

    inc     r12
    jmp     .fbm_loop

.fbm_done:
    movss   xmm0, xmm6
    add     rsp, 16
    pop     r12
    pop     rbp
    ret

; =============================================================================
; gen_heightmap
; =============================================================================
gen_heightmap:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12            ; j

.gh_j:
    cmp     r12, GRID_H
    jge     .gh_done

    xor     r13, r13            ; i

.gh_i:
    cmp     r13, GRID_W
    jge     .gh_nextj

    ; World coords
    cvtsi2ss    xmm0, r13d
    cvtsi2ss    xmm1, r12d
    divss       xmm0, [GRID_WF]
    divss       xmm1, [GRID_HF]
    mulss       xmm0, [TERR_SC]
    mulss       xmm1, [TERR_SC]
    subss       xmm0, [HALF_SC]
    subss       xmm1, [HALF_SC]

    movss       [rbp-8], xmm0   ; save wx
    movss       [rbp-4], xmm1   ; save wz

    ; FBM
    mulss       xmm0, [NOISE_S1]
    mulss       xmm1, [NOISE_S1]
    call    fbm
    mulss       xmm0, [H_MUL]
    movss       xmm4, xmm0      ; h

    ; Valley modulation: use noise to create flat valley floors
    movss       xmm0, [rbp-8]
    mulss       xmm0, [V_S]
    addss       xmm0, [V_O]
    movss       xmm1, [rbp-4]
    mulss       xmm1, [V_S]
    call    noise2d
    ; smoothstep: valley_factor = smoothstep(0.3, 0.7, noise)
    ; noise < 0.3 → valley = flat, > 0.7 → full height
    subss       xmm0, [QUART_F]
    maxss       xmm0, [ZERO_F]
    minss       xmm0, [ONE_F]
    movss       xmm5, xmm0       ; valley factor
    ; h = base_h * (0.3 + 0.7 * valley_factor)
    movss       xmm6, [HALF_F]
    mulss       xmm5, xmm6
    addss       xmm5, [QUART_F]
    mulss       xmm4, xmm5

    ; Store heightmap[j*GRID_W + i]
    mov     rax, r12
    imul    rax, GRID_W
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

; =============================================================================
; gen_normals — central differences
; =============================================================================
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

    ; Neighbors with clamp
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

    ; dhdx
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r8
    lea     r14, [heightmap]
    movss   xmm0, [r14 + rax*4] ; h_left
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r9
    movss   xmm1, [r14 + rax*4] ; h_right
    subss   xmm1, xmm0
    mulss   xmm1, [HALF_F]      ; dhdx

    ; dhdz
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
    movss   xmm2, [r14 + rax*4] ; h_top
    mov     rax, r9
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm3, [r14 + rax*4] ; h_bottom
    subss   xmm3, xmm2
    mulss   xmm3, [HALF_F]      ; dhdz

    ; normal = normalize(-dhdx, 2.0, -dhdz)
    xorps   xmm1, [SIGN_M]      ; -dhdx
    movss   xmm4, [TWO_F]
    xorps   xmm3, [SIGN_M]      ; -dhdz

    ; length
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

    ; Store
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

; =============================================================================
; gen_colors — height-based terrain materials
; =============================================================================
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
    lea     r14, [heightmap]
    movss   xmm0, [r14 + rax*4]  ; h
    lea     r14, [normy]
    movss   xmm1, [r14 + rax*4]  ; ny

    ; Default grass
    movss   xmm2, [GRASS_R]
    movss   xmm3, [GRASS_G]
    movss   xmm4, [GRASS_B]

    ; Cascading height-based blending
    ; bands: sand(h<-0.5) → grass(-0.5..0.5) → dirt(0.5..2) → rock(2..4) → snow(>4)
    movss   xmm5, xmm0
    addss   xmm5, [HALF_F]       ; h + 0.5
    maxss   xmm5, [ZERO_F]
    minss   xmm5, [ONE_F]        ; t = clamp((h+0.5)/1.0, 0, 1)  — sand→grass
    movss   xmm6, [SAND_R]
    subss   xmm6, xmm2
    mulss   xmm6, xmm5
    addss   xmm2, xmm6
    movss   xmm6, [SAND_G]
    subss   xmm6, xmm3
    mulss   xmm6, xmm5
    addss   xmm3, xmm6
    movss   xmm6, [SAND_B]
    subss   xmm6, xmm4
    mulss   xmm6, xmm5
    addss   xmm4, xmm6

    ; grass→dirt (blend from h=0.5 to h=2.0)
    movss   xmm5, xmm0
    subss   xmm5, [HALF_F]       ; h - 0.5
    maxss   xmm5, [ZERO_F]
    movss   xmm6, [TWO_F]
    subss   xmm6, [HALF_F]       ; 2.0 - 0.5 = 1.5
    divss   xmm5, xmm6           ; t = clamp((h-0.5)/1.5, 0, 1)
    minss   xmm5, [ONE_F]
    movss   xmm6, [GRASS_R]
    subss   xmm6, [DIRT_R]
    mulss   xmm6, xmm5
    subss   xmm2, xmm6
    movss   xmm6, [GRASS_G]
    subss   xmm6, [DIRT_G]
    mulss   xmm6, xmm5
    subss   xmm3, xmm6
    movss   xmm6, [GRASS_B]
    subss   xmm6, [DIRT_B]
    mulss   xmm6, xmm5
    subss   xmm4, xmm6

    ; dirt→rock (blend from h=2.0 to h=4.0)
    movss   xmm5, xmm0
    subss   xmm5, [TWO_F]        ; h - 2.0
    maxss   xmm5, [ZERO_F]
    movss   xmm6, [FOUR_F]       ; defined below
    subss   xmm6, [TWO_F]        ; 4.0 - 2.0 = 2.0
    divss   xmm5, xmm6
    minss   xmm5, [ONE_F]
    movss   xmm6, [DIRT_R]
    subss   xmm6, [ROCK_R]
    mulss   xmm6, xmm5
    subss   xmm2, xmm6
    movss   xmm6, [DIRT_G]
    subss   xmm6, [ROCK_G]
    mulss   xmm6, xmm5
    subss   xmm3, xmm6
    movss   xmm6, [DIRT_B]
    subss   xmm6, [ROCK_B]
    mulss   xmm6, xmm5
    subss   xmm4, xmm6

    ; rock→snow (blend from h=4.0 upward)
    movss   xmm5, xmm0
    subss   xmm5, [FOUR_F]       ; h - 4.0
    maxss   xmm5, [ZERO_F]
    movss   xmm6, [TWO_F]
    divss   xmm5, xmm6           ; t = clamp((h-4.0)/2.0, 0, 1)
    minss   xmm5, [ONE_F]
    movss   xmm6, [ROCK_R]
    subss   xmm6, [SNOW_R]
    mulss   xmm6, xmm5
    subss   xmm2, xmm6
    movss   xmm6, [ROCK_G]
    subss   xmm6, [SNOW_G]
    mulss   xmm6, xmm5
    subss   xmm3, xmm6
    movss   xmm6, [ROCK_B]
    subss   xmm6, [SNOW_B]
    mulss   xmm6, xmm5
    subss   xmm4, xmm6

    ; Store
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    lea     r14, [color_r]
    movss   [r14 + rax*4], xmm2
    lea     r14, [color_g]
    movss   [r14 + rax*4], xmm3
    lea     r14, [color_b]
    movss   [r14 + rax*4], xmm4

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

; =============================================================================
; write_binary — output terrain as raw binary to stdout
; Header: 24 bytes
;   [0:3]   = "HZTR" magic
;   [4:7]   = grid_w (uint32 LE)
;   [8:11]  = grid_h (uint32 LE)
;   [12:15] = vertex stride bytes (uint32 LE) = 48
;   [16:19] = index count (uint32 LE)
;   [20:23] = reserved
; Then vertices (48 bytes each), then indices (4 bytes each)
; =============================================================================
write_binary:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    push    r15
    sub     rsp, 64

    ; ---- Header ----
    ; magic (4 bytes)
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [magic]
    mov     rdx, 4
    syscall

    ; grid_w
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

    ; vertex stride = 48
    mov     dword [rbp-8], 48
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-8]
    mov     rdx, 4
    syscall

    ; index count
    mov     eax, GRID_W-1
    imul    eax, GRID_H-1
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
    ; 48 bytes each: pos(12) + normal(12) + uv(8) + color(16)
    xor     r12, r12            ; j

.wv_j:
    cmp     r12, GRID_H
    jge     .wv_done

    xor     r13, r13            ; i

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

    movss       [rbp-48], xmm0  ; pos.x
    ; pos.y = heightmap[j][i]
    mov         rax, r12
    imul        rax, GRID_W
    add         rax, r13
    lea         r15, [heightmap]
    movss       xmm2, [r15 + rax*4]
    movss       [rbp-44], xmm2  ; pos.y
    movss       [rbp-40], xmm1  ; pos.z

    ; normal
    lea         r15, [normx]
    movss       xmm3, [r15 + rax*4]
    movss       [rbp-36], xmm3
    lea         r15, [normy]
    movss       xmm3, [r15 + rax*4]
    movss       [rbp-32], xmm3
    lea         r15, [normz]
    movss       xmm3, [r15 + rax*4]
    movss       [rbp-28], xmm3

    ; uv
    cvtsi2ss    xmm4, r13d
    divss       xmm4, [GRID_WF]
    movss       [rbp-24], xmm4
    cvtsi2ss    xmm4, r12d
    divss       xmm4, [GRID_HF]
    movss       [rbp-20], xmm4

    ; color
    lea         r15, [color_r]
    movss       xmm5, [r15 + rax*4]
    movss       [rbp-16], xmm5
    lea         r15, [color_g]
    movss       xmm5, [r15 + rax*4]
    movss       [rbp-12], xmm5
    lea         r15, [color_b]
    movss       xmm5, [r15 + rax*4]
    movss       [rbp-8], xmm5
    mov         dword [rbp-4], 0x3F800000  ; 1.0f (alpha)

    ; Write 48 bytes
    lea         rsi, [rbp-48]
    mov         rdx, 48
    push        r12
    push        r13
    mov         rax, 1
    mov         rdi, 1
    syscall
    pop         r13
    pop         r12

    inc         r13
    jmp         .wv_i

.wv_nextj:
    inc         r12
    jmp         .wv_j

.wv_done:
    ; ---- Indices ----
    xor     r12, r12            ; j

.wi_j:
    cmp     r12, GRID_H-1
    jge     .wi_done

    xor     r13, r13            ; i

.wi_i:
    cmp     r13, GRID_W-1
    jge     .wi_nextj

    ; 6 indices per quad
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

    ; Write 24 bytes
    lea     rsi, [rbp-24]
    mov     rdx, 24
    push    r12
    push    r13
    mov     rax, 1
    mov     rdi, 1
    syscall
    pop     r13
    pop     r12

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
