/*
 * HAZOOM OS v6.0 - Init Process (PID 1)
 * userspace/init/init.c
 *
 * First userspace process. Responsibilities:
 * - Mount filesystems (/proc, /dev)
 * - Start system console
 * - Launch system services (compositor, AI daemon, shell)
 * - Reap zombie processes
 */

#include "../libc/syscall.h"

/* HAZOOM-specific syscall numbers (custom kernel) */
#define SYS_mount     22
#define SYS_printk    30

/* Wrapper for HAZOOM kernel print (for early boot messages) */
static long hazoom_print(const char *msg) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_printk), "r"(msg)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* Wrapper for HAZOOM mount */
static long hazoom_mount(const char *source, const char *target, const char *fstype) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_mount), "r"(source), "r"(target), "r"(fstype)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* Forward declarations */
static char *itoa(int value, char *str, int base);

/* Helper: print to stdout */
static void print(const char *s) {
    sys_write(1, s, strlen_local(s));
}

/* Helper: print a newline */
static void println(const char *s) {
    print(s);
    sys_write(1, "\n", 1);
}

/* Helper: fork + exec */
static void spawn(const char *path, char *const argv[]) {
    long pid = sys_fork();
    if (pid == 0) {
        /* Child */
        char *envp[] = { "PATH=/usr/bin:/bin", "HOME=/root", "TERM=hazoom", 0 };
        sys_execve(path, argv, envp);
        /* If exec fails, exit */
        sys_exit(1);
    }
    /* Parent continues */
    if (pid > 0) {
        char buf[64];
        print("  spawned PID ");
        itoa((int)pid, buf, 10);
        print(buf);
        print(": ");
        println(path);
    } else {
        println("  [ERROR] fork failed!");
    }
}

/* Helper: simple itoa */
static char *itoa(int value, char *str, int base);

int main(void) {
    char buf[64];

    println("============================================");
    println("  HAZOOM OS v6.0 - Init Process (PID 1)");
    println("============================================");
    println("");
    println("[init] HAZOOM Init starting...");

    /* Print PID */
    println("[init] My PID: ");
    long pid = sys_getpid();
    itoa((int)pid, buf, 10);
    println(buf);
    println("");

    /* Mount /proc */
    println("[init] Mounting filesystems...");
    hazoom_mount("proc", "/proc", "proc");
    println("  /proc mounted (procfs)");

    /* Mount /dev as devtmpfs */
    hazoom_mount("devtmpfs", "/dev", "devtmpfs");
    println("  /dev mounted (devtmpfs)");

    /* Create essential device nodes if they don't exist */
    println("[init] Checking device nodes...");
    int fd = sys_open("/dev/console", 2 /* O_RDWR */, 0);
    if (fd < 0) {
        println("  /dev/console not found, creating...");
        /* mknod equivalent - would need a syscall, skip for now */
    } else {
        sys_close(fd);
        println("  /dev/console available");
    }

    fd = sys_open("/dev/null", 2, 0);
    if (fd < 0) {
        println("  /dev/null not found");
    } else {
        sys_close(fd);
        println("  /dev/null available");
    }

    fd = sys_open("/dev/zero", 2, 0);
    if (fd < 0) {
        println("  /dev/zero not found");
    } else {
        sys_close(fd);
        println("  /dev/zero available");
    }
    println("");

    /* Start console/getty */
    println("[init] Starting system console...");
    {
        char *getty_argv[] = { "/usr/bin/getty", "/dev/console", "115200", 0 };
        spawn("/usr/bin/getty", getty_argv);
    }
    println("");

    /* Start compositor */
    println("[init] Starting display server...");
    {
        char *comp_argv[] = { "/usr/bin/hazoom-compositor", "--drm", "/dev/dri/card0", 0 };
        spawn("/usr/bin/hazoom-compositor", comp_argv);
    }
    println("");

    /* Start AI daemon (Q-learning training) */
    println("[init] Starting HAZOOM AI daemon (Q-learning)...");
    {
        char *ai_argv[] = { "/usr/bin/hazoom-ai", "--mode=train", "--episodes=10000", 0 };
        spawn("/usr/bin/hazoom-ai", ai_argv);
    }
    println("");

    /* Start shell */
    println("[init] Starting HAZOOM shell...");
    {
        char *shell_argv[] = { "/usr/bin/hazoom-shell", 0 };
        spawn("/usr/bin/hazoom-shell", shell_argv);
    }
    println("");

    println("============================================");
    println("[init] All services started.");
    println("[init] Entering zombie reaping loop...");
    println("============================================");

    /* Zombie reaping loop */
    int status;
    while (1) {
        long ret = sys_wait(&status);
        if (ret > 0) {
            char buf2[64];
            print("[init] Reaped zombie PID ");
            itoa((int)ret, buf2, 10);
            print(buf2);
            print(" status=");
            itoa(status, buf2, 10);
            println(buf2);
        }
        /* Small yield - in a real kernel we'd sched_yield() */
    }

    /* Should never reach here */
    sys_exit(0);
    return 0;
}

/* Local itoa implementation for init */
static char *itoa(int value, char *str, int base) {
    char *ptr = str;
    char *ptr1 = str;
    char tmp;
    int tmpval;
    int divisor = 1;

    if (base < 2 || base > 36) {
        *str = '\0';
        return str;
    }

    int negative = 0;
    if (value < 0 && base == 10) {
        negative = 1;
        value = -value;
    }

    int v = value;
    while (v / base > 0) {
        divisor *= base;
        v /= base;
    }

    while (divisor > 0) {
        tmpval = value / divisor;
        *ptr++ = (tmpval < 10) ? ('0' + tmpval) : ('a' + tmpval - 10);
        value %= divisor;
        divisor /= base;
    }

    if (negative) {
        *ptr++ = '-';
    }

    *ptr = '\0';
    ptr--;

    while (ptr1 < ptr) {
        tmp = *ptr;
        *ptr-- = *ptr1;
        *ptr1++ = tmp;
    }

    return str;
}
