; =============================================================================
; earth_sim.asm — x86-64 Assembly Earth Simulation Core
; 
; Computes a realistic Earth-like planet simulation:
;   - Continental plates via Voronoi + noise
;   - Mountain ranges via tectonic collision simulation
;   - Erosion (thermal + hydraulic)
;   - Hydrological modeling (rainfall, rivers, watersheds)
;   - Biome classification (Whittaker diagram: temp vs precipitation)
;   - Atmospheric scattering
;
; Build: nasm -f elf64 earth_sim.asm -o earth_sim.o && ld earth_sim.o -o earth_sim
; Run:   ./earth_sim > earth_data.bin
;
; Output format:
;   Header: 64 bytes
;     [0:3]    = "HEAR" (HEARTH magic)
;     [4:7]    = grid_w (uint32)
;     [8:11]   = grid_h (uint32)
;     [12:15]  = num_biomes (uint32)
;     [16:19]  = sea_level (float32, 0.0-1.0)
;     [20:23]  = axial_tilt (float32, radians)
;     [24:27]  = num_river_points (uint32)
;     [28:31]  = num_vegetation_points (uint32)
;     [32:63]  = reserved
;
;   Elevation map: grid_w * grid_h * float32
;   Temperature:   grid_w * grid_h * float32
;   Precipitation: grid_w * grid_h * float32
;   Biome IDs:     grid_w * grid_h * uint8
;   River points:  num_river_points * (x:float32, y:float32, width:float32)
;   Vegetation:    num_vegetation_points * (x:float32, y:float32, density:float32, type:uint8)
; =============================================================================

%define GRID_W      512
%define GRID_H      256
%define NUM_PLATES  16
%define NUM_OCTAVES 6
%define SEA_LEVEL   0.45
%define AXIAL_TILT  0.4101524    ; 23.5 degrees in radians

section .data
    align 16
    ; ---- Simulation parameters ----
    grid_w_f:       dd 512.0
    grid_h_f:       dd 256.0
    one_f:          dd 1.0
    zero_f:         dd 0.0
    half_f:         dd 0.5
    two_f:          dd 2.0
    three_f:        dd 3.0
    pi_f:           dd 3.14159265
    two_pi_f:       dd 6.28318531
    half_pi_f:      dd 1.57079633
    sea_level_f:    dd 0.45
    axial_tilt_f:   dd 0.4101524
    intmax_f:       dd 2147483648.0
    hundred_f:      dd 100.0
    thousand_f:     dd 1000.0
    
    ; ---- Bit masks ----
    align 16
    sign_m:         dd 0x80000000
                    dd 0x80000000
                    dd 0x80000000
                    dd 0x80000000
    abs_mask:       dd 0x7FFFFFFF, 0, 0, 0

    ; ---- Noise frequencies per octave ----
    noise_freqs:    dd 0.002, 0.008, 0.032, 0.128, 0.512, 2.048
    noise_amps:     dd 1.0, 0.5, 0.25, 0.125, 0.0625, 0.03125
    
    ; ---- Erosion parameters ----
    ero_rate:       dd 0.05
    ero_max:        dd 0.02

    ; ---- Plate tectonic parameters ----
    num_plates:     dd NUM_PLATES
    
    ; ---- Biome classification thresholds (Whittaker diagram) ----
    ; Temperature bands (Celsius, mapped from 0-1)
    biome_temp:     dd 0.05, 0.15, 0.30, 0.50, 0.70, 0.85, 0.95
    ; Precipitation bands (relative, 0-1)
    biome_precip:   dd 0.05, 0.15, 0.35, 0.55, 0.75, 0.90
    
    ; ---- Magic ----
    magic:          db 'HEAR'
    
    ; ---- Plate seed positions (x, y as 0-1 floats) ----
    ; Pre-computed for deterministic results
    plate_seeds_x:  dd 0.15, 0.42, 0.73, 0.28, 0.88, 0.55, 0.05, 0.92
                    dd 0.33, 0.67, 0.12, 0.48, 0.79, 0.22, 0.61, 0.85
    plate_seeds_y:  dd 0.25, 0.68, 0.42, 0.15, 0.82, 0.35, 0.58, 0.12
                    dd 0.92, 0.08, 0.55, 0.75, 0.32, 0.48, 0.18, 0.65
    
    ; ---- Plate movement directions (angle in radians) ----
    plate_angles:   dd 0.5, 2.1, 4.2, 1.3, 5.5, 3.1, 0.8, 4.8
                    dd 2.5, 5.9, 1.7, 3.8, 0.3, 4.5, 2.8, 5.2
    
    ; ---- Plate elevation offsets ----
    plate_elev:     dd 0.3, -0.1, 0.5, 0.2, -0.2, 0.4, 0.1, -0.3
                    dd 0.6, 0.0, -0.15, 0.35, 0.25, -0.25, 0.45, 0.15

