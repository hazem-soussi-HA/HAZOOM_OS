"""
RAG (Retrieval-Augmented Generation) service module.
Handles document indexing and retrieval for enhanced AI responses.
"""
import os
from typing import List, Optional, Dict, Any
from app.core.config import settings

# Conditional imports for RAG system
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    print("sentence-transformers not available - RAG disabled")

try:
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    print("chromadb not available - RAG disabled")

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("langchain not available - RAG disabled")


class RAGService:
    """Service for RAG functionality with lazy initialization."""

    def __init__(self):
        self.embedding_model = None
        self.chroma_client = None
        self.collection = None
        self.initialized = False

    def initialize(self) -> bool:
        """Lazy initialization of RAG components."""
        if self.initialized:
            return True

        if not settings.RAG_ENABLED:
            print("RAG system disabled")
            return False

        if not all([SENTENCE_TRANSFORMERS_AVAILABLE, CHROMADB_AVAILABLE, LANGCHAIN_AVAILABLE]):
            print("RAG dependencies not available")
            return False

        try:
            # Initialize embedding model
            self.embedding_model = SentenceTransformer(settings.RAG_MODEL_NAME)

            # Initialize ChromaDB client
            self.chroma_client = chromadb.HttpClient(
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT
            )

            # Get or create collection
            try:
                self.collection = self.chroma_client.get_collection(settings.RAG_COLLECTION_NAME)
            except:
                self.collection = self.chroma_client.create_collection(settings.RAG_COLLECTION_NAME)

            self.initialized = True
            print(f"RAG initialized successfully with collection: {settings.RAG_COLLECTION_NAME}")
            return True

        except Exception as e:
            print(f"Failed to initialize RAG: {str(e)}")
            return False

    def add_document(self, file_path: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Add a document to the RAG system."""
        if not self.initialize():
            return False

        try:
            # Split text into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                length_function=len
            )
            chunks = text_splitter.split_text(content)

            # Generate embeddings
            embeddings = self.embedding_model.encode(chunks).tolist()

            # Create IDs and metadata
            ids = [f"{file_path}_{i}" for i in range(len(chunks))]
            metadatas = [{"source": file_path, "chunk_index": i, **(metadata or {})} for i in range(len(chunks))]

            # Add to collection
            self.collection.add(
                embeddings=embeddings,
                documents=chunks,
                metadatas=metadatas,
                ids=ids
            )

            print(f"Added {len(chunks)} chunks from {file_path} to RAG")
            return True

        except Exception as e:
            print(f"Failed to add document to RAG: {str(e)}")
            return False

    def query(self, query: str, top_k: Optional[int] = None) -> List[Dict[str, Any]]:
        """Query the RAG system for relevant documents."""
        if not self.initialize():
            return []

        try:
            top_k = top_k or settings.RAG_TOP_K
            query_embedding = self.embedding_model.encode([query]).tolist()[0]

            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=['documents', 'metadatas', 'distances']
            )

            # Filter by score threshold and format results
            filtered_results = []
            for i, (doc, metadata, distance) in enumerate(zip(
                results['documents'][0],
                results['metadatas'][0],
                results['distances'][0]
            )):
                score = 1 - distance  # Convert distance to similarity score
                if score >= settings.RAG_SCORE_THRESHOLD:
                    filtered_results.append({
                        "content": doc,
                        "metadata": metadata,
                        "score": score,
                        "source": metadata.get("source", "unknown")
                    })

            return filtered_results

        except Exception as e:
            print(f"Failed to query RAG: {str(e)}")
            return []

    def load_educational_datasets(self) -> None:
        """Load educational datasets into RAG on startup."""
        if not settings.RAG_ENABLED:
            return

        data_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'data')
        if not os.path.exists(data_dir):
            print("Data directory not found, skipping educational dataset loading")
            return

        import glob
        pattern = os.path.join(data_dir, '**', '*.txt')
        txt_files = glob.glob(pattern, recursive=True)

        if not txt_files:
            print("No educational datasets found")
            return

        print(f"Loading {len(txt_files)} educational datasets...")

        for file_path in txt_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                relative_path = os.path.relpath(file_path, data_dir)
                subject = relative_path.split(os.sep)[0]

                metadata = {
                    "subject": subject,
                    "file_type": "educational_content",
                    "source_type": "text_file",
                    "topic": os.path.splitext(os.path.basename(file_path))[0].replace('_', ' ')
                }

                self.add_document(file_path, content, metadata)
                print(f"OK: Loaded {os.path.basename(file_path)}")

            except Exception as e:
                print(f"ERROR: Error loading {file_path}: {str(e)}")

        print("Educational datasets loaded successfully!")


# Global RAG service instance
rag_service = RAGService()