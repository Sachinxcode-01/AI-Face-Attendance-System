import streamlit as st
import pandas as pd
import os
from PIL import Image  # Added this to handle the profile photos!
from passlib.context import CryptContext

# --- PAGE CONFIGURATION ---
st.set_page_config(page_title="Student Portal", page_icon="🎓", layout="wide")

# ══════════════════════════════════════════════════════════════════════════
# GLOBAL DESIGN SYSTEM (GLASSMORPHISM OVERLAY)
# ══════════════════════════════════════════════════════════════════════════
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Inter:wght@400;500;600;700&display=swap');
    
    /* Apply font hierarchy globally */
    html, body, [class*="css"], [class*="st-"] {
        font-family: 'Inter', sans-serif !important;
    }
    
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Outfit', sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: -0.5px !important;
    }
    
    /* Primary Background & Canvas styling */
    .stApp {
        background: radial-gradient(circle at top, #0A0F24 0%, #02040A 100%) !important;
        color: #E2E8F0 !important;
    }
    
    /* Premium Frosted Glassmorphism Sidebar */
    [data-testid="stSidebar"] {
        background-color: rgba(6, 10, 26, 0.95) !important;
        border-right: 1px solid rgba(255, 183, 3, 0.12) !important;
        backdrop-filter: blur(16px) !important;
    }
    
    /* Sidebar text details */
    [data-testid="stSidebar"] .stMarkdown p {
        color: #94A3B8 !important;
    }
    
    /* Custom premium card system */
    .sf-card {
        background: rgba(14, 21, 40, 0.4) !important;
        border: 1px solid rgba(255, 183, 3, 0.12) !important;
        border-radius: 20px !important;
        padding: 24px !important;
        box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.4) !important;
        backdrop-filter: blur(12px) !important;
        transition: all 0.3s ease-in-out !important;
        margin-bottom: 20px !important;
    }
    
    .sf-card:hover {
        transform: translateY(-4px) !important;
        border-color: rgba(255, 183, 3, 0.4) !important;
        box-shadow: 0 16px 45px 0 rgba(255, 183, 3, 0.08) !important;
    }
    
    /* Customized Horizontal Tabs */
    button[data-baseweb="tab"] {
        background-color: transparent !important;
        color: rgba(255, 255, 255, 0.45) !important;
        border-bottom: 2px solid transparent !important;
        font-family: 'Outfit', sans-serif !important;
        font-size: 15px !important;
        font-weight: 600 !important;
        letter-spacing: 0.5px !important;
        transition: all 0.25s ease !important;
        padding: 10px 20px !important;
    }
    
    button[data-baseweb="tab"]:hover {
        color: rgba(255, 183, 3, 0.8) !important;
    }
    
    button[data-baseweb="tab"][aria-selected="true"] {
        color: #FFB703 !important;
        border-bottom-color: #FFB703 !important;
        text-shadow: 0 0 10px rgba(255, 183, 3, 0.25) !important;
    }
    
    /* Premium Tactical Action Buttons */
    .stButton > button {
        background: linear-gradient(135deg, #FFB703 0%, #D48C00 100%) !important;
        color: #02040A !important;
        font-family: 'Outfit', sans-serif !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px !important;
        border-radius: 12px !important;
        border: none !important;
        padding: 10px 24px !important;
        transition: all 0.25s ease !important;
        box-shadow: 0 4px 15px rgba(255, 183, 3, 0.2) !important;
    }
    
    .stButton > button:hover {
        transform: translateY(-2px) !important;
        box-shadow: 0 6px 20px rgba(255, 183, 3, 0.35) !important;
        color: #000000 !important;
    }
    
    /* Glowing Input Fields */
    div[data-baseweb="input"] {
        background-color: rgba(0, 0, 0, 0.25) !important;
        border: 1px solid rgba(255, 255, 255, 0.08) !important;
        border-radius: 12px !important;
        transition: all 0.2s ease !important;
    }
    
    div[data-baseweb="input"]:focus-within {
        border-color: #FFB703 !important;
        box-shadow: 0 0 10px rgba(255, 183, 3, 0.2) !important;
    }
    
    input {
        color: #FFFFFF !important;
    }
</style>
""", unsafe_allow_html=True)

# ══════════════════════════════════════════════════════════════════════════
def make_kpi_card(title: str, value: str, icon: str, border_color: str = "rgba(255, 183, 3, 0.15)"):
    return f"""
    <div class="sf-card" style="
        border: 1px solid {border_color} !important;
        text-align: center;
        margin-bottom: 15px;
    ">
        <div style="font-size: 2.2rem; margin-bottom: 8px;">{icon}</div>
        <div style="color: #94A3B8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">{title}</div>
        <div style="color: #FFFFFF; font-size: 1.75rem; font-weight: 700; margin-top: 5px; text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);">{value}</div>
    </div>
    """

# --- INITIALIZE CREDENTIALS DATABASE ---
CRED_FILE = "student_credentials.csv"
if not os.path.exists(CRED_FILE):
    pd.DataFrame(columns=["Roll_No", "Email", "Password"]).to_csv(CRED_FILE, index=False)

# --- INITIALIZE CRYPTCONTEXT FOR PASSWORD HASHING ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- SESSION STATE ---
if 'student_logged_in' not in st.session_state:
    st.session_state['student_logged_in'] = False
if 'current_roll_no' not in st.session_state:
    st.session_state['current_roll_no'] = ""

# --- SAFE DATA LOADING ---
@st.cache_data
def load_attendance_data():
    folder = "Attendance_Logs"
    all_data = []
    if os.path.exists(folder):
        for file in os.listdir(folder):
            if file.startswith("Attendance_") and file.endswith(".csv"):
                try:
                    df = pd.read_csv(os.path.join(folder, file))
                    all_data.append(df)
                except: pass
    if all_data:
        master_df = pd.concat(all_data, ignore_index=True)
        return master_df
    return pd.DataFrame()

df = load_attendance_data()

# ==========================================
# 🔒 PAGE 1: AUTHENTICATION (LOGIN & SIGNUP)
# ==========================================
if not st.session_state['student_logged_in']:
    col1, col2, col3 = st.columns([1, 1.8, 1])
    with col2:
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.markdown("""
        <div class="sf-card" style="text-align: center; margin-bottom: -10px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">🎓</div>
            <h2 style="color: #FFB703; margin: 0 0 5px 0;">Student Portal</h2>
            <p style="color: #94A3B8; margin: 0; font-size: 0.95rem;">Secure Academic & Attendance Gateway</p>
        </div>
        """, unsafe_allow_html=True)
        
        tab_login, tab_signup = st.tabs(["🔐 Login", "📝 Create Account"])
        
        # --- LOGIN TAB ---
        with tab_login:
            with st.form("login_form"):
                log_roll = st.text_input("Roll Number (e.g., 25AI024)")
                log_email = st.text_input("Student Email")
                log_pass = st.text_input("Password", type="password")
                login_btn = st.form_submit_button("Secure Login", use_container_width=True)
                
                if login_btn:
                    creds_df = pd.read_csv(CRED_FILE)
                    # Requires all fields to match! Match roll and email first, then verify password.
                    user_records = creds_df[
                        (creds_df['Roll_No'].astype(str) == log_roll) & 
                        (creds_df['Email'] == log_email)
                    ]
                    
                    is_authenticated = False
                    if not user_records.empty:
                        stored_password = str(user_records.iloc[0]['Password'])
                        try:
                            # Verify hashed password
                            is_authenticated = pwd_context.verify(log_pass, stored_password)
                        except Exception:
                            # Fallback to plain text matching for existing legacy records
                            is_authenticated = (stored_password == log_pass)
                    
                    if is_authenticated:
                        st.session_state['student_logged_in'] = True
                        st.session_state['current_roll_no'] = str(user_records.iloc[0]['Roll_No'])
                        st.rerun()
                    else:
                        st.error("❌ Invalid Roll Number, Email, or Password.")

        # --- CREATE ACCOUNT TAB ---
        with tab_signup:
            with st.form("signup_form"):
                st.info("You must be a registered student to create an account.")
                reg_roll = st.text_input("Roll Number (e.g., 25AI024)")
                reg_email = st.text_input("Student Email")
                reg_pass = st.text_input("Create Password", type="password")
                reg_pass_confirm = st.text_input("Confirm Password", type="password")
                signup_btn = st.form_submit_button("Register Account", use_container_width=True)
                
                if signup_btn:
                    if not reg_roll or not reg_email or not reg_pass:
                        st.warning("Please fill out all fields.")
                    elif reg_pass != reg_pass_confirm:
                        st.error("❌ Passwords do not match.")
                    else:
                        if not os.path.exists("students.csv"):
                            st.error("System Error: Master database missing. Contact Admin.")
                        else:
                            master_db = pd.read_csv("students.csv")
                            if reg_roll not in master_db['Roll No'].astype(str).str.strip().tolist():
                                st.error("❌ Registration Denied: Roll Number not found in College records.")
                            else:
                                creds_df = pd.read_csv(CRED_FILE)
                                if reg_roll in creds_df['Roll_No'].astype(str).str.strip().tolist():
                                    st.warning("⚠️ An account already exists for this Roll Number. Please Login.")
                                else:
                                    # Encrypt password using bcrypt hashing
                                    hashed_pass = pwd_context.hash(reg_pass)
                                    new_cred = pd.DataFrame([{"Roll_No": reg_roll, "Email": reg_email, "Password": hashed_pass}])
                                    new_cred.to_csv(CRED_FILE, mode='a', header=False, index=False)
                                    st.success("✅ Account created successfully! You can now Login.")

# ==========================================
# 🔓 PAGE 2: DASHBOARD (AFTER LOGIN)
# ==========================================
else:
    st.sidebar.button("Logout 🚪", on_click=lambda: st.session_state.update(student_logged_in=False, current_roll_no=""), use_container_width=True)
    
    my_roll = st.session_state['current_roll_no']
    
    if df.empty:
        st.info("System offline. No attendance records found.")
    else:
        student_df = df[df['Roll No'].astype(str).str.strip() == my_roll.strip()]
        
        if student_df.empty:
            st.warning(f"No attendance logs found for Roll No: {my_roll}")
        else:
            student_name = student_df['Name'].iloc[0]
            st.title(f"🎓 Welcome back, {student_name}!")
            st.markdown("---")
            
            # --- SPLIT LAYOUT: PHOTO ON LEFT, STATS ON RIGHT ---
            prof_col, stat_col = st.columns([1, 2.5])
            
            with prof_col:
                # Dynamically find their folder and photo!
                folder_name = f"{str(student_name).strip()}_{str(my_roll).strip()}"
                photo_path = os.path.join("dataset", folder_name)
                photo_displayed = False
                
                if os.path.exists(photo_path):
                    images = [f for f in os.listdir(photo_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
                    if images:
                        try:
                            img = Image.open(os.path.join(photo_path, images[0]))
                            st.image(img, caption=f"ID: {my_roll}", use_container_width=True)
                            photo_displayed = True
                        except: pass
                
                if not photo_displayed:
                    st.info("📸 No profile photo found.")
                    st.markdown(f"**Roll Number:** {my_roll}")
            
            with stat_col:
                total_classes = len(student_df)
                present_classes = len(student_df[student_df['Status'] == 'Present'])
                attendance_pct = (present_classes / total_classes) * 100 if total_classes > 0 else 0
                
                st.markdown("### 📊 Your Academic Standing")
                scol1, scol2, scol3 = st.columns(3)
                scol1.markdown(make_kpi_card("Total Sessions Held", str(total_classes), "🏫", "rgba(255, 183, 3, 0.15)"), unsafe_allow_html=True)
                scol2.markdown(make_kpi_card("Sessions Attended", str(present_classes), "✅", "rgba(16, 185, 129, 0.25)"), unsafe_allow_html=True)
                
                status_color = "rgba(16, 185, 129, 0.25)" if attendance_pct >= 75 else ("rgba(255, 183, 3, 0.25)" if attendance_pct >= 60 else "rgba(239, 68, 68, 0.25)")
                scol3.markdown(make_kpi_card("Attendance Rate", f"{attendance_pct:.1f}%", "📈", status_color), unsafe_allow_html=True)
                
                st.markdown("### 🎯 Eligibility Status")
                if attendance_pct >= 75:
                    st.markdown("""
                    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 15px; margin-top: 10px;">
                        <span style="color: #10B981; font-weight: 700; font-size: 1.1rem; display: block; margin-bottom: 5px;">✅ ELIGIBLE</span>
                        <span style="color: #E2E8F0; font-size: 0.95rem;">You meet all biometric requirements for exams and academic standing. Keep it up!</span>
                    </div>
                    """, unsafe_allow_html=True)
                elif attendance_pct >= 60:
                    st.markdown("""
                    <div style="background: rgba(255, 183, 3, 0.1); border: 1px solid rgba(255, 183, 3, 0.3); border-radius: 12px; padding: 15px; margin-top: 10px;">
                        <span style="color: #FFB703; font-weight: 700; font-size: 1.1rem; display: block; margin-bottom: 5px;">⚠️ AT RISK</span>
                        <span style="color: #E2E8F0; font-size: 0.95rem;">Your attendance is dropping near critical thresholds. You must attend upcoming classes to secure your hall ticket.</span>
                    </div>
                    """, unsafe_allow_html=True)
                else:
                    st.markdown("""
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 15px; margin-top: 10px;">
                        <span style="color: #EF4444; font-weight: 700; font-size: 1.1rem; display: block; margin-bottom: 5px;">🚨 CRITICAL SHORTAGE</span>
                        <span style="color: #E2E8F0; font-size: 0.95rem;">You are currently below the required threshold. Please contact your HOD or academic mentor immediately.</span>
                    </div>
                    """, unsafe_allow_html=True)
                    
            st.markdown("---")
            st.markdown("### 📅 Your Recent Logs")
            st.dataframe(student_df[['Date', 'Status']].sort_values(by='Date', ascending=False), use_container_width=True, hide_index=True)
