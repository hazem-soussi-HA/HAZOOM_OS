# HAZOOM OS v6.0 - Compositor Makefile
# userspace/compositor/Makefile

CC = x86_64-elf-gcc
CC_FALLBACK = gcc
CFLAGS = -ffreestanding -nostdlib -nostdinc -fno-builtin -fno-stack-protector \
         -mno-red-zone -mno-sse -mno-sse2 -Wall -O2
LDFLAGS = -nostdlib -static

# Try cross-compiler first, fall back to host gcc
ifeq ($(shell which $(CC) 2>/dev/null),)
    CC = $(CC_FALLBACK)
    CFLAGS += -DHOST_BUILD
endif

TARGET = ../../initramfs/hazoom-compositor
SRC = compositor.c
OBJ = compositor.o

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJ)
	@mkdir -p ../../initramfs
	$(CC) $(LDFLAGS) -o $@ $<

$(OBJ): $(SRC) ../libc/syscall.h
	$(CC) $(CFLAGS) -c -o $@ $<

clean:
	rm -f $(OBJ) $(TARGET)
