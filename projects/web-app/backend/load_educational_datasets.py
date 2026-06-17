#!/usr/bin/env python3
"""
Hazoom Educational Dataset Loader

This script automatically loads educational content from the data directory
into the RAG (Retrieval-Augmented Generation) system for enhanced AI responses.
"""

import os
import sys
import glob
from pathlib import Path

# Add the current directory to the path so we can import backend modules
sys.path.append(os.path.dirname(__file__))

from main import add_document_to_rag, initialize_rag

def load_educational_datasets():
    """Load all educational datasets from the data directory into RAG"""

    # Initialize RAG system
    print("Initializing RAG system...")
    initialize_rag()

    # Get the data directory path
    data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')

    if not os.path.exists(data_dir):
        print(f"Data directory not found: {data_dir}")
        return

    # Find all text files in the data directory
    pattern = os.path.join(data_dir, '**', '*.txt')
    txt_files = glob.glob(pattern, recursive=True)

    if not txt_files:
        print("No text files found in data directory")
        return

    print(f"Found {len(txt_files)} educational dataset files")

    # Load each file into RAG
    for file_path in txt_files:
        try:
            print(f"Loading: {file_path}")

            # Read the file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Extract subject from path
            relative_path = os.path.relpath(file_path, data_dir)
            subject = relative_path.split(os.sep)[0]  # First directory level

            # Create metadata
            metadata = {
                "subject": subject,
                "file_type": "educational_content",
                "source_type": "text_file",
                "topic": os.path.splitext(os.path.basename(file_path))[0].replace('_', ' ')
            }

            # Add to RAG system
            add_document_to_rag(file_path, content, metadata)

            print(f"✓ Successfully loaded {os.path.basename(file_path)} ({subject})")

        except Exception as e:
            print(f"✗ Error loading {file_path}: {str(e)}")

    print(f"\nCompleted loading {len(txt_files)} educational datasets into RAG system")
    print("The AI can now provide enhanced educational responses!")

def main():
    """Main function"""
    print("🐾 Hazoom Educational Dataset Loader")
    print("=" * 50)

    try:
        load_educational_datasets()
        print("\n🎉 Educational datasets successfully integrated!")
        print("Your super intelligent master teacher is now ready with comprehensive knowledge.")

    except Exception as e:
        print(f"\n❌ Error during dataset loading: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()