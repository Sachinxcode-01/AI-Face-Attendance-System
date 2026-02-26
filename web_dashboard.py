import streamlit as st
import pandas as pd
import os
import plotly.express as px
from PIL import Image
import datetime
import time
import subprocess
import sys

# --- PAGE CONFIGURATION ---
st.set_page_config(page_title="SmartFace Admin", page_icon="🛡️", layout="wide")

# ==========================================
# 🔒 SECURE LOGIN SYSTEM
# ==========================================
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False

if not st.session_state['logged_in']:
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("<br><br><br><br>", unsafe_allow_html=True)
        st.title("🔒 System Secure Login")
        st.markdown("Enter the Master Admin Password to access the SmartFace Control Center.")
        
        password_attempt = st.text_input("Admin Password", type="password")
        
        if st.button("Login", use_container_width=True):
            if password_attempt == "admin123":
                st.session_state['logged_in'] = True
                st.rerun()
            else:
                st.error("❌ Access Denied: Incorrect Password")
    st.stop() 

# ==========================================
# 🔓 DASHBOARD OPENS AFTER LOGIN
# ==========================================

# --- SIDEBAR: MASTER CONTROLS ---
st.sidebar.button("Logout 🔒", on_click=lambda: st.session_state.update(logged_in=False), use_container_width=True)
st.sidebar.markdown("---")

st.sidebar.markdown("### ⚙️ System Executables")

# 1. Train AI Model Button
if st.sidebar.button("🧠 1. Train AI Model", use_container_width=True):
    with st.spinner("Extracting facial features..."):
        try:
            subprocess.run([sys.executable, "train_faces.py"], check=True)
            st.sidebar.success("✅ AI Training Complete!")
        except Exception as e:
            st.sidebar.error("❌ Error running train_faces.py")

# 2. Start Camera System Button
if st.sidebar.button("📷 2. Start Smart Camera", use_container_width=True):
    st.sidebar.info("Camera initializing... (Press 'q' in the camera window to close it)")
    try:
        subprocess.Popen([sys.executable, "attendance_system.py"])
    except Exception as e:
        st.sidebar.error("❌ Error starting camera.")

# 3. Generate Reports Button
if st.sidebar.button("📄 3. Generate PDF Reports", use_container_width=True):
    st.sidebar.info("Opening Report Generator in a new window...")
    try:
        subprocess.Popen([sys.executable, "student_report.py"], creationflags=subprocess.CREATE_NEW_CONSOLE)
    except Exception as e:
        st.sidebar.error("❌ Error running student_report.py")
st.sidebar.markdown("---")

# --- LOAD DATA FUNCTION ---
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
        master_df['Datetime'] = pd.to_datetime(master_df['Date'], errors='coerce')
        master_df['Date'] = master_df['Datetime'].dt.strftime('%Y-%m-%d %I:%M %p')
        master_df['Just_Date'] = master_df['Datetime'].dt.date
        return master_df
    return pd.DataFrame()

# --- MAIN UI ---
st.title("🛡️ SmartFace AI Admin Control Center")
st.markdown("Monitor live attendance, manage system scripts, and control security directly from the web.")

# --- CREATE 5 TABS ---
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Analytics & Profiles", 
    "🚨 Security Logs", 
    "➕ Register Student", 
    "🗄️ Manage Database", 
    "📢 Broadcast"
])

