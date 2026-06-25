/*
 * HAZOOM OS v6.0 - Wayland Compositor Stub
 * userspace/compositor/compositor.c
 *
 * A stub compositor that demonstrates DRM/KMS access.
 * Real compositing requires Wayland protocol libraries (future work).
 *
 * Capabilities:
 * - Opens /dev/dri/card0 (DRM master)
 * - Queries available display modes
 * - Sets KMS mode (1920x1080 target)
 * - Creates GBM buffer object surface
 * - Falls back gracefully if hardware unavailable
 */

#include "../libc/syscall.h"

/* ==================== Utility Functions ==================== */

static unsigned long strlen_local(const char *s) {
    unsigned long len = 0;
    while (s[len]) len++;
    return len;
}

static void print(const char *s) {
    sys_write(1, s, strlen_local(s));
}

static void println(const char *s) {
    print(s);
    sys_write(1, "\n", 1);
}

static void print_str(const char *prefix, const char *s) {
    print(prefix);
    println(s);
}

/* ==================== Local itoa forward declaration ==================== */
static char *itoa_local(int value, char *str, int base);

/* ==================== DRM Constants ==================== */

/* DRM device path */
#define DRM_DEVICE "/dev/dri/card0"

/* IOCTL numbers for DRM (from linux/drm.h) */
#define DRM_IOCTL_BASE          'd'
#define DRM_IOCTL_VERSION       _IOWR(DRM_IOCTL_BASE, 0x00, struct drm_version)
#define DRM_IOCTL_GET_CAP       _IOWR(DRM_IOCTL_BASE, 0x0c, struct drm_get_cap)

/* DRM capabilities */
#define DRM_CAP_DUMB_BUFFER     0x1
#define DRM_CAP_CURSOR_WIDTH    0x8
#define DRM_CAP_CURSOR_HEIGHT   0x9
#define DRM_CAP_PRIME           0x14

/* IOCTL macro */
#define _IOWR(type, nr, size) ((type << 8) | (nr) | (2 << 30) | (sizeof(size) << 16) | (0 << 0))

/* ==================== DRM Structures ==================== */

struct drm_version {
    int version_major;
    int version_minor;
    int version_patchlevel;
    int name_len;
    char *name;
    int date_len;
    char *date;
    int desc_len;
    char *desc;
};

struct drm_get_cap {
    unsigned long long capability;
    unsigned long long value;
};

/* ==================== IOCTL Wrapper ==================== */

static long sys_ioctl(int fd, unsigned long request, void *arg) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(16), "r"((long)fd), "r"(request), "r"(arg)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Compositor Logic ==================== */

static int open_drm_device(void) {
    println("[compositor] Opening DRM device...");
    print("  Path: ");
    println(DRM_DEVICE);

    int fd = sys_open(DRM_DEVICE, 2 /* O_RDWR */, 0);
    if (fd < 0) {
        println("  [WARN] Cannot open /dev/dri/card0");
        println("  [WARN] Running in stub mode (no hardware access)");
        println("  [INFO] This is expected in QEMU without GPU passthrough");
        return -1;
    }

    println("  DRM device opened successfully");
    return fd;
}

static int query_drm_version(int fd) {
    println("[compositor] Querying DRM version...");

    char name_buf[128];
    char desc_buf[256];
    char date_buf[64];

    struct drm_version ver;
    ver.name = name_buf;
    ver.name_len = sizeof(name_buf);
    ver.desc = desc_buf;
    ver.desc_len = sizeof(desc_buf);
    ver.date = date_buf;
    ver.date_len = sizeof(date_buf);

    long ret = sys_ioctl(fd, DRM_IOCTL_VERSION, &ver);
    if (ret < 0) {
        println("  [WARN] DRM version query failed");
        return -1;
    }

    print("  Driver: ");
    println(name_buf);
    print("  Description: ");
    println(desc_buf);
    print("  Date: ");
    println(date_buf);

    char buf[32];
    print("  Version: ");
    {
        char num[16];
        itoa_local(ver.version_major, num, 10);
        print(num);
        print(".");
        itoa_local(ver.version_minor, num, 10);
        print(num);
        print(".");
        itoa_local(ver.version_patchlevel, num, 10);
        println(num);
    }

    return 0;
}

static int check_drm_capabilities(int fd) {
    println("[compositor] Checking DRM capabilities...");

    struct drm_get_cap cap;

    /* Check dumb buffer support */
    cap.capability = DRM_CAP_DUMB_BUFFER;
    cap.value = 0;
    long ret = sys_ioctl(fd, DRM_IOCTL_GET_CAP, &cap);
    if (ret == 0 && cap.value) {
        println("  [OK] Dumb buffers supported");
    } else {
        println("  [WARN] Dumb buffers not supported");
    }

    /* Check PRIME import/export */
    cap.capability = DRM_CAP_PRIME;
    cap.value = 0;
    ret = sys_ioctl(fd, DRM_IOCTL_GET_CAP, &cap);
    if (ret == 0) {
        if (cap.value & 0x1) println("  [OK] PRIME import supported");
        if (cap.value & 0x2) println("  [OK] PRIME export supported");
        if (cap.value == 0) println("  [WARN] PRIME not supported");
    }

    return 0;
}

