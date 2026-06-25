/*
 * HAZOOM OS v6.0 - Syscall Wrappers
 * userspace/libc/syscall.h
 *
 * Provides direct Linux x86_64 syscall wrappers using inline assembly.
 */

#ifndef _SYSCALL_H
#define _SYSCALL_H

/* Syscall numbers (Linux x86_64) */
#define SYS_read     0
#define SYS_write    1
#define SYS_open     2
#define SYS_close    3
#define SYS_fork     57
#define SYS_exec      59
#define SYS_wait     61
#define SYS_exit     60
#define SYS_mmap     9
#define SYS_getpid   39
#define SYS_socket   41
#define SYS_connect  42

/* ==================== Read ==================== */
static inline long sys_read(int fd, void *buf, unsigned long count) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_read), "r"((long)fd), "r"(buf), "r"(count)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Write ==================== */
static inline long sys_write(int fd, const void *buf, unsigned long count) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_write), "r"((long)fd), "r"(buf), "r"(count)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Open ==================== */
static inline long sys_open(const char *pathname, int flags, int mode) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_open), "r"(pathname), "r"((long)flags), "r"((long)mode)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Close ==================== */
static inline long sys_close(int fd) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_close), "r"((long)fd)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Fork ==================== */
static inline long sys_fork(void) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_fork)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Execve ==================== */
static inline long sys_execve(const char *pathname, char *const argv[], char *const envp[]) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_exec), "r"(pathname), "r"(argv), "r"(envp)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Wait ==================== */
static inline long sys_wait(int *status) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_wait), "r"(status)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Exit ==================== */
static inline long sys_exit(int status) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_exit), "r"((long)status)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Mmap ==================== */
static inline long sys_mmap(void *addr, unsigned long length, int prot, int flags, int fd, long offset) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "movq %5, %%r10\n\t"
        "movq %6, %%r8\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_mmap), "r"(addr), "r"(length), "r"((long)prot), "r"((long)flags), "r"((long)fd), "r"(offset)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Getpid ==================== */
static inline long sys_getpid(void) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_getpid)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Socket ==================== */
static inline long sys_socket(int domain, int type, int protocol) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_socket), "r"((long)domain), "r"((long)type), "r"((long)protocol)
        : "rcx", "r11", "memory"
    );
    return ret;
}

/* ==================== Connect ==================== */
static inline long sys_connect(int sockfd, void *addr, int addrlen) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "movq %2, %%rdi\n\t"
        "movq %3, %%rsi\n\t"
        "movq %4, %%rdx\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "i"(SYS_connect), "r"((long)sockfd), "r"(addr), "r"((long)addrlen)
        : "rcx", "r11", "memory"
    );
    return ret;
}

#endif /* _SYSCALL_H */
