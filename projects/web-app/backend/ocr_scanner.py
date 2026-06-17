"""
Hazoom OCR Scanner Module
Advanced OCR functionality for scanning educational materials
"""

import os
import sys
import json
import base64
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime
import asyncio

try:
    import pytesseract
    from PIL import Image
    import cv2
    import numpy as np
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("OCR libraries not available. Install with: pip install pytesseract pillow opencv-python numpy")

@dataclass
class OCRResult:
    """Result of OCR processing"""
    text: str
    confidence: float
    language: str
    bounding_boxes: List[Dict[str, Any]]
    processed_at: str
    image_metadata: Dict[str, Any]

@dataclass
class ProcessedDocument:
    """Processed educational document"""
    id: str
    title: str
    content: str
    ocr_result: OCRResult
    document_type: str  # "homework", "test", "notes", "book_page"
    subject: str
    grade_level: str
    extracted_questions: List[str]
    key_concepts: List[str]
    created_at: str

class OCRScanner:
    """Advanced OCR scanner for educational materials"""

    def __init__(self):
        self.supported_languages = ['eng', 'fra', 'deu', 'spa', 'ita']
        self.document_types = {
            "homework": ["devoir", "homework", "assignment", "exercice"],
            "test": ["test", "exam", "examen", "évaluation", "quiz"],
            "notes": ["notes", "cours", "lesson", "leçon"],
            "book_page": ["page", "livre", "book", "chapter"]
        }

        # Educational keywords for content analysis
        self.subject_keywords = {
            "mathematics": ["math", "algebra", "geometry", "calculus", "equation", "function"],
            "physics": ["physics", "force", "energy", "motion", "gravity", "quantum"],
            "chemistry": ["chemistry", "reaction", "molecule", "atom", "compound"],
            "biology": ["biology", "cell", "organism", "evolution", "genetics"],
            "history": ["history", "civilization", "war", "revolution", "empire"],
            "geography": ["geography", "continent", "country", "climate", "population"],
            "literature": ["literature", "novel", "poem", "author", "character"],
            "philosophy": ["philosophy", "ethics", "metaphysics", "epistemology"]
        }

    async def process_image(self, image_data: str, language: str = 'eng',
                          document_type: str = 'auto') -> ProcessedDocument:
        """
        Process an image through OCR and educational content analysis

        Args:
            image_data: Base64 encoded image data
            language: Language code for OCR
            document_type: Type of document ('auto' for detection)
        """

        if not OCR_AVAILABLE:
            raise Exception("OCR libraries not available. Please install required packages.")

        # Decode image
        image_bytes = base64.b64decode(image_data.split(',')[1] if ',' in image_data else image_data)
        image = Image.open(io.BytesIO(image_bytes))

        # Perform OCR
        ocr_result = await self._perform_ocr(image, language)

        # Analyze content
        content_analysis = await self._analyze_content(ocr_result.text)

        # Detect document type if auto
        if document_type == 'auto':
            document_type = self._detect_document_type(ocr_result.text)

        # Extract educational elements
        extracted_questions = self._extract_questions(ocr_result.text)
        key_concepts = self._extract_key_concepts(ocr_result.text, content_analysis['subject'])

        # Generate title
        title = self._generate_title(ocr_result.text, document_type, content_analysis['subject'])

        document = ProcessedDocument(
            id=f"doc_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            title=title,
            content=ocr_result.text,
            ocr_result=ocr_result,
            document_type=document_type,
            subject=content_analysis['subject'],
            grade_level=content_analysis['grade_level'],
            extracted_questions=extracted_questions,
            key_concepts=key_concepts,
            created_at=datetime.now().isoformat()
        )

        return document

    async def _perform_ocr(self, image: Image.Image, language: str) -> OCRResult:
        """Perform OCR on the image"""

        # Preprocess image for better OCR results
        processed_image = self._preprocess_image(image)

        # Get OCR data with bounding boxes
        ocr_data = pytesseract.image_to_data(
            processed_image,
            lang=language,
            output_type=pytesseract.Output.DICT
        )

        # Extract text
        text = pytesseract.image_to_string(processed_image, lang=language)

        # Calculate confidence
        confidences = [int(conf) for conf in ocr_data['conf'] if conf != '-1']
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        # Extract bounding boxes
        bounding_boxes = []
        for i in range(len(ocr_data['text'])):
            if ocr_data['text'][i].strip():
                bounding_boxes.append({
                    'text': ocr_data['text'][i],
                    'x': ocr_data['left'][i],
                    'y': ocr_data['top'][i],
                    'width': ocr_data['width'][i],
                    'height': ocr_data['height'][i],
                    'confidence': ocr_data['conf'][i]
                })

        return OCRResult(
            text=text,
            confidence=avg_confidence,
            language=language,
            bounding_boxes=bounding_boxes,
            processed_at=datetime.now().isoformat(),
            image_metadata={
                'width': image.width,
                'height': image.height,
                'format': image.format
            }
        )

    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """Preprocess image for better OCR results"""
        # Convert to OpenCV format
        opencv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        # Convert to grayscale
        gray = cv2.cvtColor(opencv_image, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Apply threshold to get binary image
        _, threshold = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Convert back to PIL Image
        processed_image = Image.fromarray(threshold)

        return processed_image

    async def _analyze_content(self, text: str) -> Dict[str, Any]:
        """Analyze the content to determine subject and grade level"""

        text_lower = text.lower()

        # Detect subject
        subject_scores = {}
        for subject, keywords in self.subject_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            if score > 0:
                subject_scores[subject] = score

        detected_subject = max(subject_scores.keys(), key=lambda k: subject_scores[k]) if subject_scores else "general"

        # Estimate grade level based on complexity
        grade_level = self._estimate_grade_level(text)

        return {
            'subject': detected_subject,
            'grade_level': grade_level,
            'complexity_score': len(text.split()) / 100,  # Rough complexity metric
            'subject_confidence': max(subject_scores.values()) if subject_scores else 0
        }

    def _detect_document_type(self, text: str) -> str:
        """Detect the type of document from its content"""

        text_lower = text.lower()

        for doc_type, keywords in self.document_types.items():
            if any(keyword in text_lower for keyword in keywords):
                return doc_type

        return "notes"  # Default fallback

    def _extract_questions(self, text: str) -> List[str]:
        """Extract questions from the text"""

        lines = text.split('\n')
        questions = []

        question_indicators = ['?', 'question', 'q:', 'exercice', 'exercise', 'problem']

        for line in lines:
            line = line.strip()
            if not line:
                continue

            # Check for question marks or question indicators
            if any(indicator in line.lower() for indicator in question_indicators):
                # Clean up the question
                if line.endswith('?') or len(line) > 20:
                    questions.append(line)

        return questions[:10]  # Limit to 10 questions

    def _extract_key_concepts(self, text: str, subject: str) -> List[str]:
        """Extract key concepts from the text"""

        # Get subject-specific keywords
        subject_keywords = self.subject_keywords.get(subject, [])

        words = text.lower().split()
        concepts = []

        # Look for important terms
        for keyword in subject_keywords:
            if keyword in words:
                concepts.append(keyword.title())

        # Also extract capitalized words that might be concepts
        for word in words:
            if len(word) > 4 and word[0].isupper() and word not in ['The', 'And', 'But', 'For', 'Are', 'With']:
                concepts.append(word)

        return list(set(concepts))[:15]  # Return unique concepts, limit to 15

    def _estimate_grade_level(self, text: str) -> str:
        """Estimate the grade level of the content"""

        words = text.split()
        avg_word_length = sum(len(word) for word in words) / len(words) if words else 0

        # Simple heuristic based on word complexity and length
        if avg_word_length > 6 or len(words) > 500:
            return "high_school"
        elif avg_word_length > 5 or len(words) > 200:
            return "middle_school"
        else:
            return "elementary"

    def _generate_title(self, text: str, doc_type: str, subject: str) -> str:
        """Generate a title for the document"""

        # Try to extract title from first few lines
        lines = [line.strip() for line in text.split('\n') if line.strip()][:3]

        for line in lines:
            if len(line) > 10 and len(line) < 100:
                return line

        # Fallback title generation
        subject_title = subject.replace('_', ' ').title()
        type_title = doc_type.replace('_', ' ').title()

        return f"{subject_title} {type_title}"

    async def process_batch(self, images: List[str], language: str = 'eng') -> List[ProcessedDocument]:
        """Process multiple images in batch"""

        tasks = [self.process_image(img, language) for img in images]
        results = await asyncio.gather(*tasks)
        return results

    def save_document(self, document: ProcessedDocument, filename: Optional[str] = None) -> str:
        """Save processed document to JSON file"""

        if not filename:
            filename = f"document_{document.id}.json"

        doc_data = {
            'id': document.id,
            'title': document.title,
            'content': document.content,
            'document_type': document.document_type,
            'subject': document.subject,
            'grade_level': document.grade_level,
            'extracted_questions': document.extracted_questions,
            'key_concepts': document.key_concepts,
            'created_at': document.created_at,
            'ocr_result': {
                'text': document.ocr_result.text,
                'confidence': document.ocr_result.confidence,
                'language': document.ocr_result.language,
                'processed_at': document.ocr_result.processed_at,
                'image_metadata': document.ocr_result.image_metadata
            }
        }

        filepath = os.path.join(os.path.dirname(__file__), "documents", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(doc_data, f, indent=2, ensure_ascii=False)

        return filepath

# Global OCR scanner instance
ocr_scanner = OCRScanner()

# Example usage
if __name__ == "__main__":
    import io

    async def test_ocr():
        print("OCR Scanner initialized")

        # Test with a simple text image (would need actual image data in real usage)
        print("OCR functionality ready for image processing")
        print("Supported languages:", ocr_scanner.supported_languages)
        print("Document types:", list(ocr_scanner.document_types.keys()))

    if OCR_AVAILABLE:
        asyncio.run(test_ocr())
    else:
        print("OCR libraries not available. Please install pytesseract, pillow, opencv-python, and numpy")