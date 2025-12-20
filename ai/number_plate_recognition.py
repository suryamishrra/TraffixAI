"""
Number Plate Recognition Module

Detects and extracts text from vehicle number plates using EasyOCR
and contour-based plate detection.

Usage:
    recognizer = NumberPlateRecognizer()
    vehicle_number = recognizer.process_image(image)
"""

import re
import cv2
import numpy as np
import easyocr


class NumberPlateRecognizer:
    """
    Detects and extracts vehicle number plate text from images.
    """

    def __init__(self):
        """Initialize the OCR reader for English text extraction."""
        self.reader = easyocr.Reader(['en'])

    def process_image(self, image: np.ndarray) -> str:
        """
        Process image to detect and extract number plate text.

        Args:
            image: Image as numpy array (BGR format from OpenCV)

        Returns:
            Extracted and cleaned vehicle number as string, or empty string if not found
        """
        plate_region = self.detect_number_plate(image)

        if plate_region is None:
            return ""

        extracted_text = self.extract_text(plate_region)
        cleaned_text = self.clean_text(extracted_text)

        return cleaned_text

    def detect_number_plate(self, image: np.ndarray) -> np.ndarray:
        """
        Detect number plate region in image using contour analysis.

        Args:
            image: Image as numpy array (BGR format)

        Returns:
            Cropped region containing number plate, or None if not found
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        edges = cv2.Canny(blurred, 50, 200)

        contours, _ = cv2.findContours(
            edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
        )

        height, width = image.shape[:2]
        min_plate_area = (width * height) * 0.01
        max_plate_area = (width * height) * 0.4

        for contour in contours:
            area = cv2.contourArea(contour)

            if area < min_plate_area or area > max_plate_area:
                continue

            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / h if h != 0 else 0

            if 2.0 <= aspect_ratio <= 5.5:
                return image[y : y + h, x : x + w]

        return None

    def extract_text(self, image_region: np.ndarray) -> str:
        """
        Extract text from number plate region using OCR.

        Args:
            image_region: Cropped image containing number plate

        Returns:
            Extracted text from OCR
        """
        results = self.reader.readtext(image_region)

        extracted_text = ""
        for result in results:
            text = result[1]
            confidence = result[2]

            if confidence > 0.3:
                extracted_text += text + " "

        return extracted_text.strip()

    def clean_text(self, text: str) -> str:
        """
        Clean and format extracted text for vehicle number.

        Args:
            text: Raw extracted text from OCR

        Returns:
            Cleaned vehicle number in uppercase
        """
        text = text.upper()
        text = text.replace(" ", "")
        text = text.replace("-", "")
        text = re.sub(r"[^A-Z0-9]", "", text)
        text = text.strip()

        return text