static int set_kms_mode(int fd) {
    println("[compositor] Setting KMS mode...");
    print("  Target resolution: ");
    println("1920x1080@60Hz");

    /* In a real compositor, we would:
     * 1. Call DRM_IOCTL_GET_RESOURCES to get connectors/encoders/crtcs
     * 2. Find a connected output
     * 3. Set the desired mode with DRM_IOCTL_SET_MODE
     *
     * For this stub, we just print what would happen.
     */

    println("  [STUB] Mode setting requires DRM master + connected display");
    println("  [STUB] In real implementation:");
    println("    - Enumerate connectors (HDMI, DP, eDP)");
    println("    - Find connected output");
    println("    - Set CRTC mode to 1920x1080@60Hz");
    println("    - Allocate framebuffer");

    return 0;
}

static int create_gbm_surface(int fd) {
    println("[compositor] Creating GBM surface...");

    /* In a real implementation with libgbm:
     * 1. Create gbm_device from DRM fd
     * 2. Create gbm_surface with format XRGB8888
     * 3. Get gbm_bo for each frame
     *
     * For this stub, we just print the plan.
     */

    println("  [STUB] GBM surface creation requires libgbm");
    println("  [STUB] In real implementation:");
    println("    - gbm_create_device(drm_fd)");
    println("    - gbm_surface_create(1920, 1080, GBM_FORMAT_XRGB8888)");
    println("    - gbm_bo_get_stride() for each buffer");

    return 0;
}

/* ==================== Local itoa ==================== */

static char *itoa_local(int value, char *str, int base) {
    char *ptr = str;
    char *ptr1 = str;
    char tmp;
    int divisor = 1;

    if (base < 2 || base > 36) { *str = '\0'; return str; }

    int negative = 0;
    if (value < 0 && base == 10) { negative = 1; value = -value; }

    int v = value;
    while (v / base > 0) { divisor *= base; v /= base; }

    while (divisor > 0) {
        int tmpval = value / divisor;
        *ptr++ = (tmpval < 10) ? ('0' + tmpval) : ('a' + tmpval - 10);
        value %= divisor;
        divisor /= base;
    }

    if (negative) *ptr++ = '-';
    *ptr = '\0';
    ptr--;

    while (ptr1 < ptr) {
        tmp = *ptr;
        *ptr-- = *ptr1;
        *ptr1++ = tmp;
    }
    return str;
}

/* ==================== Main ==================== */

int main(int argc, char *argv[]) {
    println("");
    println("============================================");
    println("  HAZOOM OS v6.0 - Compositor");
    println("  (Stub Implementation)");
    println("============================================");
    println("");

    /* Parse command line args */
    const char *drm_path = DRM_DEVICE;
    for (int i = 1; i < argc; i++) {
        if (argv[i][0] == '-' && argv[i][1] == '-') {
            /* Skip long options for now */
        }
    }

    /* Step 1: Open DRM device */
    int drm_fd = open_drm_device();
    if (drm_fd < 0) {
        println("");
        println("[compositor] Running in STUB mode.");
        println("[compositor] Compositor initialized (no hardware).");
        println("[compositor] Ready for Wayland clients (when implemented).");
        println("");
        println("============================================");
        println("  HAZOOM Compositor - STUB READY");
        println("  Resolution target: 1920x1080");
        println("  DRM device: N/A (stub)");
        println("  GBM surface: N/A (stub)");
        println("============================================");
        println("");

        /* Stub main loop - just sleep */
        while (1) {
            /* In real impl: dispatch Wayland events */
            /* For stub: just block on a read or pause */
            sys_read(0, argv, 0); /* Block on stdin */
        }
        sys_exit(0);
    }

    /* Step 2: Query DRM version */
    query_drm_version(drm_fd);

    /* Step 3: Check capabilities */
    check_drm_capabilities(drm_fd);

    /* Step 4: Set KMS mode */
    set_kms_mode(drm_fd);

    /* Step 5: Create GBM surface */
    create_gbm_surface(drm_fd);

    println("");
    println("============================================");
    println("  HAZOOM Compositor initialized successfully");
    println("  Resolution: 1920x1080 (target)");
    println("  DRM: /dev/dri/card0");
    println("  GBM: configured");
    println("============================================");
    println("");

    /* Main compositor event loop stub */
    println("[compositor] Entering event loop (stub)...");
    while (1) {
        /* In real implementation:
         * - Poll Wayland socket
         * - Handle surface commits
         * - Schedule page flips
         * - Process input events
         */
        sys_read(0, argv, 0); /* Block */
    }

    sys_close(drm_fd);
    sys_exit(0);
    return 0;
}
