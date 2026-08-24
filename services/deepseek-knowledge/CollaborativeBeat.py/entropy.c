/*
 * entropy.c  --  CollaborativeBeat v4 low-level entropy & seed source
 *
 * Copyright (c) 2026 Hazem Soussi  <hazem.soussi@gmail.com>
 * Licensed under MIT.  All original contributions (c) Hazem Soussi.
 *
 * A minimal, dependency-free Python C-extension that exposes the
 * OS cryptographic RNG to Python. It is used to:
 *   - seed the synthesiser deterministically per-SID (no global state)
 *   - derive per-note micro-variation so the beat is never repetitive
 *   - feed the HMAC key-stretching salt
 *
 * Prefers the Linux getrandom(2) syscall; falls back to /dev/urandom.
 * Compiled to _cbeat.so and imported by collaborative_beat_v4.py.
 */
#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <sys/syscall.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <fcntl.h>

/* getrandom is available on Linux >= 3.17. We inline the syscall
 * so we do not need glibc symbol versioning. */
#ifndef SYS_getrandom
#  define SYS_getrandom 318
#endif

static ssize_t crypto_random(void *buf, size_t len) {
    unsigned char *p = (unsigned char *)buf;
    size_t got = 0;
    while (got < len) {
        /* try getrandom first */
        long r = syscall(SYS_getrandom, p + got, len - got, 0);
        if (r >= 0) {
            got += (size_t)r;
            if ((size_t)r == 0) break;
            continue;
        }
        if (errno == EINTR) continue;
        if (errno == ENOSYS) {
            /* fallback to /dev/urandom */
            int fd = open("/dev/urandom", O_RDONLY);
            if (fd < 0) return -1;
            ssize_t n = read(fd, p + got, len - got);
            close(fd);
            if (n > 0) { got += (size_t)n; continue; }
            if (n == 0) break;
            if (errno == EINTR) continue;
            return -1;
        }
        return -1;
    }
    return (ssize_t)got;
}

/* entropy(nbytes) -> bytes  : returns nbytes of OS cryptographic randomness */
static PyObject *py_entropy(PyObject *self, PyObject *args) {
    Py_ssize_t n = 16;
    if (!PyArg_ParseTuple(args, "|n", &n)) return NULL;
    if (n < 0) n = 0;
    if (n > (1024 * 1024)) n = 1024 * 1024; /* sane cap */
    char *buf = (char *)PyMem_Malloc((size_t)n);
    if (!buf) return PyErr_NoMemory();
    if (crypto_random(buf, (size_t)n) != (ssize_t)n) {
        PyMem_Free(buf);
        PyErr_SetString(PyExc_RuntimeError, "entropy: failed to read OS RNG");
        return NULL;
    }
    PyObject *out = PyBytes_FromStringAndSize(buf, n);
    PyMem_Free(buf);
    return out;
}

/* seed_to_float32(bytes) -> double : map a 4-byte entropy sample to [0,1) */
static PyObject *py_urand(PyObject *self, PyObject *args) {
    unsigned char b[4];
    if (crypto_random(b, 4) != 4) {
        PyErr_SetString(PyExc_RuntimeError, "urand: failed to read OS RNG");
        return NULL;
    }
    uint32_t v = ((uint32_t)b[0] << 24) | ((uint32_t)b[1] << 16) |
                 ((uint32_t)b[2] << 8)  | (uint32_t)b[3];
    double d = (double)(v >> 8) / (double)(1u << 24); /* 24-bit mantissa */
    return PyFloat_FromDouble(d);
}

static PyMethodDef EntropyMethods[] = {
    {"entropy", py_entropy, METH_VARARGS,
     "entropy(nbytes=16) -> bytes  (OS cryptographic randomness)"},
    {"urand",  py_urand,  METH_NOARGS,
     "urand() -> float in [0,1) derived from OS RNG"},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef entropymodule = {
    PyModuleDef_HEAD_INIT, "_cbeat",
    "Low-level OS entropy source for CollaborativeBeat v4.", -1, EntropyMethods
};

PyMODINIT_FUNC PyInit__cbeat(void) {
    return PyModule_Create(&entropymodule);
}
