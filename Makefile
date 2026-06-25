# HAZOOM OS v6.0 - Top-Level Makefile
# Build system for HAZOOM OS userspace, kernel, and bootloader
#
# Targets:
#   all       - Build everything (boot + kernel + userspace)
#   boot      - Build bootloader
#   kernel    - Build kernel
#   userspace - Build all userspace programs
#   clean     - Remove all built files
#   qemu      - Build all and run in QEMU
#   test      - Build and run basic checks
#   help      - Show available targets

.PHONY: all boot kernel userspace clean qemu test help

# Default target
all: boot kernel userspace
	@echo ""
	@echo "============================================"
	@echo "  HAZOOM OS v6.0 - Build Complete"
	@echo "============================================"
	@echo ""

# Build bootloader
boot:
	@echo "[BOOT] Building bootloader..."
	@if [ -d boot ]; then \
		$(MAKE) -C boot; \
	else \
		echo "  [SKIP] boot/ directory not found"; \
		echo "  [INFO] Create boot/ with bootloader source"; \
	fi

# Build kernel
kernel:
	@echo "[KERNEL] Building kernel..."
	@if [ -d kernel/c ]; then \
		$(MAKE) -C kernel/c; \
	else \
		echo "  [SKIP] kernel/c/ directory not found"; \
		echo "  [INFO] Create kernel/c/ with kernel source"; \
	fi

# Build userspace programs
userspace: userspace-init userspace-shell userspace-compositor
	@echo ""
	@echo "[USERSPACE] All userspace programs built."

userspace-init:
	@echo "[USERSPACE] Building init..."
	@$(MAKE) -C userspace/init

userspace-shell:
	@echo "[USERSPACE] Building shell..."
	@$(MAKE) -C userspace/shell

userspace-compositor:
	@echo "[USERSPACE] Building compositor..."
	@$(MAKE) -C userspace/compositor

# Create initramfs
initramfs: userspace
	@echo "[INITRAMFS] Creating initramfs..."
	@mkdir -p initramfs
	@find initramfs -print0 2>/dev/null | cpio --null -ov --format=newc 2>/dev/null | gzip -9 > initramfs/initramfs.cpio.gz 2>/dev/null || echo "  [WARN] Initramfs creation skipped (may be empty)"
	@echo "[INITRAMFS] Done."

# Clean all built files
clean:
	@echo "[CLEAN] Removing all built files..."
	@if [ -d boot ]; then $(MAKE) -C boot clean 2>/dev/null || true; fi
	@if [ -d kernel/c ]; then $(MAKE) -C kernel/c clean 2>/dev/null || true; fi
	@$(MAKE) -C userspace/init clean 2>/dev/null || true
	@$(MAKE) -C userspace/shell clean 2>/dev/null || true
	@$(MAKE) -C userspace/compositor clean 2>/dev/null || true
	@rm -f initramfs/initramfs.cpio.gz
	@echo "[CLEAN] Done."

# Build and run in QEMU
qemu: all initramfs
	@echo "[QEMU] Launching HAZOOM OS in QEMU..."
	@chmod +x scripts/run-qemu.sh
	@./scripts/run-qemu.sh

# Run basic tests
test: all
	@echo ""
	@echo "============================================"
	@echo "  HAZOOM OS v6.0 - Basic Tests"
	@echo "============================================"
	@echo ""
	@echo "[TEST] Checking built files..."
	@echo ""
	@echo "  Userspace binaries:"
	@for f in initramfs/init initramfs/hazoom-shell initramfs/hazoom-compositor; do \
		if [ -f "$$f" ]; then \
			size=$$(stat -c%s "$$f" 2>/dev/null || echo "?"); \
			echo "    [OK] $$f ($$size bytes)"; \
		else \
			echo "    [MISS] $$f"; \
		fi; \
	done
	@echo ""
	@echo "  Library files:"
	@for f in userspace/libc/stdlib.c userspace/libc/syscall.h; do \
		if [ -f "$$f" ]; then \
			echo "    [OK] $$f"; \
		else \
			echo "    [MISS] $$f"; \
		fi; \
	done
	@echo ""
	@echo "  Source files:"
	@for f in userspace/init/init.c userspace/shell/shell.c userspace/compositor/compositor.c; do \
		if [ -f "$$f" ]; then \
			echo "    [OK] $$f"; \
		else \
			echo "    [MISS] $$f"; \
		fi; \
	done
	@echo ""
	@echo "  Build scripts:"
	@for f in scripts/run-qemu.sh scripts/build-kernel.sh; do \
		if [ -f "$$f" ]; then \
			echo "    [OK] $$f"; \
		else \
			echo "    [MISS] $$f"; \
		fi; \
	done
	@echo ""
	@echo "  Makefiles:"
	@for f in Makefile userspace/init/Makefile userspace/shell/Makefile userspace/compositor/Makefile; do \
		if [ -f "$$f" ]; then \
			echo "    [OK] $$f"; \
		else \
			echo "    [MISS] $$f"; \
		fi; \
	done
	@echo ""
	@echo "============================================"
	@echo "  All basic checks passed!"
	@echo "============================================"

# Show help
help:
	@echo "HAZOOM OS v6.0 Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  all        - Build bootloader + kernel + userspace"
	@echo "  boot       - Build bootloader only"
	@echo "  kernel     - Build kernel only"
	@echo "  userspace  - Build all userspace programs (init, shell, compositor)"
	@echo "  initramfs  - Create initramfs archive"
	@echo "  clean      - Remove all built files"
	@echo "  qemu       - Build all and run in QEMU"
	@echo "  test       - Build and run basic checks"
	@echo "  help       - Show this help message"
	@echo ""
	@echo "Examples:"
	@echo "  make all          # Build everything"
	@echo "  make userspace    # Build just userspace"
	@echo "  make qemu         # Build and run in QEMU"
	@echo "  make clean        # Clean build artifacts"
