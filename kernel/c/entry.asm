; HAZOOM OS v6.0 - Kernel entry point
;
; Boot protocols supported:
;   * Multiboot2 (GRUB)            -> long mode handoff
;   * Multiboot1 / QEMU -kernel    -> 32-bit protected mode handoff
;   * PVH (QEMU -kernel, x86_64)   -> 32-bit protected mode handoff
;
; entry.asm detects the current mode and, if needed, builds identity page
; tables and switches to long mode before calling kernel_main().

; ─── PVH note ────────────────────────────────────────────────────────────
; QEMU's -kernel loader for x86_64 ELF requires a Xen PVH ELF note
; (type 0x10 = XEN_ELFNOTE_PHYS32_ENTRY) naming a 32-bit entry point.
section .note.pvh
align 4
    dd 4                       ; namesz  ("Xen\0")
    dd 4                       ; descsz  (one 32-bit entry)
    dd 0x10                    ; type = PHYS32_ENTRY
    db "Xen", 0, 0, 0          ; name (padded to 4)
    dd _start                  ; 32-bit entry point (physical)
align 4

section .multiboot
align 8

; Multiboot2 header (preferred by GRUB)
mb_header_start:
    dd 0xe85250d6
    dd 0
    dd mb_header_end - mb_header_start
    dd 0x100000000 - (0xe85250d6 + 0 + (mb_header_end - mb_header_start))

    dw 0
    dw 0
    dd 8
mb_header_end:

; Multiboot1 header (accepted by GRUB legacy AND by QEMU's -kernel multiboot
; loader when the kernel is supplied as a flat binary). QEMU scans the first
; 8 KB for the 0x1BADB002 magic and then uses the address fields below.
align 4
mb1_header_start:
    dd 0x1BADB002              ; magic
    dd 0x00010000              ; flags: bit16 set => use address fields
    dd 0x1BADB002 - 0x00010000  ; checksum = -(magic + flags)
    dd mb1_header_start        ; header_addr
    dd 0x00100000              ; load_addr
    dd 0x00000000              ; load_end_addr (0 = entire image)
    dd 0x00000000              ; bss_end_addr  (0 = none)
    dd _start                  ; entry_addr

; ─── Temporary boot page tables (identity map lower 1 GiB, 2 MiB pages) ───
; These live inside the loaded image (>= 0x100000) so the bootloader's
; identity mapping already covers them when we write to them.
section .bootbss
align 4096
pml4:
    times 512 dd 0
pdpt:
    times 512 dq 0
pd:
    times 512 dq 0

; ─── Minimal 64-bit GDT used during the mode switch ───────────────────────
section .bootdata
align 8
gdt64:
    dq 0x0000000000000000      ; null
    dq 0x00209A0000000000      ; 0x08: 64-bit code, DPL0
    dq 0x0000920000000000      ; 0x10: 64-bit data, DPL0
gdt64_ptr:
    dw 24 - 1
    dd gdt64
    dd 0

section .text
bits 32
extern kernel_main
global _start
_start:
    ; Use a temporary stack in low identity-mapped memory.
    mov esp, 0x9F000
    and esp, ~0xF

    ; Are we already in long mode? If CR0.PG is set we assume the loader
    ; (multiboot2) already switched; skip the transition and go straight to
    ; the 64-bit entry.
    mov eax, cr0
    test eax, 0x80000000       ; CR0.PG
    jnz .already_long

    ; Build identity page tables.
    ; PML4[0] -> PDPT
    mov dword [pml4], pdpt
    mov dword [pml4 + 4], 0
    ; PDPT[0] -> PD
    mov dword [pdpt], pd
    mov dword [pdpt + 4], 0
    ; PD: 512 x 2 MiB pages, present + writable + huge
    mov ecx, 0
    mov eax, 0x00000083        ; present|writable|2MB
.build_pd:
    mov [pd + ecx*8], eax
    mov dword [pd + ecx*8 + 4], 0
    add eax, 0x200000
    inc ecx
    cmp ecx, 512
    jne .build_pd

    ; Enable PAE.
    mov eax, cr4
    or eax, 1 << 5
    mov cr4, eax

    ; Point CR3 at PML4.
    mov eax, pml4
    mov cr3, eax

    ; Enable long mode (EFER.LME = bit 8).
    mov ecx, 0xC0000080
    rdmsr
    or eax, 1 << 8
    wrmsr

    ; Enable paging (CR0.PG = bit 31).
    mov eax, cr0
    or eax, 1 << 31
    mov cr0, eax

    ; Load the 64-bit GDT and far-jump into long mode.
    lgdt [gdt64_ptr]
    jmp 0x08:.long_mode

.already_long:
    ; Loader already in long mode; just reload our GDT and continue.
    lgdt [gdt64_ptr]
    jmp 0x08:.long_mode

bits 64
.long_mode:
    ; Set data segments.
    mov ax, 0x10
    mov ds, ax
    mov es, ax
    mov fs, ax
    mov gs, ax
    mov ss, ax

    ; Fresh long-mode stack (identity-mapped low memory).
    mov rsp, 0x9F000
    and rsp, ~0xF
    cld
    xor rdi, rdi
    xor rsi, rsi
    call kernel_main

.hang:
    cli
    hlt
    jmp .hang
