from setuptools import setup, find_packages

setup(
    name="mario-gta6",
    version="1.0.0",
    description="Super Mario GTA6 — A unified 2D platformer with open-world driving",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    author="Hazem Soussi (HA)",
    author_email="hazem.soussi@gmail.com",
    url="https://github.com/hazem-soussi-HA/mario_gta6",
    license="MIT",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Topic :: Games/Entertainment",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.10",
    install_requires=[
        "pygame>=2.6.0",
    ],
    entry_points={
        "console_scripts": [
            "mario-gta6=mario_gta6_2d:main",
        ],
    },
)
