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
from typing import Any

from insightface.app import FaceAnalysis
from dotenv import load_dotenv  
try:
    import ai_analyst
except ImportError:
    from core import ai_analyst


import requests

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


def _build_smart_html_email(title, badge_text, badge_bg, heading, body_html, footer_note=""):
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; width: 100%; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 30px 10px 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); overflow: hidden;">
          <!-- Header Banner with Brand Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center;">
              <div style="margin-bottom: 8px;">
                <img src="cid:smartface_logo" alt="Smart Attendance AI Logo" style="max-height: 52px; max-width: 220px; height: auto; width: auto; border: 0; display: inline-block; vertical-align: middle;" />
              </div>
              <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-top: 6px;">Smart Attendance AI</div>
              <div style="font-size: 11px; color: #93c5fd; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin-top: 4px;">Next-Gen Biometric Security & Attendance</div>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 24px 32px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="display: inline-block; background-color: {badge_bg}; color: #ffffff; padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  {badge_text}
                </span>
              </div>
              <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">{heading}</h2>
              {body_html}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              {f'<div style="margin-bottom: 8px; color: #475569; font-weight: 500;">{footer_note}</div>' if footer_note else ''}
              <div style="margin-top: 6px; font-weight: 600; color: #94a3b8;">© 2026 Smart Attendance System • AI Security & Analytics Platform</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _attach_inline_logo(msg):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    logo_candidates = [
        os.path.join(base_dir, "smartface_node_api", "public", "email", "Email_logo.png"),
        os.path.join(base_dir, "smartface_banner.png"),
    ]
    for logo_path in logo_candidates:
        if os.path.exists(logo_path):
            try:
                with open(logo_path, 'rb') as f:
                    logo_data = f.read()
                    for part in msg.walk():
                        if part.get_content_type() == 'text/html':
                            part.add_related(logo_data, maintype='image', subtype='png', cid='<smartface_logo>')
                            return True
            except Exception as e:
                print(f"[LOGO ATTACH WARN] Could not attach inline logo: {e}")
    return False

