# HAZOOM OS v6.0 - Kernel Makefile
# Auto-detects toolchain, tries common cross-compiler names

# Auto-detect toolchain
X64_ELF_CC := $(shell command -v x86_64-elf-gcc 2>/dev/null)
X64_LINUX_CC := $(shell command -v x86_64-linux-gnu-gcc 2>/dev/null)
X64_GCC := $(shell command -v x86_64-gcc 2>/dev/null)
NATIVE_GCC := $(shell command -v gcc 2>/dev/null)

ifneq ($(X64_ELF_CC),)
    CC := x86_64-elf-gcc
    LD := x86_64-elf-gcc
    OBJCOPY := x86_64-elf-objcopy
    STRIP := x86_64-elf-strip
else ifneq ($(X64_LINUX_CC),)
    CC := x86_64-linux-gnu-gcc
    LD := x86_64-linux-gnu-gcc
    OBJCOPY := x86_64-linux-gnu-objcopy
    STRIP := x86_64-linux-gnu-strip
else ifneq ($(X64_GCC),)
    CC := x86_64-gcc
    LD := x86_64-gcc
    OBJCOPY := objcopy
    STRIP := strip
else
    CC := gcc
    LD := gcc
    OBJCOPY := objcopy
    STRIP := strip
endif

AS      := nasm

TARGET  := hazoom-kernel
ELF     := $(TARGET).elf
BIN     := $(TARGET).bin

CFLAGS  := -ffreestanding             \
           -O2                        \
           -Wall -Wextra              \
           -fno-exceptions            \
           -fno-stack-protector       \
           -fno-pic                   \
           -mno-red-zone              \

           -mabi=sysv                 \
           -std=gnu11                 \
           -I.

ASFLAGS := -f elf64

LDFLAGS := -T linker.ld              \
           -nostdlib                  \
           -nostartfiles              \
           -static                    \
           -z max-page-size=0x1000

C_SOURCES   := main.c gdt.c idt.c console.c pmm.c process.c qlearn.c pic.c serial.c
ASM_SOURCES := entry.asm isr_stubs.asm

C_OBJECTS   := $(C_SOURCES:.c=.o)
ASM_OBJECTS := $(ASM_SOURCES:.asm=.o)
OBJECTS     := $(C_OBJECTS) $(ASM_OBJECTS)

.PHONY: all clean info

all: $(BIN)

$(ELF): $(OBJECTS) linker.ld
	$(LD) $(LDFLAGS) -o $@ $(OBJECTS)

$(BIN): $(ELF)
	$(STRIP) -O elf64-x86-64 $< -o $@
	@echo "Kernel binary built: $@"
	@echo "Size: $$(stat -c%s $@) bytes"
	@echo "Toolchain: $(CC)"

# Flat raw multiboot binary (loads directly via QEMU -kernel, no GRUB needed)
FLAT := $(TARGET).flat

$(FLAT): $(ELF)
	$(OBJCOPY) -O binary $< $@
	@echo "Flat multiboot binary: $@ ($$(stat -c%s $@) bytes)"

run: $(FLAT)
	qemu-system-x86_64 \
		-kernel $(FLAT) \
		-serial stdio \
		-monitor none \
		-nographic \
		-m 512M \
		-machine pc,accel=tcg \
		-cpu max \
		-no-reboot

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

%.o: %.asm
	$(AS) $(ASFLAGS) $< -o $@

clean:
	rm -f $(OBJECTS) $(ELF) $(BIN)
	@echo "Build cleaned."

info:
	@echo "HAZOOM OS v6.0 Kernel Build System"
	@echo "CC:      $(CC)"
	@echo "AS:      $(AS)"
	@echo "Sources: $(C_SOURCES) $(ASM_SOURCES)"
	@echo "Target:  $(BIN)"
