# Build script for the low-level C entropy extension (_cbeat.so).
# Run:  python3 build_ext.py build_ext --inplace
from setuptools import setup, Extension

setup(
    name="_cbeat",
    ext_modules=[
        Extension(
            "_cbeat",
            ["entropy.c"],
            # no extra link libs needed; uses syscall/getrandom + open/read
        )
    ],
)
