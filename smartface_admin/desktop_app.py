import customtkinter as ctk
import cv2
from PIL import Image
import os

# --- 1. SYSTEM CONFIGURATION & THEME COLORS ---
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")  # Base CTk theme fallback

# Custom Palette Architecture
BG_COLOR = "#02040A"         # Base canvas black
SIDEBAR_BG = "#060A1A"       # Frosted glass sidebar navy
CARD_BG = "#0E1528"          # High-fidelity widget backdrop
GOLD_ACCENT = "#FFB703"      # Premium Amber Gold
GOLD_HOVER = "#D48C00"       # Deep Gold highlight
BORDER_COLOR = "rgba(255, 183, 3, 0.12)" # Delicate gold border overlay
TEXT_MUTED = "#94A3B8"       # Subtle slate text
ALERT_RED = "#EF4444"        # Error Coral Red
ALERT_RED_HOVER = "#C53030"  # Deeper Coral hover
SUCCESS_GREEN = "#10B981"    # Emerald Success Green

# --- 2. MAIN APPLICATION CLASS ---
class SmartAttendanceAIOS(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Settings
        self.title("SmartAttendance - AI OS Biometric Control Center")
        self.geometry("1100x750")
        self.configure(fg_color=BG_COLOR)
        
        # Camera Variables
        self.cap = None
        self.is_running = False

        # --- 3. BUILD THE UI ---
        self.build_sidebar()
        self.build_main_view()

    def build_sidebar(self):
        # Sidebar Frame with delicate borders
        self.sidebar = ctk.CTkFrame(self, width=280, corner_radius=0, fg_color=SIDEBAR_BG, border_color="#1D284C", border_width=1)
        self.sidebar.pack(side="left", fill="y")

        # Logo/Title Header
        logo_container = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        logo_container.pack(pady=(40, 20), padx=20, fill="x")
        
        self.logo_icon = ctk.CTkLabel(logo_container, text="🛡️", font=ctk.CTkFont(size=36))
        self.logo_icon.pack()
        
        self.logo = ctk.CTkLabel(
            logo_container, 
            text="SmartAttendance", 
            font=ctk.CTkFont(family="Outfit", size=22, weight="bold"), 
            text_color="#FFFFFF"
        )
        self.logo.pack(pady=(10, 0))
        
        self.logo_sub = ctk.CTkLabel(
            logo_container, 
            text="AI BIOMETRIC SECURITY OS", 
            font=ctk.CTkFont(family="Inter", size=10, weight="bold"), 
            text_color=GOLD_ACCENT
        )
        self.logo_sub.pack()

        # Separator line
        sep = ctk.CTkFrame(self.sidebar, height=2, fg_color="#1D284C")
        sep.pack(fill="x", padx=25, pady=(10, 20))

        # Control Buttons
        self.btn_start = ctk.CTkButton(
            self.sidebar, 
            text="▶ Start AI Engine", 
            height=45, 
            fg_color=GOLD_ACCENT,
            hover_color=GOLD_HOVER,
            text_color="#02040A",
            font=ctk.CTkFont(family="Outfit", size=14, weight="bold"), 
            corner_radius=12,
            command=self.start_camera
        )
        self.btn_start.pack(padx=20, pady=10, fill="x")

        self.btn_stop = ctk.CTkButton(
            self.sidebar, 
            text="⏹ Stop Engine", 
            height=45, 
            fg_color=ALERT_RED, 
            hover_color=ALERT_RED_HOVER, 
            text_color="#FFFFFF",
            font=ctk.CTkFont(family="Outfit", size=14, weight="bold"), 
            corner_radius=12,
            command=self.stop_camera
        )
        self.btn_stop.pack(padx=20, pady=10, fill="x")

        # System Status Display
        self.status_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        self.status_frame.pack(side="bottom", pady=40)
        
        # Sleek diagnostic badge
        self.badge_bg = ctk.CTkFrame(self.status_frame, fg_color="rgba(239, 68, 68, 0.1)", border_color="rgba(239, 68, 68, 0.3)", border_width=1, corner_radius=20, height=40)
        self.badge_bg.pack(pady=10)
        
        self.status_dot = ctk.CTkLabel(self.badge_bg, text="●", text_color=ALERT_RED, font=ctk.CTkFont(size=14))
        self.status_dot.pack(side="left", padx=(15, 5))
        
        self.status_indicator = ctk.CTkLabel(
            self.badge_bg, 
            text="SYSTEM OFFLINE", 
            font=ctk.CTkFont(family="Inter", size=12, weight="bold"), 
            text_color=TEXT_MUTED
        )
        self.status_indicator.pack(side="left", padx=(0, 15), pady=5)

    def build_main_view(self):
        # Main Content Frame with premium dark background
        self.main_frame = ctk.CTkFrame(self, corner_radius=20, fg_color=CARD_BG, border_color="#1D284C", border_width=1)
        self.main_frame.pack(side="right", fill="both", expand=True, padx=25, pady=25)

        # Header Title
        self.header = ctk.CTkLabel(
            self.main_frame, 
            text="LIVE VISION TELEMETRY", 
            font=ctk.CTkFont(family="Outfit", size=20, weight="bold"),
            text_color="#FFFFFF"
        )
        self.header.pack(pady=(20, 10))

        # Viewport Frame with glowing border mimicking high-tech HUD scope visor
        self.viewport_container = ctk.CTkFrame(self.main_frame, fg_color="black", border_color=GOLD_ACCENT, border_width=1.5, corner_radius=12)
        self.viewport_container.pack(expand=True, padx=20, pady=(0, 10))

        # The Video Canvas (Black square when offline)
        self.video_label = ctk.CTkLabel(
            self.viewport_container, 
            text="[ Camera Offline ]", 
            width=640, 
            height=480, 
            fg_color="black", 
            corner_radius=10,
            text_color=TEXT_MUTED,
            font=ctk.CTkFont(family="Inter", size=14)
        )
        self.video_label.pack(expand=True)

        # Telemetry metrics overlay row below the camera view
        self.telemetry_row = ctk.CTkFrame(self.main_frame, fg_color="transparent")
        self.telemetry_row.pack(fill="x", padx=40, pady=(10, 20))
        
        self.add_telemetry_item("DETECTOR ENGINE", "ArcFace AI", 0)
        self.add_telemetry_item("ACCELERATION", "CUDA (GPU)" if cv2.ocl.haveOpenCL() else "CPU Mode", 1)
        self.add_telemetry_item("SCAN RATE", "30 FPS", 2)
        self.add_telemetry_item("VISOR RATIO", "4:3 SD", 3)

    def add_telemetry_item(self, label: str, value: str, col: int):
        self.telemetry_row.columnconfigure(col, weight=1)
        item_frame = ctk.CTkFrame(self.telemetry_row, fg_color="rgba(0, 0, 0, 0.25)", border_color="#1D284C", border_width=1, corner_radius=8)
        item_frame.grid(row=0, column=col, padx=8, sticky="ew")
        
        lbl = ctk.CTkLabel(item_frame, text=label, font=ctk.CTkFont(family="Inter", size=9, weight="bold"), text_color=TEXT_MUTED)
        lbl.pack(pady=(6, 2))
        
        val = ctk.CTkLabel(item_frame, text=value, font=ctk.CTkFont(family="Outfit", size=12, weight="bold"), text_color="#FFFFFF")
        val.pack(pady=(0, 6))

    # --- 4. ENGINE LOGIC ---
    def start_camera(self):
        if not self.is_running:
            self.cap = cv2.VideoCapture(0) 
            self.is_running = True
            
            # Update UI to Online state
            self.badge_bg.configure(fg_color="rgba(16, 185, 129, 0.1)", border_color="rgba(16, 185, 129, 0.3)")
            self.status_dot.configure(text_color=SUCCESS_GREEN)
            self.status_indicator.configure(text="SYSTEM ONLINE", text_color=SUCCESS_GREEN)
            
            # Trigger the video loop
            self.process_video_frame()

    def stop_camera(self):
        self.is_running = False
        if self.cap:
            self.cap.release()
            
        # Reset UI to Offline state
        self.video_label.configure(image=None, text="[ Camera Offline ]")
        self.badge_bg.configure(fg_color="rgba(239, 68, 68, 0.1)", border_color="rgba(239, 68, 68, 0.3)")
        self.status_dot.configure(text_color=ALERT_RED)
        self.status_indicator.configure(text="SYSTEM OFFLINE", text_color=TEXT_MUTED)

    def process_video_frame(self):
        if self.is_running and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret:
                # 1. Convert BGR to RGB
                cv2_image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                
                # 2. Convert to PIL Image
                pil_image = Image.fromarray(cv2_image)
                
                # 3. Convert to CustomTkinter Image object
                ctk_image = ctk.CTkImage(light_image=pil_image, dark_image=pil_image, size=(640, 480))
                
                # 4. Inject it into the UI Label
                self.video_label.configure(image=ctk_image, text="")
            
            # 5. Call this function again in 15ms
            self.after(15, self.process_video_frame)

# --- 5. EXECUTE ---
if __name__ == "__main__":
    app = SmartAttendanceAIOS()
    app.mainloop()
