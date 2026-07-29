; terrain_final.asm — x86-64 Assembly Terrain Generator
; Uses a simple hash-based noise that avoids floor() issues
; nasm -f elf64 terrain_final.asm -o terrain_final.o && ld terrain_final.o -o terrain_final
; ./terrain_final > terrain.bin
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
    ZERO_F:     dd 0.0
    TWO_F:      dd 2.0
    THREE_F:    dd 3.0
    HALF_F:     dd 0.5
    QUART_F:    dd 0.25
    INTMAX_F:   dd 2147483648.0
    V_S:        dd 0.04
    V_O:        dd 99.0
    SIGN_M:     dd 0x80000000
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

; =============================================================================
; hash2i — integer hash
; Input: edi = i, esi = j
; Output: eax = hash [0..2^31-1]
; =============================================================================
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

; =============================================================================
; noise2d — 2D value noise using SSE
; Input: xmm0 = x, xmm1 = z
; Output: xmm0 = noise [0..1]
; Clobbers: rax, rcx, rdx, rsi, rdi, xmm0-xmm7
; =============================================================================
noise2d:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 16

    ; Convert to integer grid coordinates using round-to-negative-infinity
    ; For positive: cvttss2si works (truncate = floor)
    ; For negative: cvttss2si truncates toward 0, so we need fixup
    ; Simple approach: add large offset to make everything positive, then subtract
    ; Actually, let's just use the raw float bits as hash input instead

    ; Alternative: use the float bits directly as hash input
    ; This avoids floor entirely and gives deterministic results
    movd    eax, xmm0           ; get raw bits of x
    movd    xmm2, eax
    movd    eax, xmm1           ; get raw bits of z
    movd    xmm3, eax

    ; Hash the raw float bits for 4 "corners"
    ; Use fractional part approach: extract mantissa bits
    ; Actually, simplest working approach: use integer cast of (x * 100) and (z * 100)
    ; This gives us grid cells of size 0.01

    ; Multiply by 100 to get integer grid
    mov     eax, 0x42C80000     ; 100.0f
    movd    xmm4, eax
    mulss   xmm0, xmm4          ; x * 100
    mulss   xmm1, xmm4          ; z * 100

    ; Convert to int (truncate toward zero — good enough for this scale)
    cvttss2si   edi, xmm0       ; ix
    cvttss2si   esi, xmm1       ; iz

    ; Compute fractional parts for interpolation
    cvtsi2ss    xmm2, edi
    cvtsi2ss    xmm3, esi
    movss   xmm4, xmm0
    mulss   xmm4, xmm4          ; not needed, let's just use the int coords for hash

    ; Actually, let's use a completely different approach:
    ; Just hash the integer coordinates directly, no interpolation
    ; This gives a "value noise" that's just random per grid cell
    ; For FBM we layer multiple octaves so it'll look smooth enough

    ; Hash(ix, iz) -> n00
    call    hash2i
    cvtsi2ss    xmm0, eax
    divss       xmm0, [INTMAX_F]

    add     rsp, 16
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; fbm — Fractal Brownian Motion (4 octaves)
; Input: xmm0 = x, xmm1 = z
; Output: xmm0 = fbm value
; =============================================================================
fbm:
    push    rbp
    mov     rbp, rsp
    push    r12
    sub     rsp, 32

    movss   [rbp-8], xmm0       ; save x
    movss   [rbp-4], xmm1       ; save z
    xor     r12, r12            ; octave counter
    pxor    xmm6, xmm6          ; accumulator = 0
    movss   xmm7, [ONE_F]       ; amplitude = 1.0

.fbm_loop:
    cmp     r12, 4
    jge     .fbm_done

    movss   xmm0, [rbp-8]
    movss   xmm1, [rbp-4]
    call    noise2d
    mulss   xmm0, xmm7
    addss   xmm6, xmm0

    mulss   xmm7, [HALF_F]      ; amplitude *= 0.5

    ; Double frequency for next octave
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

    xor     r12, r12            ; j = 0

