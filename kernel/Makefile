CC = gcc
AS = nasm
CFLAGS = -ffreestanding -nostdlib -nostartfiles -Wall -Wextra -m32 -O2
LDFLAGS = -T linker.ld -m elf_i386

SRCS = main.c
ASRCS = entry.asm
OBJS = $(SRCS:.c=.o)
AOBJS = $(ASRCS:.asm=.o)

KERNEL = hazoom-kernel.bin

all: $(KERNEL)

$(KERNEL): $(OBJS) $(AOBJS)
	$(CC) $(LDFLAGS) -o kernel.tmp $(OBJS) $(AOBJS)
	objcopy -O binary kernel.tmp $(KERNEL)
	rm -f kernel.tmp

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

%.o: %.asm
	$(AS) -f elf32 $< -o $@

clean:
	rm -f $(OBJS) $(AOBJS) $(KERNEL) kernel.tmp

run: $(KERNEL)
	qemu-system-i386 -drive format=raw,file=$(KERNEL) -serial stdio -s

.PHONY: all clean run