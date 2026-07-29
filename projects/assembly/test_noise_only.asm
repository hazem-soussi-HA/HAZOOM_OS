; test_noise_only.asm — test noise2d in isolation
section .data
    align 16
    NOISE_S1:   dd 0.08
    ONE_F:      dd 1.0
    THREE_F:    dd 3.0
    HALF_F:     dd 0.5
    INTMAX_F:   dd 2147483648.0
    TEN_F:      dd 10.0
    HUNDRED_F:  dd 100.0
section .bss
    align 16
    result:     resd 1
section .text
    global _start

_start:
    ; Call noise2d(-0.8, -0.8)
    mov     eax, 0xBF4CCCCD     ; -0.8f
    movd    xmm0, eax
    movd    xmm1, eax
    call    noise2d

    ; Store and write result
    movss   [result], xmm0
    mov     rax, 1
    mov     rdi, 1
    lea     rsi, [result]
    mov     rdx, 4
    syscall

    mov     rax, 60
    xor     rdi, rdi
    syscall

; hash2i: edi=i, esi=j -> eax
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

; noise2d: xmm0=x, xmm1=z -> xmm0
noise2d:
    push    rbp
    mov     rbp, rsp
    push    r12
    push    r13
    sub     rsp, 16

    ; Multiply by 100 to get integer grid
    mov     eax, 0x42C80000     ; 100.0f
    movd    xmm4, eax
    mulss   xmm0, xmm4          ; x * 100
    mulss   xmm1, xmm4          ; z * 100

    cvttss2si   edi, xmm0       ; ix = (int)(x*100)
    cvttss2si   esi, xmm1       ; iz = (int)(z*100)

    ; Hash the integer coordinates
    call    hash2i
    cvtsi2ss    xmm0, eax
    divss       xmm0, [INTMAX_F]

    add     rsp, 16
    pop     r13
    pop     r12
    pop     rbp
    ret