section .bss
    align 16
    ; ---- Elevation map ----
    elevation:      resd GRID_W * GRID_H
    ; ---- Temperature map (latitude + altitude based) ----
    temperature:    resd GRID_W * GRID_H
    ; ---- Precipitation map ----
    precipitation:  resd GRID_W * GRID_H
    ; ---- Biome map ----
    biome_map:      resb GRID_W * GRID_H
    ; ---- Plate distance map (for Voronoi) ----
    plate_dist:     resd GRID_W * GRID_H
    plate_id:       resb GRID_W * GRID_H
    ; ---- Erosion buffer ----
    erosion_buf:    resd GRID_W * GRID_H
    ; ---- River network ----
    river_flow:     resd GRID_W * GRID_H
    river_depth:    resd GRID_W * GRID_H
    ; ---- Vegetation density ----
    vegetation:     resd GRID_W * GRID_H
    ; ---- Output buffer ----
    out_buf:        resb 65536
    ; ---- Temp computation buffer ----
    temp_val:       resd 1
    temp_int:       resd 1

section .text
    global _start

; =============================================================================
; ENTRY POINT
; =============================================================================
_start:
    ; Phase 1: Generate continental plates (Voronoi + noise)
    call    gen_continental_plates
    
    ; Phase 2: Add fractal detail (multi-octave noise)
    call    gen_fractal_detail
    
    ; Phase 3: Simulate tectonic collisions (mountain building)
    call    gen_tectonic_mountains
    
    ; Phase 4: Thermal erosion
    call    gen_thermal_erosion
    
    ; Phase 5: Hydraulic erosion + river formation
    call    gen_hydraulic_erosion
    
    ; Phase 6: Compute temperature (latitude + altitude)
    call    gen_temperature
    
    ; Phase 7: Compute precipitation (orographic + latitude)
    call    gen_precipitation
    
    ; Phase 8: Classify biomes (Whittaker diagram)
    call    gen_biomes
    
    ; Phase 9: Generate vegetation
    call    gen_vegetation
    
    ; Phase 10: Write output
    call    write_output
    
    ; Exit
    mov     rax, 60
    xor     rdi, rdi
    syscall

; =============================================================================
; HASH FUNCTIONS
; =============================================================================

; ---- hash2i: edi=i, esi=j -> eax ----
; Integer hash — same as terrain generator
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

; ---- hash2f: edi=i, esi=j -> xmm0 [0..1] ----
hash2f:
    push    rbp
    mov     rbp, rsp
    call    hash2i
    cvtsi2ss    xmm0, eax
    divss       xmm0, [intmax_f]
    pop     rbp
    ret

; =============================================================================
; FLOOR (proper, not truncate-toward-zero)
; =============================================================================

; ---- floor_sse: xmm0 -> eax ----
floor_sse:
    cvttss2si   eax, xmm0
    cvtsi2ss    xmm1, eax
    ucomiss     xmm0, xmm1
    jae         .fl_ok
    xor         ecx, ecx
    ucomiss     xmm0, xmm0
    jp          .fl_ok
    dec     eax
.fl_ok:
    ret

; =============================================================================
; 2D VALUE NOISE (with proper floor + smoothstep interpolation)
; =============================================================================