class SmartAttendanceSystem:
    def __init__(self):
        # API Sync configuration
        self.api_url = os.getenv("API_URL", "http://localhost:8000")
        self.scanner_token = os.getenv("FACE_SCANNER_TOKEN", "secure_face_scanner_default_key_123")

        # Resolve paths relative to the project root directory
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.data_dir = os.path.join(self.base_dir, "data")

        self.encodings_path = os.path.join(self.data_dir, "face_encodings_arcface.pkl")
        self.student_details_file = os.path.join(self.data_dir, "students.csv")
        self.intruder_folder = os.path.join(self.data_dir, "Intruders")
        
        # --- NEW: Attendance Folder & Dynamic Files ---
        self.attendance_folder = os.path.join(self.data_dir, "Attendance_Logs")
        if not os.path.exists(self.attendance_folder):
            os.makedirs(self.attendance_folder)
            
        # Creates a unique file for every session like: Attendance_2026-02-18_10-30-00.csv
        self.session_time = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        self.attendance_file = os.path.join(self.attendance_folder, f"Attendance_{self.session_time}.csv")
        self.summary_file = os.path.join(self.attendance_folder, "Master_Summary.csv")
        
        
        # Settings
        self.confidence_threshold = 0.6  # Higher threshold for Security
        self.intruder_threshold = 30     # Frames (approx 2 seconds) to trigger alert
        self.cooldown_timer = 0          # Prevent spamming emails
        
        # Data Structures
        self.student_db = {} 
        self.known_face_encodings: Any = []
        self.known_face_names = []
        self.known_roll_nos = []
        self.present_students = set() 
        
        # --- GPU INITIALIZATION ---
        print("[INFO] Initializing High-Performance Security Engine...")

        # 'available' only means the provider is compiled in; it does NOT mean the
        # required CUDA/cuDNN DLLs can actually be loaded at runtime.
        cuda_listed = 'CUDAExecutionProvider' in onnxruntime.get_available_providers()
        if not cuda_listed:
            print("[WARN] CUDAExecutionProvider is not available in this onnxruntime build.")
            print("       You likely have the CPU-only 'onnxruntime' package. Install GPU build:")
            print("       pip uninstall -y onnxruntime onnxruntime-gpu")
            print("       pip install onnxruntime-gpu==1.17.1   (matches CUDA 11.8 + cuDNN 8)")

        # Using Large Model for maximum accuracy
        self.app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        self.app.prepare(ctx_id=0, det_size=(640, 640))

        # Verify if GPU is ACTUALLY bound by the loaded session (the real source of truth).
        self.using_gpu = False
        try:
            actual_providers = self.app.models['detection'].session.get_providers()
            self.using_gpu = 'CUDAExecutionProvider' in actual_providers
        except Exception as e:
            print(f"[WARN] Could not read session providers: {e}")

        if self.using_gpu:
            print("[INFO] Security Engine Loaded. GPU: ACTIVE (CUDA)")
        else:
            print("=" * 70)
            print("[WARNING] GPU ACCELERATION IS NOT ACTIVE - RUNNING ON CPU (SLOW).")
            if cuda_listed:
                # Provider was listed but the session still fell back to CPU.
                # This almost always means a CUDA/cuDNN version mismatch (missing DLLs).
                print("  CUDA was detected but failed to load at runtime (likely a missing")
                print("  CUDA/cuDNN DLL, e.g. cublasLt64_*.dll). This is a version mismatch")
                print("  between onnxruntime-gpu and your installed CUDA toolkit.")
                print("  Your toolkit is CUDA 11.8 + cuDNN 8 -> use onnxruntime-gpu==1.17.1:")
                print("     pip install onnxruntime-gpu==1.17.1")
            print("  Detection will be noticeably laggy until the GPU is fixed.")
            print("=" * 70)

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
        dataset_path = os.path.join(self.data_dir, "dataset")
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
            
            # Configure a clear, beautiful female voice (Zira) if available
            voices = engine.getProperty("voices")
            if isinstance(voices, (list, tuple)):
                for voice in voices:
                    if hasattr(voice, "name") and "zira" in str(voice.name).lower():
                        engine.setProperty("voice", voice.id)
                        break
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

            plain_text = f"SECURITY ALERT\n\nUnregistered person detected at {formatted_time}.\nSnapshot attached."
            msg.set_content(plain_text)

            body_html = f"""
            <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-size: 14px; color: #9f1239; padding-bottom: 8px;"><strong>Alert Level:</strong></td>
                  <td style="font-size: 14px; text-align: right; padding-bottom: 8px;"><span style="background-color: #e11d48; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 11px;">HIGH SECURITY</span></td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #9f1239; padding-bottom: 8px;"><strong>Date & Time:</strong></td>
                  <td style="font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 8px;">{formatted_time}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #9f1239;"><strong>Source:</strong></td>
                  <td style="font-size: 14px; color: #0f172a; font-weight: 600; text-align: right;">Main Camera Feed</td>
                </tr>
              </table>
            </div>
            <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
              Dear Administrator,<br><br>
              An unregistered individual was detected by the SmartFace AI Security Engine in the scanning area. A high-resolution snapshot is attached to this notice for immediate review.
            </p>
            """

            html_full = _build_smart_html_email(
                title="Security Notice - Smart Attendance AI",
                badge_text="🛡️ SECURITY ALERT",
                badge_bg="#e11d48",
                heading="Unregistered Individual Detected",
                body_html=body_html,
                footer_note="High-resolution intruder snapshot attached to this alert."
            )

            msg.add_alternative(html_full, subtype='html')
            _attach_inline_logo(msg)

            try:
                with open(filename, 'rb') as f:
                    file_data = f.read()
                    file_name = os.path.basename(filename)
                
                msg.add_attachment(file_data, maintype='image', subtype='jpeg', filename=file_name)
                
                server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
                server.login(SENDER_EMAIL, SENDER_PASSWORD)
                server.send_message(msg)
                server.quit()
                print(f"[EMAIL SENT] 🛡️ Smart HTML Security Notice sent to Admin successfully.")
                
            except Exception as e:
                print(f"[EMAIL ERROR] Could not send photo: {e}")

        threading.Thread(target=_send_email_with_photo).start()
        
    def send_absent_email(self, roll, details):
        if not SENDER_PASSWORD: return
        recipient_email = str(details.get('email', '')).strip()
        if not recipient_email or recipient_email.endswith('@college.edu'):
            return  # Skip default placeholder emails

        today_str = datetime.now().strftime("%B %d, %Y")
        student_name = details.get('name', 'Student')

        msg = EmailMessage()
        msg['Subject'] = f"🔴 Absent Alert: {student_name} ({roll})"
        msg['From'] = SENDER_EMAIL
        msg['To'] = recipient_email

        plain_text = (
            f"Dear Parent / Guardian,\n\n"
            f"This is an automated notification from Smart Attendance System.\n\n"
            f"Student Name: {student_name}\n"
            f"Roll Number: {roll}\n"
            f"Status: ABSENT\n"
            f"Date: {today_str}\n\n"
            f"Please contact administration if this absence was unexpected.\n\n"
            f"Regards,\nSmart Attendance AI Team"
        )
        msg.set_content(plain_text)

        body_html = f"""
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 14px; color: #991b1b; padding-bottom: 10px;"><strong>Student Name:</strong></td>
              <td style="font-size: 15px; color: #111827; font-weight: 700; text-align: right; padding-bottom: 10px;">{student_name}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #991b1b; padding-bottom: 10px;"><strong>Roll / Student ID:</strong></td>
              <td style="font-size: 15px; color: #111827; font-weight: 700; text-align: right; padding-bottom: 10px;">{roll}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #991b1b; padding-bottom: 10px;"><strong>Attendance Status:</strong></td>
              <td style="font-size: 14px; text-align: right; padding-bottom: 10px;"><span style="background-color: #dc2626; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: 700; font-size: 12px;">ABSENT</span></td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #991b1b;"><strong>Date:</strong></td>
              <td style="font-size: 15px; color: #111827; font-weight: 600; text-align: right;">{today_str}</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 16px 0;">
          Dear Parent / Guardian,<br><br>
          Our biometric face recognition system recorded <strong>{student_name}</strong> as <strong>ABSENT</strong> for today's session on <strong>{today_str}</strong>.
        </p>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
          If this absence was unplanned, please notify the college administration.
        </p>
        """

        html_full = _build_smart_html_email(
            title="Absent Notification - Smart Attendance AI",
            badge_text="🔴 ABSENT NOTICE",
            badge_bg="#dc2626",
            heading="Attendance Status Alert",
            body_html=body_html,
            footer_note="Automated notification generated by Smart Attendance AI Biometric System."
        )

        msg.add_alternative(html_full, subtype='html')
        _attach_inline_logo(msg)

        try:
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f"[EMAIL SENT] 📧 Smart HTML Absent alert sent for {student_name} ({roll}) to {recipient_email}")
        except Exception as e:
            print(f"[EMAIL ERROR] Failed sending absent alert to {recipient_email}: {e}")

    def send_admin_report(self, present_list, absent_list, filepath):
        if not TEACHER_EMAIL or not SENDER_PASSWORD: return
        today_str = datetime.now().strftime("%B %d, %Y %I:%M %p")
        
        msg = EmailMessage()
        msg['Subject'] = f"✅ Attendance Log Report: {today_str}"
        msg['From'] = SENDER_EMAIL
        msg['To'] = TEACHER_EMAIL

        total_present = len(present_list)
        total_absent = len(absent_list)
        total_students = total_present + total_absent

        plain_text = (
            f"Dear Administrator,\n\n"
            f"Biometric Attendance Session Ended: {today_str}\n\n"
            f"Total Present: {total_present}\n"
            f"Total Absent: {total_absent}\n"
            f"Total Students: {total_students}\n\n"
            f"The detailed attendance CSV log is attached to this email.\n\n"
            f"Smart Attendance AI Engine"
        )
        msg.set_content(plain_text)

        body_html = f"""
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="font-size: 14px; color: #64748b; padding-bottom: 10px;"><strong>Session Timestamp:</strong></td>
              <td style="font-size: 14px; color: #0f172a; font-weight: 700; text-align: right; padding-bottom: 10px;">{today_str}</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #15803d; padding-bottom: 10px;"><strong>Total Present:</strong></td>
              <td style="font-size: 16px; color: #15803d; font-weight: 800; text-align: right; padding-bottom: 10px;">{total_present} Students</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #b91c1c; padding-bottom: 10px;"><strong>Total Absent:</strong></td>
              <td style="font-size: 16px; color: #b91c1c; font-weight: 800; text-align: right; padding-bottom: 10px;">{total_absent} Students</td>
            </tr>
            <tr>
              <td style="font-size: 14px; color: #1d4ed8;"><strong>Total Tracked:</strong></td>
              <td style="font-size: 16px; color: #1d4ed8; font-weight: 800; text-align: right;">{total_students} Students</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 16px 0;">
          Dear Administrator,<br><br>
          The biometric face recognition attendance session has concluded. Attached is the full session record CSV containing individual verification timestamps and accuracy metrics.
        </p>
        """

        html_full = _build_smart_html_email(
            title="Attendance Log Report - Smart Attendance AI",
            badge_text="📊 SESSION REPORT",
            badge_bg="#1e3a8a",
            heading="Daily Attendance Summary",
            body_html=body_html,
            footer_note="CSV Log file attached to this message."
        )

        msg.add_alternative(html_full, subtype='html')
        _attach_inline_logo(msg)

        try:
            with open(filepath, 'rb') as f:
                file_data = f.read()
                file_name = os.path.basename(filepath)
            
            msg.add_attachment(file_data, maintype='text', subtype='csv', filename=file_name)
            
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            server.quit()
            print(f"[REPORT SENT] 📧 Smart HTML Email with CSV Attachment sent to Admin ({TEACHER_EMAIL}).")
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

        # 4. SEND INDIVIDUAL ABSENT NOTIFICATIONS TO STUDENTS/PARENTS
        for roll in absent_rolls:
            details = self.student_db.get(roll)
            if details:
                threading.Thread(target=self.send_absent_email, args=(roll, details)).start()

        # 5. SEND EMAIL WITH ATTACHMENT TO ADMIN/TEACHER
        self.send_admin_report(present_rolls, absent_rolls, self.attendance_file)
    def mark_present(self, roll, ai_name, score):
        student_info = self.student_db.get(roll, {})
        csv_name = student_info.get('name', ai_name)
        email = student_info.get('email')
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
            
            # --- NON-BLOCKING API SYNC BRIDGE ---
            if email:
                def sync_to_mongodb():
                    try:
                        url = f"{self.api_url}/attendance/mark/face"
                        headers = {
                            "token": self.scanner_token,
                            "Content-Type": "application/json"
                        }
                        payload = {
                            "student_email": email,
                            "confidence": float(score)
                        }
                        response = requests.post(url, json=payload, headers=headers, timeout=5)
                        if response.status_code == 200:
                            print(f"[API SYNC] Sync successful for {email} (Roll: {roll})")
                        else:
                            print(f"[API SYNC ERROR] Failed to sync {email}: {response.status_code} - {response.text}")
                    except Exception as err:
                        print(f"[API SYNC ERROR] Connection failed: {err}")
                
                threading.Thread(target=sync_to_mongodb, daemon=True).start()

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

    def draw_hud(self, frame, fps):
        h, w, _ = frame.shape
        
        # 1. Semi-transparent header background (top bar: 0 to 45)
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (w, 45), (10, 6, 2), cv2.FILLED)  # Space navy BGR (2, 6, 10)
        
        # 2. Semi-transparent footer background (bottom bar: h-35 to h)
        cv2.rectangle(overlay, (0, h - 35), (w, h), (10, 6, 2), cv2.FILLED)
        
        # Alpha blend overlays
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
        
        # 3. Top HUD Details
        # Branded Title
        cv2.putText(frame, "SMARTFACE SECURITY HUD - SCANNING ACTIVE", (15, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (3, 183, 255), 2, cv2.LINE_AA) # Gold BGR (3, 183, 255)
        
        # System Time
        time_str = datetime.now().strftime("%Y-%m-%d  %I:%M:%S %p")
        cv2.putText(frame, time_str, (w - 240, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)
        
        # Decorative divider lines
        cv2.line(frame, (0, 45), (w, 45), (3, 183, 255), 1)
        cv2.line(frame, (0, h - 35), (w, h - 35), (3, 183, 255), 1)
        
        # 4. Bottom Telemetry details
        # GPU Acceleration status
        gpu_color = (118, 230, 0) if self.using_gpu else (80, 80, 240)  # Cyber green vs cyber coral BGR
        cv2.circle(frame, (20, h - 17), 4, gpu_color, cv2.FILLED)
        cv2.putText(frame, f"ENGINE: InsightFace AI (buffalo_l) | ACCELERATOR: {'CUDA (GPU)' if self.using_gpu else 'CPU Mode'}", (35, h - 13), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)
        
        # FPS Status
        cv2.putText(frame, f"SCAN RATE: {fps:.1f} FPS", (w - 180, h - 13), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1, cv2.LINE_AA)

    def draw_face_target(self, frame, bbox, name, color, score):
        x1, y1, x2, y2 = bbox
        
        # 1. Custom High-tech corner brackets
        length = 18
        thickness = 2
        
        # Top Left Corners
        cv2.line(frame, (x1, y1), (x1 + length, y1), color, thickness)
        cv2.line(frame, (x1, y1), (x1, y1 + length), color, thickness)
        
        # Top Right Corners
        cv2.line(frame, (x2, y1), (x2 - length, y1), color, thickness)
        cv2.line(frame, (x2, y1), (x2, y1 + length), color, thickness)
        
        # Bottom Left Corners
        cv2.line(frame, (x1, y2), (x1 + length, y2), color, thickness)
        cv2.line(frame, (x1, y2), (x1, y2 - length), color, thickness)
        
        # Bottom Right Corners
        cv2.line(frame, (x2, y2), (x2 - length, y2), color, thickness)
        cv2.line(frame, (x2, y2), (x2, y2 - length), color, thickness)
        
        # 2. Dotted box frame overlay for high-tech HUD look
        overlay = frame.copy()
        cv2.rectangle(overlay, (x1, y1), (x2, y2), color, 1)
        cv2.addWeighted(overlay, 0.2, frame, 0.8, 0, frame)
        
        # 3. Transparent Title Banner above target Face
        banner_height = 24
        cv2.rectangle(overlay, (x1, y1 - banner_height - 4), (x2, y1 - 4), (10, 6, 2), cv2.FILLED)
        cv2.addWeighted(overlay, 0.75, frame, 0.25, 0, frame)
        cv2.rectangle(frame, (x1, y1 - banner_height - 4), (x2, y1 - 4), color, 1)
        
        # Target details text
        if name == "Unknown":
            cv2.putText(frame, "WARNING: INTRUDER DETECTED", (x1 + 6, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (80, 80, 240), 1, cv2.LINE_AA)
        else:
            display_text = f"{name.upper()}  {score}"
            cv2.putText(frame, display_text, (x1 + 6, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

    def run(self):
        print("[INFO] Starting Security Camera... Press 'q' to End Session.")
        self.speak("Attendance scanning started.")
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
                                save_path = os.path.join(self.data_dir, "dataset", folder_name)
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

            # --- PHASE 2: DRAWING BIOMETRIC HUD ---
            for (bbox, name, color, score) in current_faces:
                # Convert standard BGR colors for a unified premium aesthetic
                # Standard green: (0, 255, 0) -> cyber neon green (118, 230, 0)
                # Standard red: (0, 0, 255) -> cyber coral red (80, 80, 240)
                hud_color = (118, 230, 0) if color == (0, 255, 0) else (80, 80, 240)
                self.draw_face_target(frame, bbox, name, hud_color, score)

            # Draw the global high-tech diagnostic HUD overlay
            self.draw_hud(frame, fps)

            try:
                cv2.imshow('Smart Attendance System By Face Recognition Done by AI', frame)
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    self.process_absentees()
                    self.speak("Attendance session ended.")
                    self.speech_queue.join()
                    break
            except cv2.error:
                # opencv-python-headless installed or display GUI unavailable
                pass
        
        self.camera.release()
        self.speech_worker_started = False
        try:
            cv2.destroyAllWindows()
        except cv2.error:
            pass

if __name__ == "__main__":
    system = SmartAttendanceSystem()
    system.run()