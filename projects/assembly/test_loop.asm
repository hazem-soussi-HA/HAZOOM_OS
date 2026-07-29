; test_loop.asm — test fbm called in a loop
section .data
    align 16
    NOISE_S1:   dd 0.08
    ONE_F:      dd 1.0
    THREE_F:    dd 3.0
    HALF_F:     dd 0.5
    INTMAX_F:   dd 2147483648.0
    HUNDRED_F:  dd 100.0
    H_MUL:      dd 4.0
section .bss
    align 16
    heightmap:  resd 256*256
    done_msg:   resb 1
section .text
    global _start

_start:
    ; Simulate the inner loop of gen_heightmap for j=0, i=0..3
    xor     r13, r13
.test_loop:
    cmp     r13, 4
    jge     .test_done

    cvtsi2ss    xmm0, r13d
    mov     eax, 0x43800000     ; 256.0f
    movd    xmm1, eax
    divss       xmm0, xmm1      ; i/256
    mov     eax, 0x41A00000     ; 20.0f
    movd    xmm1, eax
    mulss       xmm0, xmm1      ; *20
    mov     eax, 0x41200000     ; 10.0f
    movd    xmm1, eax
    subss       xmm0, xmm1      ; -10
    ; xmm0 = wx for i

    mov     eax, 0xC1200000     ; -10.0f (for j=0, same calculation)
    movd    xmm1, eax

    mulss       xmm0, [NOISE_S1]
    mulss       xmm1, [NOISE_S1]

    ; Save loop counter
    push    r13
    call    fbm
    pop     r13

    mulss       xmm0, [H_MUL]
    mulss       xmm0, [HALF_F]
    addss       xmm0, [HALF_F]

    ; Store
    mov     [heightmap + r13*4], eax

    inc     r13
    jmp     .test_loop

.test_done:
    mov     byte [done_msg], 0x4F  ; 'O'
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [done_msg]
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
