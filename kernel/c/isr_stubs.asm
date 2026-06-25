; HAZOOM OS v6.0 - Interrupt Service Routine Stubs
; Assembly stubs for CPU exceptions and IRQs

section .text

; Macro for ISR without error code
%macro ISR_NOERRCODE 1
global isr%1
isr%1:
    push qword 0          ; Push dummy error code
    push qword %1         ; Push interrupt number
    jmp isr_common_stub
%endmacro

; Macro for ISR with error code
%macro ISR_ERRCODE 1
global isr%1
isr%1:
    ; Error code already pushed by CPU
    push qword %1         ; Push interrupt number
    jmp isr_common_stub
%endmacro

; Exception stubs
ISR_NOERRCODE 0
ISR_NOERRCODE 1
ISR_NOERRCODE 2
ISR_NOERRCODE 3
ISR_NOERRCODE 4
ISR_NOERRCODE 5
ISR_NOERRCODE 6
ISR_NOERRCODE 7
ISR_ERRCODE   8
ISR_NOERRCODE 10
ISR_NOERRCODE 11
ISR_NOERRCODE 12
ISR_NOERRCODE 13
ISR_ERRCODE   14
ISR_NOERRCODE 16
ISR_NOERRCODE 17
ISR_NOERRCODE 18
ISR_NOERRCODE 19

; IRQ stubs
%macro IRQ 2
global irq%1
irq%1:
    push qword 0
    push qword %2
    jmp irq_common_stub
%endmacro

IRQ 0, 32    ; Timer
IRQ 1, 33    ; Keyboard

; Syscall handler (0x80)
global irq128
irq128:
    push qword 0
    push qword 0x80
    jmp isr_common_stub

; Common ISR handler stub
extern isr_handler
isr_common_stub:
    ; Save all general purpose registers
    push rax
    push rcx
    push rdx
    push rbx
    push rbp
    push rsi
    push rdi
    push r8
    push r9
    push r10
    push r11
    push r12
    push r13
    push r14
    push r15

    ; Call C handler
    mov rdi, [rsp + 120]   ; Interrupt number (after 15 pushes * 8 = 120)
    mov rsi, rsp           ; Pointer to interrupt frame
    call isr_handler

    ; Restore all registers
    pop r15
    pop r14
    pop r13
    pop r12
    pop r11
    pop r10
    pop r9
    pop r8
    pop rdi
    pop rsi
    pop rbp
    pop rbx
    pop rdx
    pop rcx
    pop rax

    ; Clean up error code and interrupt number
    add rsp, 16
    iretq

; Common IRQ handler stub
extern irq_handler
irq_common_stub:
    ; Save all general purpose registers
    push rax
    push rcx
    push rdx
    push rbx
    push rbp
    push rsi
    push rdi
    push r8
    push r9
    push r10
    push r11
    push r12
    push r13
    push r14
    push r15

    ; Call C handler
    mov rdi, [rsp + 120]   ; Interrupt number
    mov rsi, rsp           ; Pointer to interrupt frame
    call irq_handler

    ; Send EOI to PIC
    mov al, 0x20
    out 0xA0, al           ; Send EOI to PIC2
    out 0x20, al           ; Send EOI to PIC1

    ; Restore all registers
    pop r15
    pop r14
    pop r13
    pop r12
    pop r11
    pop r10
    pop r9
    pop r8
    pop rdi
    pop rsi
    pop rbp
    pop rbx
    pop rdx
    pop rcx
    pop rax

    ; Clean up error code and interrupt number
    add rsp, 16
    iretq
