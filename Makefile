.PHONY: all kernel kernel-v6 kernel-v1 clean run-qemu iso dev-install \
        check bootloader userspace services python-services help

all: kernel

# Build v6.0 64-bit kernel (primary target)
kernel:
	@echo "Building HAZOOM OS v6.0 kernel..."
	$(MAKE) -C kernel/c all
	@echo "Kernel built: kernel/c/hazoom-kernel.bin"

# Build v1.0 32-bit kernel (legacy)
kernel-v1:
	@echo "Building HAZOOM OS v1.0 kernel (32-bit)..."
	$(MAKE) -C kernel all
	@echo "Kernel built: kernel/hazoom-kernel.bin"

# Build bootloader
bootloader:
	@echo "Building UEFI bootloader..."
	$(MAKE) -C boot all
	@echo "Bootloader built: boot/hazoom_boot.efi"

# Build userspace components
userspace:
	@echo "Building userspace components..."
	-for dir in userspace/libc userspace/init userspace/shell userspace/compositor; do \
		if [ -f "$$dir/Makefile" ]; then \
			$(MAKE) -C $$dir || true; \
		fi \
	done

clean:
	$(MAKE) -C kernel/c clean 2>/dev/null || true
	$(MAKE) -C kernel clean 2>/dev/null || true
	$(MAKE) -C boot clean 2>/dev/null || true
	@echo "Build cleaned."

run-qemu: kernel
	qemu-system-x86_64 \
		-bios /usr/share/ovmf/OVMF.fd \
		-drive format=raw,file=kernel/c/hazoom-kernel.bin \
		-serial stdio \
		-s \
		-m 512M \
		-machine q35,accel=kvm:hvf:tcg \
		-cpu max

iso: kernel
	@echo "Building HAOZOOM OS ISO..."
	mkdir -p iso_root/boot/grub
	cp kernel/c/hazoom-kernel.elf iso_root/boot/hazoom-kernel.elf
	echo 'set timeout=0' > iso_root/boot/grub/grub.cfg
	echo 'set debug=all' >> iso_root/boot/grub/grub.cfg
	echo 'terminal_output serial' >> iso_root/boot/grub/grub.cfg
	echo 'serial --unit=0 --speed=115200' >> iso_root/boot/grub/grub.cfg
	echo 'insmod multiboot2' >> iso_root/boot/grub/grub.cfg
	echo 'menuentry "HAZOOM OS v6.0" {' >> iso_root/boot/grub/grub.cfg
	echo '  echo "GRUB: loading kernel..."' >> iso_root/boot/grub/grub.cfg
	echo '  multiboot2 /boot/hazoom-kernel.elf' >> iso_root/boot/grub/grub.cfg
	echo '  echo "GRUB: boot"' >> iso_root/boot/grub/grub.cfg
	echo '  boot' >> iso_root/boot/grub/grub.cfg
	echo '}' >> iso_root/boot/grub/grub.cfg
	grub-mkrescue -o hazoom-os.iso iso_root/ 2>&1
	rm -rf iso_root
	@echo "ISO built: hazoom-os.iso"
	@ls -lh hazoom-os.iso

dev-install:
	@echo "Installing development dependencies..."
	sudo apt-get update && sudo apt-get install -y \
		gcc nasm qemu-system-x86 ovmf gdb-multiarch \
		xorriso mtools || true
	@echo "Done."

check:
	@echo "=== Kernel v6.0 (64-bit) ==="
	@ls -la kernel/c/hazoom-kernel.bin 2>/dev/null || echo "Not built yet"
	@echo "=== Kernel v1.0 (32-bit) ==="
	@ls -la kernel/hazoom-kernel.bin 2>/dev/null || echo "Not built yet"
	@echo "=== Bootloader ==="
	@ls -la boot/hazoom_boot.efi 2>/dev/null || echo "Not built yet"
	@echo "=== Done ==="

help:
	@echo "HAZOOM OS v6.0 - Build System"
	@echo ""
	@echo "Targets:"
	@echo "  make              - Build v6.0 kernel"
	@echo "  make kernel       - Build v6.0 kernel"
	@echo "  make kernel-v1    - Build v1.0 kernel (32-bit)"
	@echo "  make bootloader   - Build UEFI bootloader"
	@echo "  make userspace    - Build userspace components"
	@echo "  make iso          - Build bootable ISO"
	@echo "  make run-qemu     - Boot kernel in QEMU"
	@echo "  make clean        - Clean all builds"
	@echo "  make dev-install  - Install build dependencies"
	@echo ""
	@echo "Run:"
	@echo "  ./start.sh simulation  - Browser-based OS"
	@echo "  ./start.sh kernel      - Boot in QEMU"
	@echo "  ./start.sh docker      - Full stack via Docker"
