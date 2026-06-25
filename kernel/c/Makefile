# HAZOOM OS v6.0 - Kernel Makefile
# Builds C/Assembly sources into hazoom-kernel.elf, then strips to .bin

# Toolchain
CC      := x86_64-elf-gcc
AS      := nasm
LD      := x86_64-elf-gcc
OBJCOPY := x86_64-elf-objcopy
STRIP   := x86_64-elf-strip

# Target
TARGET  := hazoom-kernel
ELF     := $(TARGET).elf
BIN     := $(TARGET).bin

# Compiler flags
CFLAGS  := -ffreestanding             \
           -O2                        \
           -Wall -Wextra              \
           -fno-exceptions            \
           -fno-rtti                 \
           -fno-stack-protector       \
           -fno-pic                  \
           -mno-red-zone              \
           -mno-sse                   \
           -mno-sse2                  \
           -mno-mmx                   \
           -mabi=sysv                 \
           -std=c11                   \
           -I.

# Assembly flags
ASFLAGS := -f elf64

# Linker flags
LDFLAGS := -T linker.ld              \
           -nostdlib                  \
           -nostartfiles              \
           -static                     \
           -z max-page-size=0x1000

# Source files
C_SOURCES   := main.c gdt.c idt.c console.c pmm.c process.c qlearn.c
ASM_SOURCES := entry.asm isr_stubs.asm

# Object files
C_OBJECTS   := $(C_SOURCES:.c=.o)
ASM_OBJECTS := $(ASM_SOURCES:.asm=.o)
OBJECTS     := $(C_OBJECTS) $(ASM_OBJECTS)

# Default target
.PHONY: all clean info

all: $(BIN)

# Link ELF
$(ELF): $(OBJECTS) linker.ld
	$(LD) $(LDFLAGS) -o $@ $(OBJECTS)

# Strip to binary
$(BIN): $(ELF)
	$(STRIP) -O elf64-x86-64 $< -o $@
	@echo "Kernel binary built: $@"
	@echo "Size: $$(stat -c%s $@) bytes"

# Compile C sources
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Assemble NASM sources
%.o: %.asm
	$(AS) $(ASFLAGS) $< -o $@

# Clean build artifacts
clean:
	rm -f $(OBJECTS) $(ELF) $(BIN)
	@echo "Build cleaned."

# Print info
info:
	@echo "HAZOOM OS v6.0 Kernel Build System"
	@echo "CC:      $(CC)"
	@echo "AS:      $(AS)"
	@echo "Sources: $(C_SOURCES) $(ASM_SOURCES)"
	@echo "Target:  $(BIN)"
