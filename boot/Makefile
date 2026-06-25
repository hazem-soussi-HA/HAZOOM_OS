# HAZOOM OS v6.0 — UEFI Bootloader Makefile
#
# Prerequisites:
#   - GNU-EFI development files (libgnuefi, efilib headers)
#   - Cross-compiler or native gcc targeting x86_64-w64-mingw32
#   - objcopy supporting PE32+ output
#
# On Debian/Ubuntu:
#   sudo apt install gcc-mingw-w64 gnu-efi
#
# Usage:
#   make          — build hazoom_boot.efi
#   make clean    — remove build artifacts

# ---- Toolchain ----
CC      := gcc
OBJCOPY := objcopy

# Detect architecture — default to x86_64
ARCH    := $(shell $(CC) -dumpmachine | sed 's/-.*//')
ifeq ($(ARCH),aarch64)
    ARCH_SUFFIX := aa64
else
    ARCH_SUFFIX := x64
endif

# ---- GNU-EFI paths ----
# Try common install locations; override with make EFIINC=... EFILIB=...
EFIINC  := /usr/include/efi
EFILIB  := /usr/lib

# On systems with gnu-efi in /usr/local (manual install):
# EFIINC := /usr/local/include/efi
# EFILIB := /usr/local/lib

# ---- Flags ----
CFLAGS  := -ffreestanding \
           -nostdlib \
           -nostdinc \
           -fno-builtin \
           -fno-stack-protector \
           -fshort-wchar \
           -mno-red-zone \
           -maccumulate-outgoing-args \
           -I$(EFIINC) \
           -I$(EFIINC)/$(ARCH_SUFFIX) \
           -Wall -Wextra -O2

LDFLAGS := -nostdlib \
           -znocombreloc \
           -T $(EFILIB)/elf_$(ARCH_SUFFIX)_efi.lds \
           -shared \
           -Bsymbolic \
           -L$(EFILIB)

LIBS    := -lefi -lgnuefi $(EFILIB)/crt0-efi-$(ARCH_SUFFIX).o

# ---- Target ----
TARGET  := hazoom_boot.efi
SRCS    := boot.c
OBJS    := $(SRCS:.c=.o)

# ---- Rules ----

.PHONY: all clean

all: $(TARGET)

boot.o: boot.c hazoom_logo.h
	$(CC) $(CFLAGS) -c $< -o $@

boot.so: $(OBJS)
	$(CC) $(LDFLAGS) $^ $(LIBS) -o $@

$(TARGET): boot.so
	$(OBJCOPY) -j .text -j .sdata -j .data -j .dynamic \
	           -j .dynsym -j .rel -j .rela -j .reloc \
	           --target=efi-app-$(ARCH_SUFFIX) \
	           boot.so $@
	@echo "Built $(TARGET) for $(ARCH_SUFFIX)"

clean:
	rm -f $(OBJS) boot.so $(TARGET)
