import os
import cv2
import numpy as np
import pickle
import pyttsx3
from insightface.app import FaceAnalysis

# ================= CONFIG =================
# Resolve paths relative to the project root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATASET_DIR = os.path.join(DATA_DIR, "dataset") 
OUTPUT_FILE = os.path.join(DATA_DIR, "face_encodings_arcface.pkl")

def speak(text: str):
    try:
        engine = pyttsx3.init()
        engine.setProperty("rate", 150)
        
        # Configure a clear, beautiful female voice (Zira) if available
        voices = engine.getProperty("voices")
        for voice in voices:
            if "zira" in voice.name.lower():
                engine.setProperty("voice", voice.id)
                break
                
        engine.say(text)
        engine.runAndWait()
    except Exception as e:
        print(f"[VOICE ERROR] Failed to speak: {e}")

def run_training() -> bool:
    speak("Training is started.")
    print("\n" + "=" * 60)
    print("   ARCFACE HIGH-ACCURACY TRAINING SYSTEM")
    print("=" * 60)

    # 1. Initialize ArcFace Model (The "Brain")
    print("[INFO] Initializing ArcFace model (this might take a moment)...")
    try:
        app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        app.prepare(ctx_id=0, det_size=(640, 640))
        print("[INFO] Model Loaded Successfully")
    except Exception as e:
        print(f"[ERROR] Failed to load ArcFace model: {e}")
        return False

    # ===========================
    # DATA STORAGE LISTS
    # ===========================
    known_face_encodings = []        # Stores 512-D face vectors
    known_face_names = []            # Stores student names
    known_face_rolls = []             # Stores student roll numbers

    # 2. Check Dataset
    if not os.path.exists(DATASET_DIR):
        print(f"[ERROR] Dataset folder not found: {DATASET_DIR}")
        return False
        
    students = [s for s in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, s))]
    print(f"\n[INFO] Found {len(students)} students to train")

    if len(students) == 0:
        print("[ERROR] No student folders found in dataset")
        return False

    # 3. Start Training
    for student in students:
        student_path = os.path.join(DATASET_DIR, student)

        # -------- Parse folder name: Name_RollNo --------
        if "_" in student:
            parts = student.split("_", 1)
            name = parts[0]
            roll_no = parts[1]
        else:
            name = student
            roll_no = "000"

        print(f"\n[PROCESSING] Student: {name} (Roll: {roll_no})")

        # Get all image files in student folder
        images = [img for img in os.listdir(student_path) if img.lower().endswith((".jpg", ".jpeg", ".png"))]

        for image_name in images:
            image_path = os.path.join(student_path, image_name)
            
            img = cv2.imread(image_path)   
            if img is None:
                print(f"  [WARNING] Could not read image: {image_name}")
                continue

            # -------- ARCFACE DETECTION --------
            try:
                faces = app.get(img)
            except Exception as e:
                print(f"  [WARNING] ArcFace detection failed on {image_name}: {e}")
                continue

            if len(faces) == 0:    # If no face found → skip image
                print(f"  [SKIP] No face detected in {image_name}")
                continue
            
            # Take the largest face found in the image
            faces = sorted(faces, key=lambda x: (x.bbox[2]-x.bbox[0]) * (x.bbox[3]-x.bbox[1]), reverse=True)
            
            # Get the 512-dimensional embedding
            embedding = faces[0].embedding
            
            # Normalize the embedding (Critical for Cosine Similarity)
            embedding = embedding / np.linalg.norm(embedding)

            known_face_encodings.append(embedding)
            known_face_names.append(name)
            known_face_rolls.append(roll_no)
            print(f"  [OK] Encoded {image_name}")

    # 4. Save to Pickle
    if len(known_face_encodings) == 0:
        print("\n[ERROR] No faces were successfully encoded. Check your images.")
        return False

    data = {
        "encodings": known_face_encodings,
        "names": known_face_names,
        "roll_nos": known_face_rolls
    }

    try:
        with open(OUTPUT_FILE, "wb") as f:
            pickle.dump(data, f)
    except Exception as e:
        print(f"[ERROR] Failed to save pickle file: {e}")
        return False

    print("\n" + "=" * 60)
    print("[SUCCESS] TRAINING COMPLETE")
    print(f"[SAVED] {OUTPUT_FILE}")
    print(f"[INFO] Total Faces Encoded: {len(known_face_encodings)}")
    print(f"[INFO] Embedding Dimension: {len(known_face_encodings[0])} (Should be 512)")
    print("=" * 60)
    speak("Training is successfully completed.")
    return True

if __name__ == "__main__":
    run_training()