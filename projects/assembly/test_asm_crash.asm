; test_asm_crash.asm — find where asm crashes
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
    msg1:       db "A"
    msg2:       db "B"
    msg3:       db "C"
section .bss
    align 16
    heightmap:  resd 256*256
section .text
    global _start

_start:
    ; Test 1: basic write works?
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [msg1]
    mov     rdx, 1
    syscall

    ; Test 2: gen_heightmap for 1 pixel
    ; i=0, j=0
    xor     eax, eax
    cvtsi2ss    xmm0, eax
    divss       xmm0, [GRID_WF]     ; 0/256 = 0
    mulss       xmm0, [TERR_SC]     ; 0*20 = 0
    subss       xmm0, [HALF_SC]     ; 0-10 = -10
    movss       xmm1, xmm0          ; same for z

    ; noise test
    mulss       xmm0, [NOISE_S1]    ; -10 * 0.08 = -0.8
    mulss       xmm1, [NOISE_S1]
    ; xmm0 = -0.8, xmm1 = -0.8

    ; Test floor_sse with -0.8
    ; cvttss2si eax, xmm0 -> eax = 0 (truncate toward zero, not floor!)
    cvttss2si   eax, xmm0
    ; eax should be 0 for truncate, but we want -1 for floor

    ; Just do a hash test
    mov     edi, 0
    mov     esi, 0
    call    hash2i

    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [msg2]
    mov     rdx, 1
    syscall

    ; Convert -0.8 to int via cvttss2si (the problematic instruction)
    movss   xmm0, [NOISE_S1]
    mov     eax, 0xC1200000         ; -10.0f
    movd    xmm1, eax
    mulss   xmm0, xmm1              ; 0.08 * -10 = -0.8
    movd    eax, xmm0               ; get raw bits -> should be 0xBF4CCCCD

    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [msg3]
    mov     rdx, 1
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
