import customtkinter as ctk
import cv2
from PIL import Image, ImageTk

# --- 1. WINDOW SETUP ---
# Forces a sleek dark mode look
ctk.set_appearance_mode("dark")  
ctk.set_default_color_theme("blue")

app = ctk.CTk()
app.geometry("1000x650")
app.title("SmartAttendance - AI - Desktop Control Center")
import customtkinter as ctk
import cv2
from PIL import Image

# --- 1. SYSTEM CONFIGURATION ---
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# --- 2. MAIN APPLICATION CLASS ---
class SmartAttendance - AIOS(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Settings
        self.title("SmartAttendance - AI OS - Professional Control Center")
        self.geometry("1100x700")
        
        # Camera Variables
        self.cap = None
        self.is_running = False

        # --- 3. BUILD THE UI ---
        self.build_sidebar()
        self.build_main_view()

    def build_sidebar(self):
        # Sidebar Frame
        self.sidebar = ctk.CTkFrame(self, width=280, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")

        # Logo/Title
        self.logo = ctk.CTkLabel(self.sidebar, text="🎓 SmartAttendance - AI OS", font=ctk.CTkFont(size=26, weight="bold"))
        self.logo.pack(pady=(40, 30))

        # Control Buttons
        self.btn_start = ctk.CTkButton(self.sidebar, text="▶ Start AI Engine", height=45, font=ctk.CTkFont(weight="bold"), command=self.start_camera)
        self.btn_start.pack(padx=20, pady=10, fill="x")

        self.btn_stop = ctk.CTkButton(self.sidebar, text="⏹ Stop Engine", height=45, fg_color="#8B0000", hover_color="#FF0000", font=ctk.CTkFont(weight="bold"), command=self.stop_camera)
        self.btn_stop.pack(padx=20, pady=10, fill="x")

        # System Status Display
        self.status_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        self.status_frame.pack(side="bottom", pady=40)
        
        self.status_indicator = ctk.CTkLabel(self.status_frame, text="System Status:\n🔴 OFFLINE", font=ctk.CTkFont(size=16), text_color="gray")
        self.status_indicator.pack()

    def build_main_view(self):
        # Main Content Frame
        self.main_frame = ctk.CTkFrame(self, corner_radius=15)
        self.main_frame.pack(side="right", fill="both", expand=True, padx=20, pady=20)

        # Header
        self.header = ctk.CTkLabel(self.main_frame, text="Live Vision Feed", font=ctk.CTkFont(size=22, weight="bold"))
        self.header.pack(pady=(20, 10))

        # The Video Canvas (Black square when offline)
        self.video_label = ctk.CTkLabel(self.main_frame, text="[ Camera Offline ]", width=640, height=480, fg_color="black", corner_radius=10)
        self.video_label.pack(expand=True)

    # --- 4. ENGINE LOGIC ---
    def start_camera(self):
        if not self.is_running:
            # 0 is usually the default built-in laptop webcam
            self.cap = cv2.VideoCapture(0) 
            self.is_running = True
            
            # Update UI
            self.status_indicator.configure(text="System Status:\n🟢 ONLINE", text_color="#00FF00")
            
            # Trigger the video loop
            self.process_video_frame()

    def stop_camera(self):
        self.is_running = False
        if self.cap:
            self.cap.release()
            
        # Reset UI
        self.video_label.configure(image=None, text="[ Camera Offline ]")
        self.status_indicator.configure(text="System Status:\n🔴 OFFLINE", text_color="gray")

    def process_video_frame(self):
        if self.is_running and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                # 1. OpenCV reads in BGR format, we must convert to RGB so faces don't look blue!
                cv2_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # 2. Convert to a PIL Image
                pil_image = Image.fromarray(cv2_image)
                
                # 3. Convert to a CustomTkinter Image object
                ctk_image = ctk.CTkImage(light_image=pil_image, dark_image=pil_image, size=(640, 480))
                
                # 4. Inject it into the UI Label
                self.video_label.configure(image=ctk_image, text="")
            
            # 5. The Magic Trick: Call this exact function again in 15 milliseconds
            self.after(15, self.process_video_frame)

# --- 5. EXECUTE ---
if __name__ == "__main__":
    app = SmartAttendance - AIOS()
    app.mainloop()

# --- 2. THE SIDEBAR (Controls) ---
sidebar = ctk.CTkFrame(app, width=250, corner_radius=0)
sidebar.pack(side="left", fill="y")

logo_label = ctk.CTkLabel(sidebar, text="🎓 SmartAttendance - AI AI", font=ctk.CTkFont(size=24, weight="bold"))
logo_label.pack(padx=20, pady=(30, 20))

# We will connect these buttons to your InsightFace logic later!
start_btn = ctk.CTkButton(sidebar, text="▶ Start AI Engine", height=40)
start_btn.pack(padx=20, pady=10)

stop_btn = ctk.CTkButton(sidebar, text="⏹ Stop Engine", height=40, fg_color="darkred", hover_color="red")
stop_btn.pack(padx=20, pady=10)

stats_label = ctk.CTkLabel(sidebar, text="System Status: OFFLINE", text_color="gray")
stats_label.pack(side="bottom", pady=20)

# --- 3. THE MAIN VIEW (Video Area) ---
main_frame = ctk.CTkFrame(app, corner_radius=15)
main_frame.pack(side="right", fill="both", expand=True, padx=20, pady=20)

title_label = ctk.CTkLabel(main_frame, text="Live Attendance Feed", font=ctk.CTkFont(size=18))
title_label.pack(pady=(20, 10))

# This blank label is where we will inject the OpenCV video frames!
video_label = ctk.CTkLabel(main_frame, text="[ Camera Feed Offline ]", width=640, height=480, fg_color="black")
video_label.pack(expand=True, padx=20, pady=20)

# --- RUN THE APP ---
if __name__ == "__main__":
    app.mainloop()
