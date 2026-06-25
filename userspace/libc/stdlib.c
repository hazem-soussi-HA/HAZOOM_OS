/*
 * HAZOOM OS v6.0 - Minimal C Standard Library
 * userspace/libc/stdlib.c
 */

#include "syscall.h"

/* ==================== Memory Functions ==================== */

void *memset(void *dest, int val, unsigned long count) {
    unsigned char *d = (unsigned char *)dest;
    unsigned char v = (unsigned char)val;
    while (count--) {
        *d++ = v;
    }
    return dest;
}

void *memcpy(void *dest, const void *src, unsigned long count) {
    unsigned char *d = (unsigned char *)dest;
    const unsigned char *s = (const unsigned char *)src;
    while (count--) {
        *d++ = *s++;
    }
    return dest;
}

void *memmove(void *dest, const void *src, unsigned long count) {
    unsigned char *d = (unsigned char *)dest;
    const unsigned char *s = (const unsigned char *)src;
    if (d < s) {
        while (count--) {
            *d++ = *s++;
        }
    } else if (d > s) {
        d += count;
        s += count;
        while (count--) {
            *--d = *--s;
        }
    }
    return dest;
}

int memcmp(const void *s1, const void *s2, unsigned long count) {
    const unsigned char *p1 = (const unsigned char *)s1;
    const unsigned char *p2 = (const unsigned char *)s2;
    while (count--) {
        if (*p1 != *p2) {
            return (int)*p1 - (int)*p2;
        }
        p1++;
        p2++;
    }
    return 0;
}

/* ==================== String Functions ==================== */

unsigned long strlen(const char *s) {
    unsigned long len = 0;
    while (s[len]) len++;
    return len;
}

char *strcpy(char *dest, const char *src) {
    char *d = dest;
    while ((*d++ = *src++));
    return dest;
}

char *strncpy(char *dest, const char *src, unsigned long n) {
    unsigned long i;
    for (i = 0; i < n && src[i]; i++) {
        dest[i] = src[i];
    }
    for (; i < n; i++) {
        dest[i] = '\0';
    }
    return dest;
}

int strcmp(const char *s1, const char *s2) {
    while (*s1 && (*s1 == *s2)) {
        s1++;
        s2++;
    }
    return (unsigned char)*s1 - (unsigned char)*s2;
}

int strncmp(const char *s1, const char *s2, unsigned long n) {
    if (n == 0) return 0;
    while (n > 1 && *s1 && (*s1 == *s2)) {
        s1++;
        s2++;
        n--;
    }
    return (unsigned char)*s1 - (unsigned char)*s2;
}

/* ==================== Conversion Functions ==================== */

int atoi(const char *s) {
    int result = 0;
    int sign = 1;

    /* Skip whitespace */
    while (*s == ' ' || *s == '\t' || *s == '\n') s++;

    /* Handle sign */
    if (*s == '-') {
        sign = -1;
        s++;
    } else if (*s == '+') {
        s++;
    }

    /* Convert digits */
    while (*s >= '0' && *s <= '9') {
        result = result * 10 + (*s - '0');
        s++;
    }

    return result * sign;
}

char *itoa(int value, char *str, int base) {
    char *ptr = str;
    char *ptr1 = str;
    char tmp;
    int tmpval;
    int divisor = 1;

    /* Handle base validation */
    if (base < 2 || base > 36) {
        *str = '\0';
        return str;
    }

    /* Handle negative for base 10 */
    int negative = 0;
    if (value < 0 && base == 10) {
        negative = 1;
        value = -value;
    }

    /* Find the highest power of base <= value */
    int v = value;
    while (v / base > 0) {
        divisor *= base;
        v /= base;
    }

    /* Convert digits */
    while (divisor > 0) {
        tmpval = value / divisor;
        *ptr++ = (tmpval < 10) ? ('0' + tmpval) : ('a' + tmpval - 10);
        value %= divisor;
        divisor /= base;
    }

    /* Add negative sign */
    if (negative) {
        *ptr++ = '-';
    }

    /* Null terminate */
    *ptr = '\0';
    ptr--;

    /* Reverse the string */
    while (ptr1 < ptr) {
        tmp = *ptr;
        *ptr-- = *ptr1;
        *ptr1++ = tmp;
    }

    return str;
}

/* ==================== Heap / Allocator ==================== */

/* Bump allocator state */
static char *heap_start = 0;
static char *heap_end = 0;
static char *heap_ptr = 0;

/* syscall_brk: syscall number 12 on Linux x86_64 */
static long syscall_brk(unsigned long addr) {
    long ret;
    __asm__ volatile (
        "movq %1, %%rax\n\t"
        "syscall\n\t"
        : "=a"(ret)
        : "r"(addr), "a"(12)
        : "rcx", "r11", "memory"
    );
    return ret;
}

void *malloc(unsigned long size) {
    /* Initialize heap on first call */
    if (heap_ptr == 0) {
        heap_start = (char *)syscall_brk(0);
        heap_ptr = heap_start;
        heap_end = heap_start;
    }

    /* Align size to 16 bytes */
    size = (size + 15) & ~15;

    /* Check if we need to expand the heap */
    if (heap_ptr + size > heap_end) {
        unsigned long new_heap_end = (unsigned long)(heap_ptr + size);
        long ret = syscall_brk(new_heap_end);
        if (ret < 0 || (unsigned long)ret < new_heap_end) {
            return 0; /* Out of memory */
        }
        heap_end = (char *)new_heap_end;
    }

    void *ptr = heap_ptr;
    heap_ptr += size;
    return ptr;
}

void free(void *ptr) {
    /* No-op for bump allocator */
    (void)ptr;
}

/* ==================== Process Control ==================== */

void exit(int status) {
    syscall_exit(status);
    __builtin_unreachable();
}
