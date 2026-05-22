import onnxruntime
import cv2
import numpy as np
import pandas as pd
from datetime import datetime
import os
import pickle
import winsound
import threading
import smtplib
from email.message import EmailMessage
import pyttsx3
import queue
import time

from insightface.app import FaceAnalysis
from dotenv import load_dotenv  
import ai_analyst

load_dotenv()


# ==========================================
# THREADED CAMERA INPUT (FPS BOOSTER)
# ==========================================
class ThreadedCamera:
    def __init__(self, src=0):
        self.cap = cv2.VideoCapture(src, cv2.CAP_DSHOW)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.grabbed, self.frame = self.cap.read()
        self.started = False
        self.read_lock = threading.Lock()

    def start(self):
        if self.started:
            return self
        self.started = True
        self.thread = threading.Thread(target=self.update, args=())
        self.thread.daemon = True
        self.thread.start()
        return self

    def update(self):
        while self.started:
            grabbed, frame = self.cap.read()
            if grabbed:
                with self.read_lock:
                    self.grabbed = grabbed
                    self.frame = frame
            time.sleep(0.005)

    def read(self):
        with self.read_lock:
            frame = self.frame.copy() if self.frame is not None else None
            return self.grabbed, frame

    def release(self):
        self.started = False
        if hasattr(self, 'thread'):
            self.thread.join(timeout=1.0)
        self.cap.release()



# ==========================================
# CONFIGURATION
# ==========================================
SENDER_EMAIL = "saxhin0708@gmail.com"
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")   
TEACHER_EMAIL = "saxhin0708@gmail.com" #updates of  Attendance Of Todays 
SECURITY_EMAIL = "saxhin0708@gmail.com"   # Email to alert about intruders

