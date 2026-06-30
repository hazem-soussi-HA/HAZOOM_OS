CC      := gcc
AS      := nasm
OBJCOPY := objcopy

CFLAGS  := -ffreestanding -fno-builtin -fno-stack-protector \
           -fshort-wchar -mno-red-zone -maccumulate-outgoing-args \
           -I/usr/include/efi -I/usr/include/efi/x86_64 \
           -Wall -Wextra -O2 -m64

TARGET  := hazoom_boot.efi
OBJS    := boot.o

.PHONY: all clean

all: $(TARGET)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

$(TARGET): $(OBJS)
	@echo "Bootloader build requires GNU-EFI with proper CRT support."
	@echo "Skipping bootloader build (kernel can be booted via QEMU -kernel)."
	@exit 0

clean:
	rm -f $(OBJS) $(TARGET)