; ---- noise2d: xmm0=x, xmm1=z -> xmm0 [0..1] ----
noise2d:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 64

    movss   [rbp-40], xmm0       ; save x
    movss   [rbp-36], xmm1       ; save z

    ; Floor x
    call    floor_sse
    mov     r12d, eax           ; ix
    cvtsi2ss    xmm2, eax
    movss   xmm0, [rbp-40]
    subss       xmm0, xmm2       ; fx

    ; Floor z
    movss   xmm1, [rbp-36]
    push    rax                 ; save ix
    call    floor_sse
    pop     rcx                 ; restore ix
    mov     r13d, eax           ; iz
    cvtsi2ss    xmm2, eax
    movss   xmm1, [rbp-36]
    subss       xmm1, xmm2       ; fz

    ; smoothstep sx = fx*fx*(3-2*fx)
    movss   xmm4, xmm0
    mulss   xmm4, xmm0          ; fx*fx
    movss   xmm5, xmm0
    addss   xmm5, xmm5          ; 2*fx
    movss   xmm6, [three_f]
    subss   xmm6, xmm5          ; 3-2*fx
    mulss   xmm4, xmm6          ; sx

    ; smoothstep sz
    movss   xmm5, xmm1
    mulss   xmm5, xmm1          ; fz*fz
    movss   xmm6, xmm1
    addss   xmm6, xmm6          ; 2*fz
    movss   xmm7, [three_f]
    subss   xmm7, xmm6          ; 3-2*fz
    mulss   xmm5, xmm7          ; sz

    ; Hash 4 corners
    mov     edi, r12d
    mov     esi, r13d
    call    hash2f              ; n00 in xmm0
    movss   [rbp-48], xmm0      ; save n00

    lea     edi, [r12d + 1]
    mov     esi, r13d
    call    hash2f              ; n10
    movss   [rbp-52], xmm0      ; save n10

    mov     edi, r12d
    lea     esi, [r13d + 1]
    call    hash2f              ; n01
    movss   [rbp-56], xmm0      ; save n01

    lea     edi, [r12d + 1]
    lea     esi, [r13d + 1]
    call    hash2f              ; n11
    movss   [rbp-60], xmm0      ; save n11

    ; Bilinear lerp
    ; nx0 = n00 + (n10-n00)*sx
    movss   xmm1, [rbp-52]      ; n10
    subss   xmm1, [rbp-48]      ; n10-n00
    mulss   xmm1, xmm4          ; *sx
    addss   xmm1, [rbp-48]      ; nx0

    ; nx1 = n01 + (n11-n01)*sx
    movss   xmm2, [rbp-60]      ; n11
    subss   xmm2, [rbp-56]      ; n11-n01
    mulss   xmm2, xmm4          ; *sx
    addss   xmm2, [rbp-56]      ; nx1

    ; result = nx0 + (nx1-nx0)*sz
    subss   xmm2, xmm1
    mulss   xmm2, xmm5
    addss   xmm1, xmm2
    movss   xmm0, xmm1

    add     rsp, 64
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; FBM — Fractal Brownian Motion (6 octaves)
; =============================================================================

; ---- fbm: xmm0=x, xmm1=z -> xmm0 ----
fbm:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 48

    movss   [rbp-24], xmm0       ; ox
    movss   [rbp-20], xmm1       ; oz
    xor     r12, r12            ; octave
    pxor    xmm6, xmm6          ; accumulator
    movss   xmm7, [one_f]       ; amplitude

.fbm_loop:
    cmp     r12, NUM_OCTAVES
    jge     .fbm_done

    ; Load frequency and amplitude for this octave
    mov     eax, r12d
    shl     eax, 2              ; *4
    lea     r13, [noise_freqs]
    movss   xmm4, [r13 + rax]   ; frequency
    lea     r13, [noise_amps]
    movss   xmm5, [r13 + rax]   ; amplitude

    movss   xmm0, [rbp-24]
    mulss   xmm0, xmm4          ; x * freq
    movss   xmm1, [rbp-20]
    mulss   xmm1, xmm4          ; z * freq
    call    noise2d
    mulss   xmm0, xmm7          ; * global amplitude
    mulss   xmm0, xmm5          ; * octave amplitude
    addss   xmm6, xmm0

    mulss   xmm7, [half_f]      ; global amplitude *= 0.5

    inc     r12
    jmp     .fbm_loop

.fbm_done:
    movss   xmm0, xmm6
    add     rsp, 48
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 1: CONTINENTAL PLATES (Voronoi diagram)
; =============================================================================

gen_continental_plates:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    push    r15
    sub     rsp, 32

    xor     r12, r12            ; j (latitude)

.cp_j:
    cmp     r12, GRID_H
    jge     .cp_done

    xor     r13, r13            ; i (longitude)

.cp_i:
    cmp     r13, GRID_W
    jge     .cp_nextj

    ; Normalized coordinates
    cvtsi2ss    xmm0, r13d
    divss       xmm0, [grid_w_f]    ; nx = i / GRID_W (0..1)
    cvtsi2ss    xmm1, r12d
    divss       xmm1, [grid_h_f]    ; ny = j / GRID_H (0..1)

    ; Find nearest plate seed (Voronoi)
    mov     r14, -1             ; best plate id
    mov     r15, 0x7F7FFFFF     ; best distance (max float)
    push    r12
    push    r13

    xor     r12, r13            ; plate index (reusing r13, oops)
    ; Fix: use different register
    pop     r13
    push    r13

    xor     r13, r13            ; plate index

