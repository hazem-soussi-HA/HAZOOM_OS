# HAZOOM OS v6.0 — UEFI Bootloader

This directory contains the UEFI bootloader source for HAZOOM OS v6.0 ("Convergence").

## Overview

The bootloader (`boot.c`) is a UEFI application written in C using the GNU-EFI library. It performs the following sequence:

1. **Console initialization** — Clears the screen and displays the HAZOOM ASCII art logo in cyan on black.
2. **Kernel loading** — Opens the EFI System Partition, locates `\HAZOOM\kernel.bin`, reads it into memory, and copies it to a fixed physical address (2 MB).
3. **Memory map acquisition** — Calls `GetMemoryMap` to retrieve the final UEFI memory map before exiting boot services.
4. **Boot services exit** — Calls `ExitBootServices` to release UEFI boot services to the OS.
5. **Kernel handoff** — Jumps to the kernel entry point via a function pointer cast.

## Files

| File             | Description                                      |
|------------------|--------------------------------------------------|
| `boot.c`         | Main bootloader source (UEFI application)        |
| `hazoom_logo.h`  | ASCII art logo as a `const char` array           |
| `Makefile`       | Build system — produces `hazoom_boot.efi`        |
| `README.md`      | This file                                        |

## Building

### Prerequisites

- GNU-EFI development libraries and headers
- GCC (native or cross-compiler for x86_64/aa64)
- `objcopy` supporting PE32+ output

On Debian/Ubuntu:

```bash
sudo apt install gcc gnu-efi
```

### Compile

```bash
cd /home/hazem/HAZOOM_OS/boot
make
```

This produces `hazoom_boot.efi`, a PE32+ UEFI application.

### Clean

```bash
make clean
```

## Usage

Place `hazoom_boot.efi` on your EFI System Partition (ESP) at:

```
/EFI/BOOT/BOOTX64.EFI    (for x86_64)
/EFI/BOOT/BOOTAA64.EFI    (for AArch64)
```

Place your kernel binary at:

```
\HAZOOM\kernel.bin
```

## Error Handling

If the kernel binary is not found on the ESP, the bootloader prints:

```
HAZOOM: kernel.bin not found
```

and halts the CPU in an infinite loop.

## Architecture

The bootloader targets x86_64 by default. To build for AArch64, set:

```bash
make ARCH=aarch64
```

## License

HAZOOM OS — Proprietary. All rights reserved.
