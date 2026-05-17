import os
import sys
import base64
import re
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import cv2
import face_recognition
import easyocr

# Initialize FastAPI App with premium settings
app = FastAPI(
    title="⛪ Church System Biometrics & AI Core",
    description="Computer Vision microservice for face biometrics and OCR ID verification.",
    version="1.0.0"
)

# Robust CORS policy supporting localized network integrations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 💡 Global Performance Optimization: Load EasyOCR Reader into memory once on startup
print("⏳ Initializing EasyOCR English Reader Model...")
try:
    ocr_reader = easyocr.Reader(['en'], gpu=False) # Fallback to CPU by default for portability
    print("✅ EasyOCR Reader Model loaded successfully!")
except Exception as e:
    print(f"⚠️ Error loading EasyOCR reader: {e}")
    ocr_reader = None

# Models for structured biometrics request payload
class FaceMatchRequest(BaseModel):
    capturedFrameBase64: str
    activeEmbeddings: List[dict] # Mapped database embeddings: [{"memberId": "...", "embedding": [...]}]

@app.get("/")
def health_check():
    """Verify microservice connectivity and local biometrics capability."""
    try:
        import face_recognition
        import easyocr
        biometrics_available = True
    except ImportError:
        biometrics_available = False

    return {
        "status": "healthy",
        "service": "Church System AI Engine",
        "python_version": sys.version,
        "biometrics_support": biometrics_available,
        "device": "CPU"
    }

@app.post("/enroll")
async def enroll_face(file: UploadFile = File(...)):
    """
    Extracts a 128-dimensional floating point vector embedding from a member profile picture.
    """
    try:
        # Read file bytes
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

        # Convert image from BGR (OpenCV) to RGB (face_recognition)
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Detect face locations
        face_locations = face_recognition.face_locations(rgb_img)

        if not face_locations:
            raise HTTPException(status_code=400, detail="No face detected in the uploaded photo. Please ensure your face is fully visible.")
        if len(face_locations) > 1:
            raise HTTPException(status_code=400, detail="Multiple faces detected. Please upload a clear photo of only one person.")

        # Compute 128-dimensional face embedding
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)
        
        if not face_encodings:
            raise HTTPException(status_code=500, detail="Could not compute face encodings. Try another picture.")

        # Convert face encoding (numpy array of 128 floats) to standard list
        embedding_list = face_encodings[0].tolist()

        return {
            "success": True,
            "message": "Face enrollment baseline active",
            "embedding": embedding_list
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Face Enrollment Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to enroll face profile: {str(e)}")

@app.post("/recognize")
async def recognize_face(payload: FaceMatchRequest):
    """
    Performs vector comparison against active database embeddings to register attendance.
    """
    try:
        if not payload.activeEmbeddings:
            return {
                "success": True,
                "matched": False,
                "message": "No active biometrics templates registered in the church database."
            }

        # 1. Decode captured camera frame Base64
        base64_data = payload.capturedFrameBase64.split(",")[-1]
        img_bytes = base64.b64decode(base64_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Captured frame is invalid.")

        # Convert BGR to RGB
        rgb_img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Detect face locations and encodings
        face_locations = face_recognition.face_locations(rgb_img)
        face_encodings = face_recognition.face_encodings(rgb_img, face_locations)

        if not face_encodings:
            return {
                "success": True,
                "matched": False,
                "message": "No face detected in camera viewport."
            }

        camera_encoding = face_encodings[0]

        # 2. Extract database encodings and map to memberIds
        known_encodings = []
        known_member_ids = []

        for item in payload.activeEmbeddings:
            # Parse embedding (which is stored as JSON array string or floats list in DB)
            try:
                emb = item["embedding"]
                if isinstance(emb, str):
                    import json
                    emb = json.loads(emb)
                
                known_encodings.append(np.array(emb, dtype=np.float64))
                known_member_ids.append(item["memberId"])
            except Exception as ex:
                print(f"Error parsing database embedding for member {item.get('memberId')}: {ex}")
                continue

        if not known_encodings:
            return {
                "success": True,
                "matched": False,
                "message": "Active database biometrics templates are corrupted."
            }

        # 3. Perform Euclidean Vector Comparison using face_distance
        face_distances = face_recognition.face_distance(known_encodings, camera_encoding)
        
        # Standard strict Euclidean threshold is 0.6 (lower means better match)
        min_distance_idx = np.argmin(face_distances)
        min_distance = face_distances[min_distance_idx]

        threshold = 0.6
        if min_distance <= threshold:
            matched_member_id = known_member_ids[min_distance_idx]
            # Convert distance to confidence percentage (0.0 distance = 100% confidence)
            confidence = float((1.0 - min_distance) * 100)
            
            return {
                "success": True,
                "matched": True,
                "memberId": matched_member_id,
                "confidence": confidence,
                "distance": float(min_distance)
            }
        else:
            return {
                "success": True,
                "matched": False,
                "message": f"Face matches did not meet similarity thresholds (Min Distance: {min_distance:.4f})."
            }

    except Exception as e:
        print(f"Biometric Match Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to match facial templates: {str(e)}")

@app.post("/scan-id")
async def scan_id(file: UploadFile = File(...)):
    """
    Uses EasyOCR to scan and extract Public ID card details from a photo.
    """
    if ocr_reader is None:
        raise HTTPException(status_code=500, detail="EasyOCR model is not loaded.")

    try:
        # Read file bytes
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

        # 1. Run EasyOCR on image
        # ocr_reader.readtext returns list of: (bbox, text, confidence)
        results = ocr_reader.readtext(img)

        extracted_texts = []
        public_id = None

        # 2. Extract and cleanse text
        for (_, text, _) in results:
            clean_text = text.strip()
            extracted_texts.append(clean_text)

            # Look for Public ID pattern: M1302 followed by numbers
            # Cleansing typical OCR misread: Replace O or o with 0, I or l with 1 in numeric part
            match = re.search(r'M\s*1\s*3\s*0\s*2\s*([A-Za-z0-9]+)', clean_text, re.IGNORECASE)
            if match:
                raw_nums = match.group(1)
                # Cleansing
                cleansed_nums = raw_nums.replace('O', '0').replace('o', '0').replace('I', '1').replace('l', '1').replace('i', '1')
                public_id = f"M1302{cleansed_nums}"

        # 3. If regular match didn't catch, check for general M-prefix numbers
        if not public_id:
            for text in extracted_texts:
                match = re.search(r'M\s*(\d{5,9})', text, re.IGNORECASE)
                if match:
                    public_id = f"M{match.group(1)}"
                    break

        return {
            "success": True,
            "publicId": public_id,
            "extracted_text": extracted_texts
        }

    except Exception as e:
        print(f"OCR Scan Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to scan ID card text: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
