#include "../kernel.h"

static char filesystem[1024 * 1024];
static int fs_initialized = 0;

int fs_init(void) {
    fs_initialized = 1;
    return 0;
}

int fs_open(const char *path) {
    return fs_initialized ? 1 : -1;
}

int fs_read(int fd, char *buf, int size) {
    if (fd < 0 || !fs_initialized) return -1;
    return size;
}

int fs_write(int fd, const char *buf, int size) {
    if (fd < 0 || !fs_initialized) return -1;
    return size;
}

int fs_close(int fd) {
    return fd >= 0 ? 0 : -1;
}

int fs_mkdir(const char *path) {
    return fs_initialized ? 0 : -1;
}