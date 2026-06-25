/*
 * HAZOOM OS v6.0 - Interactive Shell
 * userspace/shell/shell.c
 *
 * HAZOOM Shell - A simple command-line interface for HAZOOM OS.
 * Supports: help, status, ps, mem, ls, tick, clear, neofetch
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

static int strcmp_local(const char *s1, const char *s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return (unsigned char)*s1 - (unsigned char)*s2;
}

static void strncpy_local(char *dest, const char *src, int n) {
    int i;
    for (i = 0; i < n - 1 && src[i]; i++) {
        dest[i] = src[i];
    }
    dest[i] = '\0';
}

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

/* ==================== Command Handlers ==================== */

static void cmd_help(void) {
    println("HAZOOM OS v6.0 Shell - Available commands:");
    println("");
    println("  help      - Show this help message");
    println("  status    - Display kernel status from /proc/hazoom/status");
    println("  ps        - List running processes from /proc/hazoom/processes");
    println("  mem       - Show memory usage");
    println("  ls        - List files in current directory");
    println("  tick      - Show system uptime (kernel ticks)");
    println("  clear     - Clear the screen");
    println("  neofetch  - Display system information banner");
    println("  exit      - Exit shell (not recommended on a real system)");
    println("");
}

static void cmd_status(void) {
    println("=== HAZOOM Kernel Status ===");
    println("");

    int fd = sys_open("/proc/hazoom/status", 0 /* O_RDONLY */, 0);
    if (fd < 0) {
        println("[ERROR] Cannot open /proc/hazoom/status");
        println("  Is the HAZOOM kernel running?");
        return;
    }

    char buf[4096];
    long ret = sys_read(fd, buf, sizeof(buf) - 1);
    if (ret > 0) {
        buf[ret] = '\0';
        print(buf);
    } else {
        println("[ERROR] Read failed");
    }
    sys_close(fd);
}

static void cmd_ps(void) {
    println("=== HAZOOM Process List ===");
    println("");

    int fd = sys_open("/proc/hazoom/processes", 0, 0);
    if (fd < 0) {
        println("[ERROR] Cannot open /proc/hazoom/processes");
        println("  Is the HAZOOM kernel running?");
        return;
    }

    char buf[4096];
    long ret = sys_read(fd, buf, sizeof(buf) - 1);
    if (ret > 0) {
        buf[ret] = '\0';
        print(buf);
    } else {
        println("[ERROR] Read failed");
    }
    sys_close(fd);
}

static void cmd_mem(void) {
    println("=== Memory Information ===");
    println("");

    int fd = sys_open("/proc/hazoom/meminfo", 0, 0);
    if (fd < 0) {
        /* Fallback: try /proc/meminfo */
        fd = sys_open("/proc/meminfo", 0, 0);
        if (fd < 0) {
            println("[ERROR] Cannot open memory info");
            return;
        }
    }

    char buf[2048];
    long ret = sys_read(fd, buf, sizeof(buf) - 1);
    if (ret > 0) {
        buf[ret] = '\0';
        print(buf);
    }
    sys_close(fd);
}

static void cmd_ls(void) {
    println("=== Directory Listing ===");
    println("");

    int fd = sys_open(".", 0 /* O_RDONLY */, 0);
    if (fd < 0) {
        println("[ERROR] Cannot open directory");
        return;
    }

    /* Read directory entries using getdents would need a syscall */
    /* For now, list known HAZOOM directories */
    println("  bin/  dev/  etc/  proc/  tmp/  usr/  var/");
    println("");
    println("  (Full directory listing requires getdents syscall)");
    sys_close(fd);
}

static void cmd_tick(void) {
    println("=== System Uptime ===");

    int fd = sys_open("/proc/hazoom/uptime", 0, 0);
    if (fd < 0) {
        println("[ERROR] Cannot read uptime");
        return;
    }

    char buf[64];
    long ret = sys_read(fd, buf, sizeof(buf) - 1);
    if (ret > 0) {
        buf[ret] = '\0';
        print("  Uptime: ");
        print(buf);
        println(" ticks");
    }
    sys_close(fd);
}

static void cmd_clear(void) {
    /* ANSI escape sequence to clear screen */
    print("\033[2J\033[H");
}

static void cmd_neofetch(void) {
    println("");
    println("        .--.        hazem@hazoom-os");
    println("       |o_o |       OS: HAZOOM OS v6.0");
    println("       |:_/ |       Kernel: hazoom-kernel 6.0.0");
    println("      //   \\ \\      Shell: hazoom-shell");
    println("     (|     | )     Compositor: hazoom-compositor");
    println("    /'\\_   _/`\\     AI: hazoom-ai (Q-learning)");
    println("    \\___)=(___/     Arch: x86_64");
    println("                    Memory: 256MB");
    println("                    Terminal: /dev/console");
    println("");
    println("     ████████████    ██");
    println("   ██            ██  ██");
    println(" ██    ████████    ██  ██");
    println(" ██  ██        ██  ██  ██");
    println(" ██  ██  ████  ██  ██  ██");
    println(" ██  ██        ██  ██  ██");
    println(" ██    ████████    ██  ██");
    println("   ██            ██  ██");
    println("     ████████████    ██");
    println("");
}

/* ==================== Main Shell Loop ==================== */

int main(void) {
    char input[256];
    char prompt[] = "hazem@hazoom-os $ ";

    /* Print welcome banner */
    println("");
    println("  ╔═══════════════════════════════════════╗");
    println("  ║     HAZOOM OS v6.0 - Shell            ║");
    println("  ║     Type 'help' for commands           ║");
    println("  ╚═══════════════════════════════════════╝");
    println("");

    while (1) {
        /* Print prompt */
        sys_write(1, prompt, sizeof(prompt) - 1);

        /* Read input */
        long ret = sys_read(0, input, sizeof(input) - 1);
        if (ret <= 0) {
            println("");
            continue;
        }
        input[ret] = '\0';

        /* Strip trailing newline */
        int len = 0;
        while (input[len]) len++;
        if (len > 0 && input[len - 1] == '\n') {
            input[len - 1] = '\0';
            len--;
        }
        if (len > 0 && input[len - 1] == '\r') {
            input[len - 1] = '\0';
            len--;
        }

        /* Skip empty input */
        if (len == 0) continue;

        /* Parse and execute command */
        if (strcmp_local(input, "help") == 0) {
            cmd_help();
        } else if (strcmp_local(input, "status") == 0) {
            cmd_status();
        } else if (strcmp_local(input, "ps") == 0) {
            cmd_ps();
        } else if (strcmp_local(input, "mem") == 0) {
            cmd_mem();
        } else if (strcmp_local(input, "ls") == 0) {
            cmd_ls();
        } else if (strcmp_local(input, "tick") == 0) {
            cmd_tick();
        } else if (strcmp_local(input, "clear") == 0) {
            cmd_clear();
        } else if (strcmp_local(input, "neofetch") == 0) {
            cmd_neofetch();
        } else if (strcmp_local(input, "exit") == 0) {
            println("Goodbye!");
            sys_exit(0);
        } else {
            print("hazoom: command not found: ");
            println(input);
            println("  Type 'help' for available commands.");
        }
    }

    return 0;
}