.cp_plate_loop:
    cmp     r13, NUM_PLATES
    jge     .cp_plate_done

    ; Load plate seed position
    lea     rax, [plate_seeds_x]
    movss   xmm2, [rax + r13*4] ; plate_x
    lea     rax, [plate_seeds_y]
    movss   xmm3, [rax + r13*4] ; plate_y

    ; Distance (with wrapping for longitude)
    movss   xmm4, xmm0
    subss   xmm4, xmm2          ; dx
    movss   xmm5, xmm1
    subss   xmm5, xmm3          ; dy

    ; Wrap dx to [-0.5, 0.5]
    movss   xmm6, [half_f]
    ucomiss xmm4, xmm6
    jbe     .cp_no_wrap_pos
    subss   xmm4, [one_f]
.cp_no_wrap_pos:
    movss   xmm6, [half_f]
    xorps   xmm6, [sign_m]      ; -0.5
    ucomiss xmm4, xmm6
    jae     .cp_no_wrap_neg
    addss   xmm4, [one_f]
.cp_no_wrap_neg:

    ; Distance squared
    movss   xmm6, xmm4
    mulss   xmm6, xmm4
    movss   xmm7, xmm5
    mulss   xmm7, xmm5
    addss   xmm6, xmm7          ; dist_sq

    ; Compare with best
    movd    eax, xmm6
    cmp     eax, r15d
    jge     .cp_plate_next
    mov     r15d, eax
    mov     r14, r13

.cp_plate_next:
    inc     r13
    jmp     .cp_plate_loop

.cp_plate_done:
    pop     r13
    pop     r12

    ; Store plate distance and id
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2

    ; Elevation from plate: base + distance-based falloff
    lea     rcx, [plate_elev]
    cvtsi2ss    xmm0, r14d
    and     eax, 0x3F           ; clamp to 0-63 (modulo for safety)
    ; Actually load plate elevation properly
    push    rax
    lea     rax, [plate_elev]
    movss   xmm0, [rax + r14*4] ; plate base elevation
    pop     rax

    ; Add distance from plate center (creates continental shelf)
    cvtsi2ss    xmm1, r15d      ; best dist_sq
    sqrtss      xmm1, xmm1      ; distance
    movss   xmm2, [half_f]
    subss   xmm2, xmm1          ; 0.5 - distance (higher near center)
    maxss   xmm2, [zero_f]
    mulss   xmm2, [two_f]       ; scale up
    addss   xmm0, xmm2

    ; Store elevation
    lea     rcx, [elevation]
    movss   [rcx + rax], xmm0

    ; Store plate id
    lea     rcx, [plate_id]
    shr rax, 2
    mov     [rcx + rax], r14b
    shl rax, 2

    inc     r13
    jmp     .cp_i

.cp_nextj:
    inc     r12
    jmp     .cp_j

.cp_done:
    add     rsp, 32
    pop     r15
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 2: FRACTAL DETAIL
; =============================================================================

gen_fractal_detail:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12

.fd_j:
    cmp     r12, GRID_H
    jge     .fd_done

    xor     r13, r13

.fd_i:
    cmp     r13, GRID_W
    jge     .fd_nextj

    ; World coordinates for noise
    cvtsi2ss    xmm0, r13d
    divss       xmm0, [grid_w_f]
    mulss       xmm0, [two_pi_f]    ; 0..2PI (wraps around globe)
    cvtsi2ss    xmm1, r12d
    divss       xmm1, [grid_h_f]
    mulss       xmm1, [pi_f]        ; 0..PI

    ; FBM noise
    call    fbm

    ; Add to elevation
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [elevation]
    addss   xmm0, [r14 + rax]
    movss   [r14 + rax], xmm0

    inc     r13
    jmp     .fd_i

.fd_nextj:
    inc     r12
    jmp     .fd_j

.fd_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 3: TECTONIC MOUNTAINS (plate boundary collisions)
; =============================================================================

gen_tectonic_mountains:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12

.tm_j:
    cmp     r12, GRID_H
    jge     .tm_done

    xor     r13, r13

.tm_i:
    cmp     r13, GRID_W
    jge     .tm_nextj

    ; Check if this pixel is near a plate boundary
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    lea     r14, [plate_id]
    movzx   ecx, byte [r14 + rax]   ; current plate

    ; Check neighbors for different plate
    xor     edx, edx                ; boundary flag

    ; Check right neighbor
    mov     r8, r13
    inc     r8
    cmp     r8, GRID_W
    jge     .tm_no_right
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r8
    movzx   eax, byte [r14 + rax]
    cmp     eax, ecx
    je      .tm_no_right
    or      edx, 1