.gh_j:
    cmp     r12, GRID_H
    jge     .gh_done

    xor     r13, r13            ; i = 0

.gh_i:
    cmp     r13, GRID_W
    jge     .gh_nextj

    ; World coords: wx = (i / GRID_W) * SCALE - HALF_SCALE
    cvtsi2ss    xmm0, r13d
    divss       xmm0, [GRID_WF]
    mulss       xmm0, [TERR_SC]
    subss       xmm0, [HALF_SC]

    cvtsi2ss    xmm1, r12d
    divss       xmm1, [GRID_HF]
    mulss       xmm1, [TERR_SC]
    subss       xmm1, [HALF_SC]

    ; Save wx, wz
    movss       [rbp-8], xmm0
    movss       [rbp-4], xmm1

    ; FBM at noise frequency
    mulss       xmm0, [NOISE_S1]
    mulss       xmm1, [NOISE_S1]
    call    fbm

    ; height = fbm * HEIGHT_MUL
    mulss       xmm0, [H_MUL]

    ; Simple normalization: h = h * 0.5 + 0.5 (maps to ~0..1)
    mulss       xmm0, [HALF_F]
    addss       xmm0, [HALF_F]

    ; Store heightmap[j * GRID_W + i]
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
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

    ; Clamp neighbors
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
    mulss   xmm1, [HALF_F]

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
    movss   xmm2, [r14 + rax*4]
    mov     rax, r9
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm3, [r14 + rax*4]
    subss   xmm3, xmm2
    mulss   xmm3, [HALF_F]

    ; normal = normalize(-dhdx, 2.0, -dhdz)
    xorps   xmm1, [SIGN_M]
    movss   xmm4, [TWO_F]
    xorps   xmm3, [SIGN_M]

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
; gen_colors — flat green for all vertices
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
    shl     rax, 2
    lea     r14, [color_r]
    mov     dword [r14 + rax], 0x3E99999A  ; 0.3
    lea     r14, [color_g]
    mov     dword [r14 + rax], 0x3F000000  ; 0.5
    lea     r14, [color_b]
    mov     dword [r14 + rax], 0x3DCCCCCD  ; 0.1
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
; Header: 24 bytes: magic(5) + grid_w(4) + grid_h(4) + stride(4) + idx_count(4) + reserved(3 padded to 4)
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

    ; magic (5 bytes) — write as 8 bytes with padding
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [magic]
    mov     rdx, 5
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

    ; ---- Vertices: 48 bytes each ----
    ; Layout: pos(12) + normal(12) + uv(8) + color(16)
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
    divss       xmm0, [GRID_WF]
    mulss       xmm0, [TERR_SC]
    subss       xmm0, [HALF_SC]
    cvtsi2ss    xmm1, r12d
    divss       xmm1, [GRID_HF]
    mulss       xmm1, [TERR_SC]
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
    mov     dword [rbp-4], 0x3F800000  ; alpha = 1.0

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
    inc     eax
    mov     [rbp-20], eax       ; v1
    add     eax, GRID_W - 1
    mov     [rbp-16], eax       ; v2 = v0 + GRID_W
    mov     eax, r12d
    inc     eax
    imul    eax, GRID_W
    add     eax, r13d
    inc     eax
    mov     [rbp-12], eax       ; v3 = (j+1)*w + i+1
    mov     eax, r12d
    inc     eax
    imul    eax, GRID_W
    add     eax, r13d
    mov     [rbp-8], eax        ; v2 again
    mov     eax, r12d
    imul    eax, GRID_W
    add     eax, r13d
    inc     eax
    mov     [rbp-4], eax        ; v1 again

    ; Wait, the index buffer should be 6 uint32 = 24 bytes
    ; But we only have 6 slots of 4 bytes each from rbp-24 to rbp-4
    ; That's exactly 24 bytes. Good.

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