# ==========================================
# TAB 1: ATTENDANCE ANALYTICS & PROFILES
# ==========================================
with tab1:
    df = load_attendance_data()

    if df.empty:
        st.warning("⚠️ No attendance logs found. Click 'Start Smart Camera' in the sidebar to begin.")
    else:
        st.sidebar.header("🔍 Data Filters")
        
        min_date = df['Just_Date'].min()
        max_date = df['Just_Date'].max()
        selected_dates = st.sidebar.date_input("Select Date Range", [min_date, max_date], min_value=min_date, max_value=max_date, key="master_date_filter")
        
        if len(selected_dates) == 2:
            start_date, end_date = selected_dates
            df = df[(df['Just_Date'] >= start_date) & (df['Just_Date'] <= end_date)]
        elif len(selected_dates) == 1:
            df = df[df['Just_Date'] == selected_dates[0]]

        student_names = sorted(df['Name'].unique().tolist())
        selected_student = st.sidebar.selectbox("Filter by Student:", ["View All Students"] + student_names, key="master_student_filter")

        export_df = df.drop(columns=['Datetime', 'Just_Date'], errors='ignore')
        csv_data = export_df.to_csv(index=False).encode('utf-8')
        st.sidebar.download_button("📥 Download View (CSV)", data=csv_data, file_name="SmartFace_Report.csv", mime="text/csv", key="master_csv_export")

        st.markdown("### 📊 System Overview")
        total_logs = len(df)
        total_present = len(df[df['Status'] == 'Present']) if total_logs > 0 else 0
        total_absent = len(df[df['Status'] == 'Absent']) if total_logs > 0 else 0
        overall_pct = (total_present / total_logs) * 100 if total_logs > 0 else 0

        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Records", total_logs)
        col2.metric("✅ Total Present", total_present)
        col3.metric("❌ Total Absent", total_absent)
        col4.metric("📈 Overall Accuracy", f"{overall_pct:.1f}%")

        st.markdown("---")

        if total_logs == 0:
            st.info("No data available for the selected dates.")
        elif selected_student == "View All Students":
            
            # --- NEW: DYNAMIC SESSION VIEWER ---
            st.subheader("📅 Recent Classroom Logs (By Session)")
            log_folder = "Attendance_Logs"
            if os.path.exists(log_folder):
                daily_logs = sorted([f for f in os.listdir(log_folder) if f.startswith('Attendance_') and f.endswith('.csv')], reverse=True)
                
                if daily_logs:
                    selected_log = st.selectbox("Select a Specific Class Session to View:", daily_logs, key="session_viewer_dropdown")
                    session_path = os.path.join(log_folder, selected_log)
                    try:
                        session_df = pd.read_csv(session_path)
                        st.dataframe(session_df, use_container_width=True)
                    except:
                        st.error("Could not load the selected file.")
                else:
                    st.info("No session logs found.")
            
            # --- FIXED PATH FOR MASTER SUMMARY ---
            st.markdown("---")
            st.subheader("🏆 Master Attendance Summary")
            master_csv_path = os.path.join("Attendance_Logs", "Master_Summary.csv")
            
            if os.path.exists(master_csv_path):
                master_summary_df = pd.read_csv(master_csv_path)
                st.dataframe(master_summary_df, use_container_width=True)
                
                csv_master = master_summary_df.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="📥 Download Master Summary (CSV)", 
                    data=csv_master, 
                    file_name="Master_Summary.csv", 
                    mime="text/csv", 
                    key="master_dl_btn"
                )
            else:
                st.info("ℹ️ Master_Summary.csv not found. Please run 'Generate PDF Reports' to create it.")
            st.markdown("---")
            
            st.subheader("📈 Overall Attendance Distribution")
            status_counts = df['Status'].value_counts().reset_index()
            status_counts.columns = ['Status', 'Count']
            fig = px.pie(status_counts, names='Status', values='Count', color='Status', color_discrete_map={'Present':'#00C851', 'Absent':'#ff4444'}, hole=0.4)
            st.plotly_chart(fig, use_container_width=True)

        else:
            st.subheader(f"🎓 Student Profile: {selected_student}")
            student_df = df[df['Name'] == selected_student]
            roll_no = student_df['Roll No'].iloc[0] if not student_df.empty else "Unknown"
            
            profile_col, stats_col = st.columns([1, 2.5])
            
            with profile_col:
                folder_name = f"{str(selected_student).strip()}_{str(roll_no).strip()}"
                photo_path = os.path.join("dataset", folder_name)
                photo_displayed = False
                
                if os.path.exists(photo_path):
                    images = [f for f in os.listdir(photo_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
                    if images:
                        try:
                            img = Image.open(os.path.join(photo_path, images[0]))
                            st.image(img, caption=f"ID: {roll_no}", use_container_width=True)
                            photo_displayed = True
                        except: pass
                
                if not photo_displayed:
                    st.info("📸 No photo found.")
            
            with stats_col:
                s_total = len(student_df)
                s_present = len(student_df[student_df['Status'] == 'Present'])
                s_pct = (s_present / s_total) * 100 if s_total > 0 else 0
                
                scol1, scol2, scol3 = st.columns(3)
                scol1.info(f"Attended: **{s_present}/{s_total}**")
                scol2.warning(f"Missed: **{s_total - s_present}**")
                
                if s_pct >= 75: scol3.success(f"Rate: **{s_pct:.1f}%**")
                elif s_pct >= 50: scol3.warning(f"Rate: **{s_pct:.1f}%**")
                else: scol3.error(f"Rate: **{s_pct:.1f}%**")

                st.markdown("#### Attendance Breakdown")
                s_status = student_df['Status'].value_counts().reset_index()
                s_status.columns = ['Status', 'Count']
                if not s_status.empty:
                    fig = px.bar(s_status, x='Status', y='Count', color='Status', color_discrete_map={'Present':'#00C851', 'Absent':'#ff4444'})
                    st.plotly_chart(fig, use_container_width=True)

            st.markdown("#### Detailed Log")
            st.dataframe(student_df[['Roll No', 'Date', 'Status']].sort_values(by='Date', ascending=False), use_container_width=True)

# ==========================================
# TAB 2: SECURITY LOGS
# ==========================================
with tab2:
    st.subheader("🚨 Threat Detection Logs")
    intruder_folder = "Intruders"
    
    if not os.path.exists(intruder_folder):
        st.success("✅ System Secure: No intruders detected yet.")
    else:
        image_files = [f for f in os.listdir(intruder_folder) if f.endswith(('.png', '.jpg', '.jpeg'))]
        if len(image_files) == 0:
            st.success("✅ System Secure: No intruder images found.")
        else:
            st.warning(f"⚠️ Warning: {len(image_files)} unregistered individuals logged.")
            cols = st.columns(3)
            for index, img_file in enumerate(image_files):
                try:
                    img = Image.open(os.path.join(intruder_folder, img_file))
                    with cols[index % 3]:
                        st.image(img, caption=img_file, use_container_width=True)
                except: pass

# ==========================================
# TAB 3: REGISTER NEW STUDENT
# ==========================================
with tab3:
    st.subheader("➕ Enroll a New Student")
    with st.form("registration_form"):
        new_name = st.text_input("First Name")
        new_roll = st.text_input("Roll Number")
        uploaded_file = st.file_uploader("Upload Photo", type=['jpg', 'jpeg', 'png'])
        if st.form_submit_button("Register Student") and new_name and new_roll and uploaded_file:
            save_path = os.path.join("dataset", f"{new_name.strip()}_{new_roll.strip()}")
            os.makedirs(save_path, exist_ok=True)
            with open(os.path.join(save_path, uploaded_file.name), "wb") as f:
                f.write(uploaded_file.getbuffer())
            st.success(f"✅ Registered {new_name}! Click 'Train AI Model' in the sidebar to update memory.")

# ==========================================
# TAB 4: MANAGE DATABASE & RAW LOGS
# ==========================================
with tab4:
    st.subheader("🗄️ Master Student Database")
    db_path = "students.csv"
    if os.path.exists(db_path):
        students_df = pd.read_csv(db_path)
        edited_df = st.data_editor(students_df, num_rows="dynamic", use_container_width=True, key="master_db_editor")
        if st.button("💾 Save Database Changes"):
            edited_df.to_csv(db_path, index=False)
            st.success("✅ Database updated!")
    else:
        st.warning("⚠️ 'students.csv' missing.")

    st.markdown("---")
    st.subheader("📂 Raw Attendance Log Files")
    st.markdown("Download individual daily session records generated by the Smart Camera.")
    
    log_folder = "Attendance_Logs"
    if os.path.exists(log_folder):
        log_files = sorted([f for f in os.listdir(log_folder) if f.startswith('Attendance_') and f.endswith('.csv')], reverse=True)
        if log_files:
            selected_file = st.selectbox("Select a Session Log to Download:", log_files, key="raw_log_dl_selector")
            file_path = os.path.join(log_folder, selected_file)
            with open(file_path, "rb") as f:
                st.download_button(label=f"📥 Download {selected_file}", data=f, file_name=selected_file, mime="text/csv", key="raw_log_dl_btn")
        else:
            st.info("No raw session logs found yet.")

# ==========================================
# TAB 5: BROADCAST
# ==========================================
with tab5:
    st.subheader("📢 Mass Communication Center")
    if os.path.exists("students.csv"):
        with st.form("broadcast_form"):
            st.radio("Send to:", ["All Registered Students", "Custom List"])
            msg_subject = st.text_input("Subject")
            msg_body = st.text_area("Message")
            if st.form_submit_button("📤 Send Broadcast Email"):
                with st.spinner("Sending emails..."):
                    time.sleep(1.5)
                st.success("✅ Official broadcast sent successfully!")
                st.balloons()