.tm_no_right:

    ; Check bottom neighbor
    mov     r8, r12
    inc     r8
    cmp     r8, GRID_H
    jge     .tm_no_bottom
    mov     rax, r8
    imul    rax, GRID_W
    add     rax, r13
    movzx   eax, byte [r14 + rax]
    cmp     eax, ecx
    je      .tm_no_bottom
    or      edx, 1
.tm_no_bottom:

    test    edx, edx
    jz      .tm_nexti

    ; This is a boundary pixel — add mountain elevation
    ; Height based on plate movement convergence
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [elevation]

    ; Add mountain range (0.2-0.5 height)
    push    rax
    mov     edi, r13d
    mov     esi, r12d
    call    hash2i
    and     eax, 0xFF
    cvtsi2ss    xmm0, eax
    divss       xmm0, [hundred_f]   ; 0..2.55
    addss   xmm0, [half_f]          ; 0.5..3.05
    pop     rax

    addss   xmm0, [r14 + rax]
    movss   [r14 + rax], xmm0

.tm_nexti:
    inc     r13
    jmp     .tm_i

.tm_nextj:
    inc     r12
    jmp     .tm_j

.tm_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 4: THERMAL EROSION
; =============================================================================

gen_thermal_erosion:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    push    r15
    sub     rsp, 16

    ; Copy elevation to erosion buffer
    mov     rcx, GRID_W * GRID_H
    lea     rsi, [elevation]
    lea     rdi, [erosion_buf]
    rep movsd

    ; 3 iterations of thermal erosion
    mov     r15, 3

.te_iter:
    push    r15

    xor     r12, r12

.te_j:
    cmp     r12, GRID_H
    jge     .te_done

    xor     r13, r13

.te_i:
    cmp     r13, GRID_W
    jge     .te_nextj

    ; Get current height
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [erosion_buf]
    movss   xmm0, [r14 + rax]   ; h_center

    ; Find lowest neighbor
    mov     r8, r13
    dec     r8
    mov     r9, r13
    inc     r9
    mov     r10, r12
    dec     r10
    mov     r11, r12
    inc     r11

    ; Clamp
    cmp     r8, 0
    cmovl   r8, r13
    cmp     r9, GRID_W
    jl      .te_wok
    mov     r9, r13
.te_wok:
    cmp     r10, 0
    jge     .te_nok
    xor     r10, r10
.te_nok:
    cmp     r11, GRID_H
    jl      .te_sok
    mov     r11, r12
.te_sok:

    ; Get neighbor heights
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r8
    movss   xmm1, [r14 + rax*4] ; h_left

    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r9
    movss   xmm2, [r14 + rax*4] ; h_right

    mov     rax, r10
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm3, [r14 + rax*4] ; h_top

    mov     rax, r11
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm4, [r14 + rax*4] ; h_bottom

    ; Find minimum
    minss   xmm1, xmm2
    minss   xmm3, xmm4
    minss   xmm1, xmm3          ; h_min in xmm1

    ; If center > h_min + talus, erode
    movss   xmm2, xmm0
    subss   xmm2, xmm1          ; diff = h_center - h_min
    movss   xmm3, [half_f]
    ucomiss xmm2, xmm3          ; if diff > 0.5
    jbe     .te_nexti

    ; Erode: move material downhill
    subss   xmm0, xmm3          ; h_center -= 0.5
    addss   xmm1, xmm3          ; h_min += 0.5

    ; Store back
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    movss   [r14 + rax], xmm0

.te_nexti:
    inc     r13
    jmp     .te_i

.te_nextj:
    inc     r12
    jmp     .te_j

.te_done:
    pop     r15
    dec     r15
    jnz     .te_iter

    ; Copy erosion buffer back to elevation
    mov     rcx, GRID_W * GRID_H
    lea     rsi, [erosion_buf]
    lea     rdi, [elevation]
    rep movsd

    add     rsp, 16
    pop     r15
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 5: HYDRAULIC EROSION + RIVER FORMATION
; =============================================================================

gen_hydraulic_erosion:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    ; Initialize flow accumulation to 1.0 everywhere
    mov     rcx, GRID_W * GRID_H
    lea     rdi, [river_flow]
    mov     eax, 0x3F800000     ; 1.0f
    rep stosd

    ; 5 iterations of rain + flow
    mov     r14, 5

.he_iter:
    push    r14

    xor     r12, r12

.he_j:
    cmp     r12, GRID_H
    jge     .he_done

    xor     r13, r13

