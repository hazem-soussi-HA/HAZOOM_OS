#include "libc.h"

void *memcpy(void *dest, const void *src, size_t n) {
    char *d = dest;
    const char *s = src;
    while (n--) *d++ = *s++;
    return dest;
}

void *memset(void *s, int c, size_t n) {
    char *p = s;
    while (n--) *p++ = c;
    return s;
}

size_t strlen(const char *s) {
    size_t len = 0;
    while (*s++) len++;
    return len;
}

char *strcpy(char *dest, const char *src) {
    char *d = dest;
    while ((*d++ = *src++));
    return dest;
}

int strcmp(const char *s1, const char *s2) {
    while (*s1 && *s1 == *s2) s1++, s2++;
    return *(unsigned char *)s1 - *(unsigned char *)s2;
}

int atoi(const char *s) {
    int n = 0;
    int sign = 1;
    if (*s == '-') sign = -1, s++;
    while (*s >= '0' && *s <= '9') n = n * 10 + *s++ - '0';
    return sign * n;
}