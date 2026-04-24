import streamlit as st
import pandas as pd
import os
from PIL import Image  # Added this to handle the profile photos!

# --- PAGE CONFIGURATION ---
st.set_page_config(page_title="Student Portal", page_icon="🎓", layout="wide")

# --- INITIALIZE CREDENTIALS DATABASE ---
CRED_FILE = "student_credentials.csv"
if not os.path.exists(CRED_FILE):
    pd.DataFrame(columns=["Roll_No", "Email", "Password"]).to_csv(CRED_FILE, index=False)

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
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("<br><br>", unsafe_allow_html=True)
        st.title("🎓 Student Portal")
        st.markdown("Welcome to the secure student gateway.")
        
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
                    # Requires all 3 fields to match!
                    user_record = creds_df[
                        (creds_df['Roll_No'].astype(str) == log_roll) & 
                        (creds_df['Email'] == log_email) & 
                        (creds_df['Password'] == log_pass)
                    ]
                    
                    if not user_record.empty:
                        st.session_state['student_logged_in'] = True
                        st.session_state['current_roll_no'] = str(user_record.iloc[0]['Roll_No'])
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
                                    new_cred = pd.DataFrame([{"Roll_No": reg_roll, "Email": reg_email, "Password": reg_pass}])
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
                scol1.metric("Total Classes Held", total_classes)
                scol2.metric("Classes Attended", present_classes)
                scol3.metric("Current Percentage", f"{attendance_pct:.1f}%")
                
                st.markdown("### 🎯 Eligibility Status")
                if attendance_pct >= 75:
                    st.success("✅ **ELIGIBLE:** You meet the minimum requirements for exams and sports quotas. Keep it up!")
                elif attendance_pct >= 60:
                    st.warning("⚠️ **AT RISK:** Your attendance is dropping. You must attend upcoming classes to secure your hall ticket.")
                else:
                    st.error("🚨 **CRITICAL SHORTAGE:** You are currently below the required threshold. Please contact your HOD immediately.")
                    
            st.markdown("---")
            st.markdown("### 📅 Your Recent Logs")
            st.dataframe(student_df[['Date', 'Status']].sort_values(by='Date', ascending=False), use_container_width=True, hide_index=True)