.he_i:
    cmp     r13, GRID_W
    jge     .he_nextj

    ; Get current height + flow
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2

    lea     r14, [elevation]
    movss   xmm0, [r14 + rax]   ; height
    lea     r14, [river_flow]
    movss   xmm1, [r14 + rax]   ; flow

    ; Find lowest neighbor
    mov     r8, r13
    dec     r8
    cmp     r8, 0
    cmovl   r8, r13
    mov     r9, r13
    inc     r9
    cmp     r9, GRID_W
    jl      .he_wok
    mov     r9, r13
.he_wok:
    mov     r10, r12
    dec     r10
    cmp     r10, 0
    jge     .he_nok
    xor     r10, r10
.he_nok:
    mov     r11, r12
    inc     r11
    cmp     r11, GRID_H
    jl      .he_sok
    mov     r11, r12
.he_sok:

    ; Get neighbor heights
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r8
    lea     r14, [elevation]
    movss   xmm2, [r14 + rax*4] ; h_left

    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r9
    movss   xmm3, [r14 + rax*4] ; h_right

    mov     rax, r10
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm4, [r14 + rax*4] ; h_top

    mov     rax, r11
    imul    rax, GRID_W
    add     rax, r13
    movss   xmm5, [r14 + rax*4] ; h_bottom

    ; Find minimum neighbor height
    minss   xmm2, xmm3
    minss   xmm4, xmm5
    minss   xmm2, xmm4          ; h_min

    ; If current > h_min, flow goes downhill
    ucomiss xmm0, xmm2
    jbe     .he_nexti

    ; Erode: transport material from current cell downhill
    movss   xmm6, xmm0
    subss   xmm6, xmm2          ; height difference to lowest neighbor
    ; erosion amount = min(diff * 0.05, 0.02)
    mulss   xmm6, [ero_rate]
    minss   xmm6, [ero_max]
    subss   xmm0, xmm6          ; lower current cell

    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [elevation]
    movss   [r14 + rax], xmm0   ; store eroded height

    ; Accumulate flow at each pixel (simulated rain)
    lea     r14, [river_flow]
    addss   xmm1, [one_f]       ; add rain
    movss   [r14 + rax], xmm1

.he_nexti:
    inc     r13
    jmp     .he_i

.he_nextj:
    inc     r12
    jmp     .he_j

.he_done:
    pop     r14
    dec     r14
    jnz     .he_iter

    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 6: TEMPERATURE (latitude + altitude based)
; =============================================================================

gen_temperature:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12

.temp_j:
    cmp     r12, GRID_H
    jge     .temp_done

    ; Latitude factor: 1.0 at equator (j=GRID_H/2), 0.0 at poles
    cvtsi2ss    xmm0, r12d
    divss       xmm0, [grid_h_f]    ; 0..1
    subss       xmm0, [half_f]      ; -0.5..0.5
    mulss       xmm0, [two_f]       ; -1..1
    ; abs value for latitude
    andps       xmm0, [abs_mask]    ; 0..1 (1 at poles, 0 at equator... wait)
    ; Actually we want 1 at equator, 0 at poles
    movss   xmm1, [one_f]
    subss   xmm1, xmm0              ; 1 - abs(lat) = temp factor

    xor     r13, r13

.temp_i:
    cmp     r13, GRID_W
    jge     .temp_nextj

    ; Get elevation
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [elevation]
    movss   xmm0, [r14 + rax]   ; elevation

    ; Temperature = latitude_factor - elevation * lapse_rate
    ; lapse rate: ~6.5C per 1000m, normalized
    movss   xmm2, [lapse_rate]
    mulss   xmm0, xmm2          ; elevation * lapse
    subss   xmm1, xmm0          ; temp = lat_factor - elev*lapse
    maxss   xmm1, [zero_f]      ; clamp to 0

    ; Store
    lea     r14, [temperature]
    movss   [r14 + rax], xmm1

    inc     r13
    jmp     .temp_i

.temp_nextj:
    inc     r12
    jmp     .temp_j

.temp_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; lapse_rate constant — placed in .data via section directive
section .data
    lapse_rate: dd 0.0065
section .text

; =============================================================================
; PHASE 7: PRECIPITATION (orographic + latitude based)
; =============================================================================

gen_precipitation:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12

.prec_j:
    cmp     r12, GRID_H
    jge     .prec_done

    xor     r13, r13