class SmartAttendanceSystem:
    def __init__(self):
        self.encodings_path = "face_encodings_arcface.pkl"
        self.attendance_file = "attendance.csv"
        self.student_details_file = "students.csv"
        self.intruder_folder = "Intruders"
        
        # --- NEW: Attendance Folder & Dynamic Files ---
        self.attendance_folder = "Attendance_Logs"
        if not os.path.exists(self.attendance_folder):
            os.makedirs(self.attendance_folder)
            
        # Creates a unique file for every session like: Attendance_2026-02-18_10-30-00.csv
        self.session_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        self.attendance_file = f"{self.attendance_folder}/Attendance_{self.session_time}.csv"
        self.summary_file = f"{self.attendance_folder}/Master_Summary.csv"
        
        
        # Settings
        self.confidence_threshold = 0.6  # Higher threshold for Security
        self.intruder_threshold = 30     # Frames (approx 2 seconds) to trigger alert
        self.cooldown_timer = 0          # Prevent spamming emails
        
        # Data Structures
        self.student_db = {} 
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_roll_nos = []
        self.present_students = set() 
        
        # --- GPU INITIALIZATION ---
        print("[INFO] Initializing High-Performance Security Engine...")
        self.using_gpu = 'CUDAExecutionProvider' in onnxruntime.get_available_providers()
        
        # Using Large Model for maximum accuracy
        self.app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        self.app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Verify if GPU is actually being used by the session (check one of the models)
        try:
            actual_providers = self.app.models['detection'].session.get_providers()
            self.using_gpu = 'CUDAExecutionProvider' in actual_providers
        except:
            pass
            
        print(f"[INFO] Security Engine Loaded. GPU: {'ACTIVE' if self.using_gpu else 'INACTIVE (FALLBACK TO CPU)'}")
        self.skip_frames = 1 if self.using_gpu else 2
        
        # --- Voice Sequential Queue & Thread Setup ---
        self.speech_queue = queue.Queue()
        self.speech_worker_started = True
        self.speech_thread = threading.Thread(target=self._speech_worker, daemon=True)
        self.speech_thread.start()
        
        self.spoken_ids = set()
        
        # Load Data
        self.load_student_details()
        self.load_encodings()
        self.init_attendance_csv()
        
        # Ensure intruder folder exists
        if not os.path.exists(self.intruder_folder):
            os.makedirs(self.intruder_folder)

    def load_student_details(self):
        # 1. First, load whatever is already inside students.csv
        if os.path.exists(self.student_details_file):
            try:
                df = pd.read_csv(self.student_details_file, dtype=str)
                df.columns = [c.strip() for c in df.columns]
                for index, row in df.iterrows():
                    roll = str(row['Roll No']).strip()
                    self.student_db[roll] = {
                        'name': str(row['Name']).strip(),
                        'email': str(row['Email']).strip() if 'Email' in row else "no_email@college.edu"
                    }
            except Exception as e:
                print(f"[ERROR] Reading CSV failed: {e}")

        # 2. Now, scan the 'dataset' folder to find any MISSING students
        dataset_path = "dataset"
        new_students_data = []

        if os.path.exists(dataset_path):
            for folder_name in os.listdir(dataset_path):
                folder_path = os.path.join(dataset_path, folder_name)
                
                # Check if it's a folder formatted like "Name_RollNo"
                if os.path.isdir(folder_path) and '_' in folder_name:
                    try:
                        parts = folder_name.rsplit('_', 1) 
                        name = parts[0].replace('_', ' ')
                        roll = parts[1].strip()
                        
                        # If this student is in the dataset but NOT in the CSV file yet
                        if roll not in self.student_db:
                            placeholder_email = "update_email@college.edu"
                            
                            # Add to running memory
                            self.student_db[roll] = {
                                'name': name,
                                'email': placeholder_email
                            }
                            
                            # Prepare to add them to the physical CSV file
                            new_students_data.append({
                                'Roll No': roll,
                                'Name': name,
                                'Email': placeholder_email
                            })
                    except Exception as e:
                        print(f"[WARN] Could not parse folder '{folder_name}': {e}")
        
        # 3. Automatically update the students.csv file with the new people!
        if new_students_data:
            df_new = pd.DataFrame(new_students_data)
            df_new.to_csv(self.student_details_file, mode='a', header=not os.path.exists(self.student_details_file), index=False)
            print(f"[INFO] 📝 Auto-added {len(new_students_data)} missing students from 'dataset' to '{self.student_details_file}'.")
            
        print(f"[INFO] Loaded {len(self.student_db)} students total.")

    def load_encodings(self):
        if os.path.exists(self.encodings_path):
            with open(self.encodings_path, 'rb') as f:
                data = pickle.load(f)
                self.known_face_encodings = np.array(data['encodings'])
                self.known_face_names = data['names']
                self.known_roll_nos = data.get('roll_nos', [])
                
                # Pre-normalize known encodings for faster cosine similarity
                if len(self.known_face_encodings) > 0:
                    norms = np.linalg.norm(self.known_face_encodings, axis=1, keepdims=True)
                    self.known_face_encodings = self.known_face_encodings / norms
        else:
            print("[ERROR] Encodings missing! Run train_faces.py first.")
            exit()

    def init_attendance_csv(self):
        if not os.path.exists(self.attendance_file):
            df = pd.DataFrame(columns=['Roll No', 'Name', 'Status', 'Date', 'Time', 'Accuracy'])
            df.to_csv(self.attendance_file, index=False)

    def _speech_worker(self):
        try:
            engine = pyttsx3.init()
            engine.setProperty("rate", 150)
        except Exception as e:
            print(f"[VOICE ERROR] Failed to initialize voice worker: {e}")
            return
            
        while self.speech_worker_started:
            try:
                text = self.speech_queue.get(timeout=1.0)
                try:
                    engine.say(text)
                    engine.runAndWait()
                except Exception as ex:
                    print(f"[VOICE ERROR] TTS engine say failed: {ex}")
                finally:
                    self.speech_queue.task_done()
            except queue.Empty:
                continue

    def speak(self, text):
        self.speech_queue.put(text)

    def trigger_intruder_alert(self, frame):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{self.intruder_folder}/Intruder_{timestamp}.jpg"
        
        # 1. Save the Photo locally
        cv2.imwrite(filename, frame)
        print(f"[SECURITY] 🚨 Intruder Detected! Photo saved: {filename}")
        
        # 2. Play Alarm & Voice
        def play_alarm():
            try:
                winsound.Beep(1000, 1000) # Loud BEEP
                self.speak("Security Alert. Unauthorized person detected.")
            except: pass
        threading.Thread(target=play_alarm).start()
        
        # 3. Send Email WITH PHOTO ATTACHMENT
        def _send_email_with_photo():
            if not SENDER_PASSWORD: return
            
            formatted_time = datetime.now().strftime('%Y-%m-%d %I:%M:%S %p')
            
            msg = EmailMessage()
            msg['Subject'] = f"🛡️ [SECURITY NOTICE] Unregistered Individual Detected"
            msg['From'] = SENDER_EMAIL
            msg['To'] = SECURITY_EMAIL
            
            # --- PRO CLASSY EMAIL BODY ---
            body = (
                "SECURITY NOTIFICATION\n"
                "========================================\n\n"
                "Dear Administrator,\n\n"
                "The SmartFace AI Attendance System has detected an unregistered individual in the primary scanning area.\n\n"
                f"🕒 Date & Time: {formatted_time}\n"
                "📍 Location: Main Camera Feed\n\n"
                "For your security and administrative review, a high-resolution snapshot of the unrecognized person has been attached to this email. "
                "Please review the image to determine if security action is required, or if this is a new student who needs to be registered in the dataset.\n\n"
                "System Status: Active & Monitoring.\n\n"
                "Best regards,\n"
                "SmartFace AI Security Engine"
            )
            msg.set_content(body)

            # --- ATTACHMENT LOGIC ---
            try:
                with open(filename, 'rb') as f:
                    file_data = f.read()
                    file_name = os.path.basename(filename)
                
                # Add the image to the email
                msg.add_attachment(file_data, maintype='image', subtype='jpeg', filename=file_name)
                
                # Send
                server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[EMAIL SENT] 🛡️ Security Notice sent to Admin successfully.")
                
            except Exception as e:
                print(f"[EMAIL ERROR] Could not send photo: {e}")

        threading.Thread(target=_send_email_with_photo).start()
        
    def send_absent_email(self, roll, details):
        if not SENDER_PASSWORD: return
        msg = EmailMessage()
        msg.set_content(f"Dear Parent,\n\nStudent: {details['name']} ({roll})\nStatus: ABSENT\nDate: {datetime.now().strftime('%Y-%m-%d')}\n\nPlease contact the college.\n\nRegards,\nSmart Attendance System")
        msg['Subject'] = f"Absent Alert: {details['name']}"
        msg['From'] = SENDER_EMAIL
        msg['To'] = details['email']
        try:
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            server.quit()
        except: pass

    def send_admin_report(self, present_list, absent_list, filepath):
        if not TEACHER_EMAIL or not SENDER_PASSWORD: return
        today_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        msg = EmailMessage()
        msg['Subject'] = f"✅ Attendance Log: {today_str}"
        msg['From'] = SENDER_EMAIL
        msg['To'] = TEACHER_EMAIL
        
        body = f"Session Ended: {today_str}\n\nTotal Present: {len(present_list)}\nTotal Absent: {len(absent_list)}\n\nPlease find the detailed attendance sheet attached for this session."
        msg.set_content(body)
        
        # --- NEW: ATTACH THE CSV FILE ---
        try:
            with open(filepath, 'rb') as f:
                file_data = f.read()
                file_name = os.path.basename(filepath)
            
            msg.add_attachment(file_data, maintype='text', subtype='csv', filename=file_name)
            
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f"[REPORT SENT] 📧 Email with CSV Attachment sent to Admin.")
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send report: {e}")

    def process_absentees(self):
        print("\n[INFO] SESSION ENDED. GENERATING REPORTS...")
        all_rolls = set(self.student_db.keys())
        present_rolls = self.present_students
        absent_rolls = all_rolls - present_rolls
        
        # 1. ADD ABSENTEES TO THE CSV FIRST (So they are included in the email attachment)
        absent_data = []
        for roll in absent_rolls:
            details = self.student_db.get(roll)
            if details:
                absent_data.append({
                    'Roll No': roll, 'Name': details['name'], 'Status': 'Absent', 
                    'Date': datetime.now().strftime("%Y-%m-%d"), 'Time': 'END', 'Accuracy': '0%'
                })
        
        if absent_data:
            df_absent = pd.DataFrame(absent_data)
            df_absent.to_csv(self.attendance_file, mode='a', header=not os.path.exists(self.attendance_file), index=False)

        # 2. CALCULATE OVERALL STATS
        total_present = len(present_rolls)
        total_absent = len(absent_rolls)
        
        try:
            if os.path.exists(self.attendance_file):
                df_today = pd.read_csv(self.attendance_file)
                # Only average accuracy for present students
                present_df = df_today[df_today['Status'] == 'Present']
                if not present_df.empty:
                    accuracies = present_df['Accuracy'].astype(str).str.replace('%', '').astype(float)
                    avg_accuracy = f"{accuracies.mean():.2f}%"
                else:
                    avg_accuracy = "0%"
            else:
                avg_accuracy = "0%"
        except Exception as e:
            print(f"[WARN] Could not calc accuracy: {e}")
            avg_accuracy = "N/A"

        # 3. SAVE TO MASTER SUMMARY FILE
        if not os.path.exists(self.summary_file):
            df_summary = pd.DataFrame(columns=['Sr.No', 'Date', 'Time', 'Total Present', 'Total Absent', 'Overall Accuracy'])
            sr_no = 1
        else:
            df_summary = pd.read_csv(self.summary_file)
            sr_no = df_summary['Sr.No'].iloc[-1] + 1 if not df_summary.empty else 1

        new_summary = pd.DataFrame([{
            'Sr.No': sr_no,
            'Date': datetime.now().strftime("%Y-%m-%d"),
            'Time': datetime.now().strftime("%H:%M:%S"),
            'Total Present': total_present,
            'Total Absent': total_absent,
            'Overall Accuracy': avg_accuracy
        }])

        new_summary.to_csv(self.summary_file, mode='a', header=not os.path.exists(self.summary_file), index=False)
        print(f"[INFO] 📊 Session logged to '{self.attendance_file}'")

        # 4. SEND EMAIL WITH ATTACHMENT
        self.send_admin_report(present_rolls, absent_rolls, self.attendance_file)
    def mark_present(self, roll, ai_name, score):
        csv_name = self.student_db.get(roll, {}).get('name', ai_name)
        today = datetime.now().strftime("%Y-%m-%d")
        
        if roll not in self.present_students:
            score_percent = f"{int(score * 100)}%"
            print(f"[PRESENT] ✅ {csv_name} (Confidence: {score_percent})")
            
            new_entry = pd.DataFrame({
                'Roll No': [roll], 'Name': [csv_name], 'Status': ['Present'], 
                'Date': [today], 'Time': [datetime.now().strftime("%H:%M:%S")], 'Accuracy': [score_percent]
            })
            new_entry.to_csv(self.attendance_file, mode='a', header=False, index=False)
            self.present_students.add(roll)
            
            if roll not in self.spoken_ids:
                # --- ASYNC GREETING ---
                def handle_greeting():
                    try:
                        greeting = ai_analyst.get_greeting(csv_name)
                    except:
                        greeting = f"Welcome {csv_name}"
                    self.speak(greeting)
                
                threading.Thread(target=handle_greeting, daemon=True).start()
                self.spoken_ids.add(roll)


    def cosine_similarity(self, emb1, emb2):
        return np.dot(emb1, emb2) / (np.linalg.norm(emb1) * np.linalg.norm(emb2))

    def run(self):
        print("[INFO] Starting Security Camera... Press 'q' to End Session.")
        self.camera = ThreadedCamera(0).start()
        
        frame_count = 0
        current_faces = [] 
        
        # Intruder Variables
        unknown_consecutive_frames = 0

        # FPS Tracking
        fps_start_time = datetime.now()
        fps_counter = 0
        fps = 0

        while True:
            ret, frame = self.camera.read()
            if not ret or frame is None:
                time.sleep(0.005)
                continue
            frame_count += 1
            fps_counter += 1
            
            # Calculate FPS
            elapsed_time = (datetime.now() - fps_start_time).total_seconds()
            if elapsed_time > 1.0:
                fps = fps_counter / elapsed_time
                fps_counter = 0
                fps_start_time = datetime.now()

            # --- PHASE 1: GPU DETECTION ---
            if frame_count % self.skip_frames == 0:
                try:
                    faces = self.app.get(frame)
                    current_faces = [] 
                    has_unknown = False
                    
                    for face in faces:
                        norm_emb = face.embedding / np.linalg.norm(face.embedding)
                        
                        best_sim = 0
                        best_idx = -1
                        
                        # --- OPTIMIZED: Vectorized Cosine Similarity ---
                        if len(self.known_face_encodings) > 0:
                            sims = np.dot(self.known_face_encodings, norm_emb)
                            best_idx = np.argmax(sims)
                            best_sim = sims[best_idx]
                        
                        name = "Unknown"
                        color = (0, 0, 255)
                        score_text = "0%"
                        
                        # High Security Threshold (0.6)
                        if best_sim >= self.confidence_threshold:
                            roll = self.known_roll_nos[best_idx]
                            name = self.student_db.get(roll, {}).get('name', self.known_face_names[best_idx])
                            color = (0, 255, 0)
                            self.mark_present(roll, name, best_sim)
                            display_score = min(99, int((best_sim + 0.2) * 100))
                            score_text = f"{display_score}%"
                            
                            # --- FEATURE 5: SELF-LEARNING (Auto-Update) ---
                            if best_sim >= 0.85 and frame_count % 100 == 0:
                                folder_name = f"{str(name).strip()}_{str(roll).strip()}"
                                save_path = os.path.join("dataset", folder_name)
                                if os.path.exists(save_path):
                                    bbox = face.bbox.astype(int)
                                    y1, y2, x1, x2 = max(0, bbox[1]), min(frame.shape[0], bbox[3]), max(0, bbox[0]), min(frame.shape[1], bbox[2])
                                    face_img = frame[y1:y2, x1:x2]
                                    if face_img.size > 0:
                                        img_name = f"auto_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                                        cv2.imwrite(os.path.join(save_path, img_name), face_img)
                        else:
                            has_unknown = True

                        current_faces.append((face.bbox.astype(int), name, color, score_text))
                    
                    # --- SECURITY LOGIC ---
                    if has_unknown:
                        unknown_consecutive_frames += 1
                    else:
                        unknown_consecutive_frames = 0 
                    
                    if self.cooldown_timer > 0:
                        self.cooldown_timer -= 1

                    if unknown_consecutive_frames > self.intruder_threshold and self.cooldown_timer == 0:
                        self.trigger_intruder_alert(frame)
                        self.cooldown_timer = 150 
                        unknown_consecutive_frames = 0

                except Exception as e:
                    # print(f"Detection error: {e}")
                    pass

            # --- PHASE 2: DRAWING ---
            for (bbox, name, color, score) in current_faces:
                cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), color, 2)
                if name == "Unknown":
                    cv2.putText(frame, "WARNING: INTRUDER", (bbox[0], bbox[1]-30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                else:
                    cv2.putText(frame, f"{name} {score}", (bbox[0], bbox[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

            # Show FPS and GPU status
            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
            cv2.putText(frame, f"GPU: {'ACTIVE' if self.using_gpu else 'INACTIVE'}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if self.using_gpu else (0, 0, 255), 2)

            cv2.imshow('Smart Attendance System By Face Recognition Done by AI', frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                self.process_absentees()
                break
        
        self.camera.release()
        self.speech_worker_started = False
        cv2.destroyAllWindows()

if __name__ == "__main__":
    system = SmartAttendanceSystem()
    system.run()