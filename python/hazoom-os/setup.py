"""
Hazoom OS - Setup Script
Package setup and installation
"""

from setuptools import setup, find_packages
from pathlib import Path

# Read requirements
requirements_path = Path(__file__).parent / "requirements.txt"
if requirements_path.exists():
    with open(requirements_path, 'r') as f:
        requirements = [line.strip() for line in f if line.strip() and not line.startswith('#')]
else:
    requirements = []

# Read README
readme_path = Path(__file__).parent / "README.md"
if readme_path.exists():
    with open(readme_path, 'r', encoding='utf-8') as f:
        long_description = f.read()
else:
    long_description = "Hazoom OS - AGI-Powered LLM Training & Verification System"

setup(
    name="hazoom-os",
    version="1.0.0",
    description="AGI-Powered LLM Training & Verification System",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Hazoom OS Team",
    author_email="contact@hazoom.com",
    url="https://github.com/hazem-soussi-HA/hazoom-os",
    packages=find_packages(),
    install_requires=requirements,
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: Science/Research",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: Machine Learning",
        "Topic :: Artificial Intelligence",
        "Topic :: Software Development :: Libraries :: Python Modules",
    ],
    keywords="llm machine-learning ai agi training verification transformers",
    entry_points={
        "console_scripts": [
            "hazoom=hazoom.hazoom:cli",
        ],
    },
    project_urls={
        "Documentation": "https://github.com/hazem-soussi-HA/hazoom-os/blob/main/docs/README.md",
        "Source": "https://github.com/hazem-soussi-HA/hazoom-os",
        "Tracker": "https://github.com/hazem-soussi-HA/hazoom-os/issues",
    },
)