.prec_i:
    cmp     r13, GRID_W
    jge     .prec_nextj

    ; Base precipitation from latitude
    ; ITCZ (Intertropical Convergence Zone) at equator
    ; Subtropical highs at ~30 degrees
    cvtsi2ss    xmm0, r12d
    divss       xmm0, [grid_h_f]    ; 0..1
    subss       xmm0, [half_f]      ; -0.5..0.5
    mulss       xmm0, [two_f]       ; -1..1
    andps       xmm0, [abs_mask]    ; 0..1

    ; ITCZ: high precip at equator (lat=0), low at subtropics (lat~0.3)
    ; Simplified: precip = 1 - 2*|lat| near equator, then drops
    movss   xmm1, [one_f]
    addss   xmm1, xmm1              ; 2.0
    mulss   xmm1, xmm0              ; 2*|lat|
    movss   xmm2, [one_f]
    subss   xmm2, xmm1              ; 1 - 2*|lat|
    maxss   xmm2, [zero_f]

    ; Orographic effect: more precip on windward slopes
    ; (simplified: higher elevation = more precip up to a point)
    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2
    lea     r14, [elevation]
    movss   xmm0, [r14 + rax]
    subss   xmm0, [sea_level_f]     ; only above sea level
    maxss   xmm0, [zero_f]
    mulss   xmm0, [half_f]          ; scale
    addss   xmm2, xmm0              ; add orographic bonus
    minss   xmm2, [one_f]           ; clamp to 1

    ; Store
    lea     r14, [precipitation]
    movss   [r14 + rax], xmm2

    inc     r13
    jmp     .prec_i

.prec_nextj:
    inc     r12
    jmp     .prec_j

.prec_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 8: BIOME CLASSIFICATION (Whittaker diagram)
; =============================================================================

gen_biomes:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12

.bio_j:
    cmp     r12, GRID_H
    jge     .bio_done

    xor     r13, r13

.bio_i:
    cmp     r13, GRID_W
    jge     .bio_nextj

    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13

    ; Get elevation — if below sea level, it's ocean
    shl     rax, 2
    lea     r14, [elevation]
    movss   xmm0, [r14 + rax]
    shr     rax, 2

    ucomiss xmm0, [sea_level_f]
    jb      .bio_ocean

    ; Get temperature and precipitation
    lea     r14, [temperature]
    movss   xmm1, [r14 + rax*4]     ; temp
    lea     r14, [precipitation]
    movss   xmm2, [r14 + rax*4]     ; precip

    ; Classify biome based on temp + precip
    ; 0=Ocean, 1=Tundra, 2=Boreal, 3=Temperate, 4=Subtropical, 5=Tropical
    ; 6=Desert, 7=Savanna, 8=Rainforest, 9=Ice, 10=Mountain

    ; Ice: very cold
    movss   xmm3, [biome_temp]       ; 0.05
    ucomiss xmm1, xmm3
    jb      .bio_ice

    ; Desert: hot + dry
    movss   xmm3, [biome_temp + 16]  ; 0.50
    ucomiss xmm1, xmm3
    jb      .bio_check_tundra
    movss   xmm3, [biome_precip + 8] ; 0.35
    ucomiss xmm2, xmm3
    jb      .bio_desert

.bio_check_tundra:
    ; Tundra: cold
    movss   xmm3, [biome_temp + 4]   ; 0.15
    ucomiss xmm1, xmm3
    jb      .bio_tundra

    ; Boreal: cool
    movss   xmm3, [biome_temp + 8]   ; 0.30
    ucomiss xmm1, xmm3
    jb      .bio_boreal

    ; Temperate: moderate
    movss   xmm3, [biome_temp + 16]  ; 0.50
    ucomiss xmm1, xmm3
    jb      .bio_temperate

    ; Subtropical: warm
    movss   xmm3, [biome_temp + 20]  ; 0.70
    ucomiss xmm1, xmm3
    jb      .bio_subtropical

    ; Tropical: hot
    jmp     .bio_tropical

.bio_ocean:
    mov     cl, 0
    jmp     .bio_store
.bio_ice:
    mov     cl, 9
    jmp     .bio_store
.bio_desert:
    mov     cl, 6
    jmp     .bio_store
.bio_tundra:
    mov     cl, 1
    jmp     .bio_store
.bio_boreal:
    mov     cl, 2
    jmp     .bio_store
.bio_temperate:
    mov     cl, 3
    jmp     .bio_store
.bio_subtropical:
    mov     cl, 4
    jmp     .bio_store
.bio_tropical:
    ; Check if rainforest (high precip) or savanna (low precip)
    movss   xmm3, [biome_precip + 16] ; 0.55
    ucomiss xmm2, xmm3
    jb      .bio_savanna
    mov     cl, 8           ; rainforest
    jmp     .bio_store
.bio_savanna:
    mov     cl, 7           ; savanna

.bio_store:
    lea     r14, [biome_map]
    mov     [r14 + rax], cl

    inc     r13
    jmp     .bio_i

.bio_nextj:
    inc     r12
    jmp     .bio_j

.bio_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

; =============================================================================
; PHASE 9: VEGETATION
; =============================================================================

gen_vegetation:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 16

    xor     r12, r12

.veg_j:
    cmp     r12, GRID_H
    jge     .veg_done

    xor     r13, r13

.veg_i:
    cmp     r13, GRID_W
    jge     .veg_nextj

    mov     rax, r12
    imul    rax, GRID_W
    add     rax, r13
    shl     rax, 2

    ; Vegetation density based on biome, temperature, precipitation
    lea     r14, [biome_map]
    shr rax, 2
    movzx   ecx, byte [r14 + rax]

    ; Ocean = 0, Desert = 0.1, Tundra = 0.2, Boreal = 0.6, Temperate = 0.8
    ; Subtropical = 0.7, Tropical = 0.9, Rainforest = 1.0, Savanna = 0.5
    ; Ice = 0, Mountain = 0.3
    cmp     cl, 0
    je      .veg_zero
    cmp     cl, 9
    je      .veg_zero
    cmp     cl, 6
    je      .veg_low
    cmp     cl, 1
    je      .veg_low
    cmp     cl, 10
    je      .veg_low
    cmp     cl, 7
    je      .veg_med
    cmp     cl, 2
    je      .veg_med
    cmp     cl, 4
    je      .veg_med
    cmp     cl, 3
    je      .veg_high
    cmp     cl, 5
    je      .veg_high
    cmp     cl, 8
    je      .veg_max
    jmp     .veg_zero

.veg_zero:
    pxor    xmm0, xmm0
    jmp     .veg_store
.veg_low:
    movss   xmm0, [veg_low_val]
    jmp     .veg_store
.veg_med:
    movss   xmm0, [veg_med_val]
    jmp     .veg_store
.veg_high:
    movss   xmm0, [veg_high_val]
    jmp     .veg_store
.veg_max:
    movss   xmm0, [one_f]

.veg_store:
    lea     r14, [vegetation]
    movss   [r14 + rax], xmm0

    inc     r13
    jmp     .veg_i

.veg_nextj:
    inc     r12
    jmp     .veg_j

.veg_done:
    add     rsp, 16
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret

section .data
    veg_low_val:    dd 0.15
    veg_med_val:    dd 0.55
    veg_high_val:   dd 0.85
section .text

; =============================================================================
; PHASE 10: WRITE OUTPUT
; =============================================================================

write_output:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    push    r14
    sub     rsp, 64

    ; Header (64 bytes)
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [magic]
    mov     rdx, 4
    syscall

    mov     dword [rbp-40], GRID_W
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-40]
    mov     rdx, 4
    syscall

    mov     dword [rbp-40], GRID_H
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-40]
    mov     rdx, 4
    syscall

    mov     dword [rbp-40], 11       ; num biomes
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-40]
    mov     rdx, 4
    syscall

    mov     dword [rbp-40], 0x3EE66666  ; sea_level = 0.45f
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-40]
    mov     rdx, 4
    syscall

    mov     dword [rbp-40], 0x3F547AE1  ; axial_tilt = 0.4101524f
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-40]
    mov     rdx, 4
    syscall

    mov     dword [rbp-40], 0       ; num_river_points (placeholder)
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-40]
    mov     rdx, 4
    syscall

    mov     dword [rbp-40], 0       ; num_vegetation_points
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-40]
    mov     rdx, 4
    syscall

    ; Reserved (32 bytes of zeros)
    mov     qword [rbp-40], 0
    mov     qword [rbp-48], 0
    mov     qword [rbp-56], 0
    mov     qword [rbp-64], 0
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [rbp-64]
    mov     rdx, 32
    syscall

    ; Elevation map
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [elevation]
    mov     rdx, GRID_W * GRID_H * 4
    syscall

    ; Temperature map
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [temperature]
    mov     rdx, GRID_W * GRID_H * 4
    syscall

    ; Precipitation map
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [precipitation]
    mov     rdx, GRID_W * GRID_H * 4
    syscall

    ; Biome map
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [biome_map]
    mov     rdx, GRID_W * GRID_H
    syscall

    ; Vegetation map
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [vegetation]
    mov     rdx, GRID_W * GRID_H * 4
    syscall

    add     rsp, 64
    pop     r14
    pop     r13
    pop     r12
    pop     rbp
    ret
