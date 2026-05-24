import streamlit as st
import pandas as pd
import os
import plotly.express as px
from PIL import Image
import datetime
import time
import subprocess
import sys

# ── Setup absolute paths and path routing ──────────────────────────────────
# This ensures that no matter where the dashboard is started from, the system 
# is robust, imports core modules like ai_analyst, and points to data correctly.
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_WORKSPACE_ROOT = os.path.dirname(_CURRENT_DIR)

_CORE_DIR = os.path.join(_WORKSPACE_ROOT, "core")
_DATA_DIR = os.path.join(_WORKSPACE_ROOT, "data")
_ADMIN_DIR = os.path.join(_WORKSPACE_ROOT, "smartface_admin")

# Route sys.path so imports work cleanly
if _CORE_DIR not in sys.path:
    sys.path.insert(0, _CORE_DIR)
if _ADMIN_DIR not in sys.path:
    sys.path.insert(0, _ADMIN_DIR)

# Detect if running on Streamlit Cloud
_IS_CLOUD = not os.path.exists(os.path.join(_WORKSPACE_ROOT, ".env"))

# Switch working directory to _DATA_DIR so all relative file lookups (CSV logs, students.csv, etc.)
# resolve inside the 'data/' folder where they are stored, but first load environment variables
# from the workspace root safely.
from dotenv import load_dotenv
if os.path.exists(os.path.join(_WORKSPACE_ROOT, ".env")):
    load_dotenv(os.path.join(_WORKSPACE_ROOT, ".env"))

if os.path.exists(_DATA_DIR):
    os.chdir(_DATA_DIR)

# Executive script paths
train_faces_path = os.path.join(_CORE_DIR, "train_faces.py")
attendance_system_path = os.path.join(_CORE_DIR, "attendance_system.py")
student_report_path = os.path.join(_ADMIN_DIR, "student_report.py")
dean_report_path = os.path.join(_ADMIN_DIR, "dean_report.py")

# ── Optional Windows-only imports ──────────────────────────────────────────
try:
    import pyttsx3
    _TTS_AVAILABLE = True
except ImportError:
    _TTS_AVAILABLE = False

try:
    import pywhatkit
    _WHATSAPP_AVAILABLE = True
except ImportError:
    _WHATSAPP_AVAILABLE = False

# ── AI Analyst (graceful fallback if Gemini key missing) ───────────────────
try:
    import ai_analyst
    _AI_AVAILABLE = True
except Exception:
    _AI_AVAILABLE = False

# ── Secrets: st.secrets (cloud) or .env (local) ────────────────────────────
def _get_secret(key: str, default: str = "") -> str:
    try:
        return st.secrets[key]
    except Exception:
        return os.getenv(key, default)

ADMIN_PASSWORD  = _get_secret("ADMIN_PASSWORD", "admin123")
SENDER_EMAIL    = _get_secret("SENDER_EMAIL",   "saxhin0708@gmail.com")
SENDER_PASSWORD = _get_secret("EMAIL_PASSWORD", "")

# ── Voice helper ───────────────────────────────────────────────────────────
def nexa_speak(text: str):
    if not _TTS_AVAILABLE:
        st.info("🔊 Voice unavailable in cloud mode.")
        return
    engine = pyttsx3.init()
    engine.setProperty("rate", 150)
    engine.say(text)
    engine.runAndWait()

# ══════════════════════════════════════════════════════════════════════════
# PAGE CONFIG
# ══════════════════════════════════════════════════════════════════════════
st.set_page_config(page_title="SmartAttendance - AI Admin", page_icon="🛡️", layout="wide")

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
    
    /* Outlined/Secondary Sidebar Buttons */
    [data-testid="stSidebar"] .stButton > button {
        background: transparent !important;
        color: #FFB703 !important;
        border: 1.5px solid rgba(255, 183, 3, 0.4) !important;
        box-shadow: none !important;
        border-radius: 12px !important;
    }
    
    [data-testid="stSidebar"] .stButton > button:hover {
        background: rgba(255, 183, 3, 0.08) !important;
        border-color: #FFB703 !important;
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
    
    /* File Uploader area styling */
    [data-testid="stFileUploader"] {
        background-color: rgba(255, 255, 255, 0.02) !important;
        border: 1.5px dashed rgba(255, 183, 3, 0.2) !important;
        border-radius: 16px !important;
        padding: 20px !important;
    }
    
    /* Pulse Green Operational Indicator Animation */
    .pulse-dot {
        width: 10px;
        height: 10px;
        background-color: #10B981;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        animation: pulse-green 2s infinite;
        vertical-align: middle;
        margin-right: 8px;
    }
    
    @keyframes pulse-green {
        0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
        }
        70% {
            transform: scale(1);
            box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
        }
        100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
        }
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

# ══════════════════════════════════════════════════════════════════════════
# LOGIN
# ══════════════════════════════════════════════════════════════════════════
if "logged_in" not in st.session_state:
    st.session_state["logged_in"] = False

if not st.session_state["logged_in"]:
    col1, col2, col3 = st.columns([1, 1.8, 1])
    with col2:
        st.markdown("<br><br><br>", unsafe_allow_html=True)
        st.markdown("""
        <div class="sf-card" style="text-align: center; margin-bottom: -10px;">
            <div style="font-size: 3rem; margin-bottom: 10px;">🛡️</div>
            <h2 style="color: #FFB703; margin: 0 0 5px 0;">Master Control Center</h2>
            <p style="color: #94A3B8; margin: 0; font-size: 0.95rem;">SmartFace Attendance Biometric Suite</p>
        </div>
        """, unsafe_allow_html=True)
        with st.form("admin_login_form"):
            password_attempt = st.text_input("Enter Admin Credentials", type="password", placeholder="Master Password")
            submit = st.form_submit_button("Authenticate Secure System ⚡", use_container_width=True)
            if submit:
                if password_attempt == ADMIN_PASSWORD:
                    st.session_state["logged_in"] = True
                    st.rerun()
                else:
                    st.error("❌ Access Denied: Incorrect Master Password")
    st.stop()

# ══════════════════════════════════════════════════════════════════════════
# SIDEBAR
# ══════════════════════════════════════════════════════════════════════════
st.sidebar.button("Logout 🔒", on_click=lambda: st.session_state.update(logged_in=False), use_container_width=True)
mobile_mode = st.sidebar.toggle("📱 Mobile Mode", help="Simplifies the UI for smartphones.")
st.sidebar.markdown("---")
st.sidebar.markdown("### ⚙️ System Executables")

if _IS_CLOUD:
    st.sidebar.info("⚠️ Camera & training scripts are only available when running locally.")
else:
    if st.sidebar.button("🧠 1. Train AI Model", use_container_width=True):
        with st.spinner("Extracting facial features..."):
            try:
                subprocess.run([sys.executable, train_faces_path], check=True)
                st.sidebar.success("✅ AI Training Complete!")
            except Exception as e:
                st.sidebar.error(f"❌ Error: {e}")

    if st.sidebar.button("📷 2. Start Smart Camera", use_container_width=True):
        st.sidebar.info("Camera initializing... (Press 'q' in the camera window to close it)")
        try:
            subprocess.Popen([sys.executable, attendance_system_path])
        except Exception as e:
            st.sidebar.error(f"❌ Error: {e}")

    if st.sidebar.button("📄 3. Generate PDF Reports", use_container_width=True):
        st.sidebar.info("Opening Report Generator...")
        try:
            subprocess.Popen([sys.executable, student_report_path], creationflags=subprocess.CREATE_NEW_CONSOLE)
        except Exception as e:
            st.sidebar.error(f"❌ Error: {e}")

    if st.sidebar.button("📊 4. Send Dean's Report", use_container_width=True):
        with st.spinner("Analyzing Academic Insights..."):
            try:
                result = subprocess.run([sys.executable, dean_report_path], capture_output=True, text=True)
                if result.returncode == 0:
                    st.sidebar.success(f"✅ {result.stdout.strip()}")
                else:
                    st.sidebar.error(f"❌ {result.stderr.strip()}")
            except Exception as e:
                st.sidebar.error(f"❌ Error: {e}")

st.sidebar.markdown("---")

# ── Refresh button clears stale cache ──────────────────────────────────────
if st.sidebar.button("🔄 Refresh Data", use_container_width=True):
    st.cache_data.clear()
    st.rerun()

# ══════════════════════════════════════════════════════════════════════════
# DATA LOADER
# ══════════════════════════════════════════════════════════════════════════
@st.cache_data(ttl=60)
def load_attendance_data():
    folder = "Attendance_Logs"
    all_data = []
    if os.path.exists(folder):
        for file in os.listdir(folder):
            if file.startswith("Attendance_") and file.endswith(".csv"):
                try:
                    all_data.append(pd.read_csv(os.path.join(folder, file)))
                except Exception:
                    pass
    if all_data:
        master_df = pd.concat(all_data, ignore_index=True)
        master_df["Datetime"] = pd.to_datetime(master_df["Date"], errors="coerce")
        master_df["Date"] = master_df["Datetime"].dt.strftime("%Y-%m-%d %I:%M %p")
        master_df["Just_Date"] = master_df["Datetime"].dt.date
        return master_df
    return pd.DataFrame()

# ══════════════════════════════════════════════════════════════════════════
# MAIN HEADER
# ══════════════════════════════════════════════════════════════════════════
st.markdown("""
<div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255, 183, 3, 0.15); padding-bottom: 20px; margin-bottom: 30px; flex-wrap: wrap; gap: 15px;">
    <div>
        <h1 style="margin: 0; color: #FFFFFF; font-size: 2.3rem; text-shadow: 0 0 20px rgba(255, 183, 3, 0.1);">🛡️ SmartAttendance</h1>
        <p style="margin: 5px 0 0 0; color: #94A3B8; font-size: 1rem;">Next-Gen Biometric Security Suite & Admin Control Center</p>
    </div>
    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); padding: 8px 16px; border-radius: 50px; display: flex; align-items: center;">
        <span class="pulse-dot"></span>
        <span style="color: #10B981; font-weight: 600; font-size: 0.85rem; font-family: 'Outfit', sans-serif; letter-spacing: 0.5px;">SYSTEM OPERATIONAL</span>
    </div>
</div>
""", unsafe_allow_html=True)

tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([
    "📊 Analytics & Profiles",
    "🚨 Security Logs",
    "➕ Register Student",
    "🗄️ Manage Database",
    "📢 Broadcast",
    "🧠 AI Command Center",
])

# ══════════════════════════════════════════════════════════════════════════
# TAB 1 – ANALYTICS & PROFILES
# ══════════════════════════════════════════════════════════════════════════
with tab1:
    df = load_attendance_data()

    if df.empty:
        st.warning("⚠️ No attendance logs found. Run the Smart Camera locally to begin.")
    else:
        st.sidebar.header("🔍 Data Filters")
        min_date = df["Just_Date"].min()
        max_date = df["Just_Date"].max()
        selected_dates = st.sidebar.date_input(
            "Select Date Range", [min_date, max_date],
            min_value=min_date, max_value=max_date, key="master_date_filter"
        )
        if len(selected_dates) == 2:
            df = df[(df["Just_Date"] >= selected_dates[0]) & (df["Just_Date"] <= selected_dates[1])]
        elif len(selected_dates) == 1:
            df = df[df["Just_Date"] == selected_dates[0]]

        student_names = sorted(df["Name"].unique().tolist())
        selected_student = st.sidebar.selectbox(
            "Filter by Student:", ["View All Students"] + student_names, key="master_student_filter"
        )

        export_df = df.drop(columns=["Datetime", "Just_Date"], errors="ignore")
        st.sidebar.download_button(
            "📥 Download View (CSV)",
            data=export_df.to_csv(index=False).encode("utf-8"),
            file_name="SmartAttendance - AI_Report.csv",
            mime="text/csv",
            key="master_csv_export",
        )

        # ── KPIs ───────────────────────────────────────────────────────────
        st.markdown("### 📊 System Overview")
        total_logs    = len(df)
        total_present = len(df[df["Status"] == "Present"]) if total_logs > 0 else 0
        total_absent  = len(df[df["Status"] == "Absent"])  if total_logs > 0 else 0
        overall_pct   = (total_present / total_logs) * 100  if total_logs > 0 else 0

        c1, c2, c3, c4 = st.columns(4)
        c1.markdown(make_kpi_card("Total Logs", str(total_logs), "🗃️"), unsafe_allow_html=True)
        c2.markdown(make_kpi_card("Total Present", str(total_present), "✅", "rgba(16, 185, 129, 0.25)"), unsafe_allow_html=True)
        c3.markdown(make_kpi_card("Total Absent", str(total_absent), "❌", "rgba(239, 68, 68, 0.25)"), unsafe_allow_html=True)
        
        status_pct_color = "rgba(16, 185, 129, 0.25)" if overall_pct >= 75 else ("rgba(255, 183, 3, 0.25)" if overall_pct >= 50 else "rgba(239, 68, 68, 0.25)")
        c4.markdown(make_kpi_card("Attendance Rate", f"{overall_pct:.1f}%", "📈", status_pct_color), unsafe_allow_html=True)
        st.markdown("---")

        if total_logs == 0:
            st.info("No data for selected dates.")

        elif selected_student == "View All Students":
            # Session viewer
            st.subheader("📅 Recent Classroom Logs (By Session)")
            log_folder = "Attendance_Logs"
            if os.path.exists(log_folder):
                daily_logs = sorted(
                    [f for f in os.listdir(log_folder) if f.startswith("Attendance_") and f.endswith(".csv")],
                    reverse=True,
                )
                if daily_logs:
                    sel = st.selectbox("Select a Session:", daily_logs, key="session_viewer_dropdown")
                    try:
                        st.dataframe(pd.read_csv(os.path.join(log_folder, sel)), use_container_width=True)
                    except Exception:
                        st.error("Could not load the selected file.")

            # Master summary
            st.markdown("---")
            st.subheader("🏆 Master Attendance Summary")
            master_csv = os.path.join("Attendance_Logs", "Master_Summary.csv")
            if os.path.exists(master_csv):
                msdf = pd.read_csv(master_csv)
                st.dataframe(msdf, use_container_width=True)
                st.download_button(
                    "📥 Download Master Summary",
                    data=msdf.to_csv(index=False).encode("utf-8"),
                    file_name="Master_Summary.csv",
                    mime="text/csv",
                    key="master_dl_btn",
                )
            else:
                st.info("ℹ️ Master_Summary.csv not found. Generate PDF Reports locally first.")
            st.markdown("---")

            if not mobile_mode:
                st.subheader("📈 Overall Attendance Distribution")
                sc = df["Status"].value_counts().reset_index()
                sc.columns = ["Status", "Count"]
                fig = px.pie(sc, names="Status", values="Count", hole=0.4,
                             color="Status",
                             color_discrete_map={"Present": "#10B981", "Absent": "#EF4444"})
                fig.update_layout(
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    font=dict(color="#E2E8F0", family="Outfit, Inter, sans-serif"),
                    legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
                )
                st.plotly_chart(fig, use_container_width=True)

                # Heatmap
                st.markdown("---")
                st.subheader("🔥 Attendance Density Heatmap")
                try:
                    hm = df.copy()
                    hm["Day"]  = hm["Datetime"].dt.day_name()
                    hm["Hour"] = hm["Datetime"].dt.hour
                    day_order  = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
                    pivot      = hm.groupby(["Day","Hour"]).size().reset_index(name="Records")
                    fig_hm = px.density_heatmap(
                        pivot, x="Hour", y="Day", z="Records",
                        category_orders={"Day": day_order},
                        color_continuous_scale=[[0.0, "#0A0F24"], [0.5, "#FFB703"], [1.0, "#EF4444"]],
                        title="System Activity Heatmap",
                    )
                    fig_hm.update_layout(
                        xaxis=dict(tickmode="linear", tick0=0, dtick=1),
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        font=dict(color="#E2E8F0", family="Outfit, Inter, sans-serif")
                    )
                    st.plotly_chart(fig_hm, use_container_width=True)
                    st.info("💡 Darkest areas = peak attendance times.")
                except Exception:
                    st.info("ℹ️ More historical data required for the heatmap.")
            else:
                st.info("📱 Mobile Mode: charts hidden to save battery.")

        else:
            # ── Student Profile ────────────────────────────────────────────
            st.subheader(f"🎓 Student Profile: {selected_student}")
            sdf     = df[df["Name"] == selected_student]
            roll_no = sdf["Roll No"].iloc[0] if not sdf.empty else "Unknown"

            profile_col, stats_col = st.columns([1, 2.5])
            with profile_col:
                folder_name = f"{str(selected_student).strip()}_{str(roll_no).strip()}"
                photo_path  = os.path.join("dataset", folder_name)
                shown = False
                if os.path.exists(photo_path):
                    images = [f for f in os.listdir(photo_path) if f.lower().endswith((".jpg",".jpeg",".png"))]
                    if images:
                        try:
                            st.image(Image.open(os.path.join(photo_path, images[0])),
                                     caption=f"ID: {roll_no}", use_container_width=True)
                            shown = True
                        except Exception:
                            pass
                if not shown:
                    st.info("📸 No photo found.")

            with stats_col:
                s_total   = len(sdf)
                s_present = len(sdf[sdf["Status"] == "Present"])
                s_pct     = (s_present / s_total) * 100 if s_total > 0 else 0

                sc1, sc2, sc3 = st.columns(3)
                sc1.markdown(make_kpi_card("Classes Attended", f"{s_present}/{s_total}", "📅", "rgba(16, 185, 129, 0.25)"), unsafe_allow_html=True)
                sc2.markdown(make_kpi_card("Classes Missed", f"{s_total - s_present}", "❌", "rgba(239, 68, 68, 0.25)"), unsafe_allow_html=True)
                
                status_color = "rgba(16, 185, 129, 0.25)" if s_pct >= 75 else ("rgba(255, 183, 3, 0.25)" if s_pct >= 50 else "rgba(239, 68, 68, 0.25)")
                sc3.markdown(make_kpi_card("Attendance Rate", f"{s_pct:.1f}%", "📈", status_color), unsafe_allow_html=True)

                st.markdown("---")
                if _TTS_AVAILABLE:
                    if st.button(f"🔊 Have Nexa Read Report for {selected_student}", use_container_width=True):
                        st.info("Nexa is speaking...")
                        nexa_speak(
                            f"Attendance report for {selected_student}. "
                            f"Out of {s_total} total classes, attended {s_present}. "
                            f"Rate is {s_pct:.1f} percent."
                        )
                st.markdown("---")
                st.markdown("#### Attendance Breakdown")
                s_stat = sdf["Status"].value_counts().reset_index()
                s_stat.columns = ["Status","Count"]
                if not s_stat.empty:
                    fig = px.bar(s_stat, x="Status", y="Count", color="Status",
                                 color_discrete_map={"Present":"#10B981","Absent":"#EF4444"})
                    fig.update_layout(
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        font=dict(color="#E2E8F0", family="Outfit, Inter, sans-serif")
                    )
                    st.plotly_chart(fig, use_container_width=True)

            st.markdown("#### Detailed Log")
            st.dataframe(
                sdf[["Roll No","Date","Status"]].sort_values("Date", ascending=False),
                use_container_width=True,
            )

# ══════════════════════════════════════════════════════════════════════════
# TAB 2 – SECURITY LOGS
# ══════════════════════════════════════════════════════════════════════════
with tab2:
    st.subheader("🚨 Threat Detection Logs")
    intruder_folder = "Intruders"
    if not os.path.exists(intruder_folder):
        st.success("✅ System Secure: No intruders detected yet.")
    else:
        image_files = sorted(
            [f for f in os.listdir(intruder_folder) if f.lower().endswith((".png",".jpg",".jpeg"))],
            reverse=True,
        )
        if not image_files:
            st.success("✅ System Secure: No intruder images found.")
        else:
            st.warning(f"⚠️ {len(image_files)} unregistered individual(s) logged.")
            cols = st.columns(3)
            for i, img_file in enumerate(image_files):
                with cols[i % 3]:
                    try:
                        st.image(Image.open(os.path.join(intruder_folder, img_file)),
                                 caption=img_file, use_container_width=True)
                        if not _IS_CLOUD:
                            if st.button(f"🗑️ Delete", key=f"del_{img_file}"):
                                os.remove(os.path.join(intruder_folder, img_file))
                                st.rerun()
                    except Exception:
                        pass

# ══════════════════════════════════════════════════════════════════════════
# TAB 3 – REGISTER STUDENT
# ══════════════════════════════════════════════════════════════════════════
with tab3:
    st.subheader("➕ Enroll a New Student")
    if _IS_CLOUD:
        st.info("📁 Photo uploads are saved to the cloud filesystem (ephemeral). For permanent enrollment, register locally and push your dataset.")
    with st.form("registration_form"):
        new_name = st.text_input("First Name")
        new_roll = st.text_input("Roll Number")
        uploaded_files = st.file_uploader(
            "Upload Photo(s) — upload multiple angles for better accuracy",
            type=["jpg","jpeg","png"],
            accept_multiple_files=True,
        )
        if st.form_submit_button("Register Student") and new_name and new_roll and uploaded_files:
            save_path = os.path.join("dataset", f"{new_name.strip()}_{new_roll.strip()}")
            os.makedirs(save_path, exist_ok=True)
            for uf in uploaded_files:
                with open(os.path.join(save_path, uf.name), "wb") as f:
                    f.write(uf.getbuffer())
            st.success(f"✅ Registered {new_name} with {len(uploaded_files)} photo(s)! Run 'Train AI Model' locally to update memory.")

# ══════════════════════════════════════════════════════════════════════════
# TAB 4 – MANAGE DATABASE
# ══════════════════════════════════════════════════════════════════════════
with tab4:
    st.subheader("🗄️ Master Student Database")
    db_path = "students.csv"
    if os.path.exists(db_path):
        students_df = pd.read_csv(db_path)
        edited_df   = st.data_editor(students_df, num_rows="dynamic", use_container_width=True, key="master_db_editor")
        if st.button("💾 Save Database Changes"):
            edited_df.to_csv(db_path, index=False)
            st.success("✅ Database updated!")
    else:
        st.warning("⚠️ 'students.csv' missing.")

    st.markdown("---")
    st.subheader("📂 Raw Attendance Log Files")
    log_folder = "Attendance_Logs"
    if os.path.exists(log_folder):
        log_files = sorted(
            [f for f in os.listdir(log_folder) if f.startswith("Attendance_") and f.endswith(".csv")],
            reverse=True,
        )
        if log_files:
            sel_file = st.selectbox("Select Session Log:", log_files, key="raw_log_dl_selector")
            file_path = os.path.join(log_folder, sel_file)
            with open(file_path, "rb") as f:
                st.download_button(f"📥 Download {sel_file}", data=f, file_name=sel_file, mime="text/csv", key="raw_log_dl_btn")
        else:
            st.info("No raw session logs found yet.")

# ══════════════════════════════════════════════════════════════════════════
# TAB 5 – BROADCAST
# ══════════════════════════════════════════════════════════════════════════
with tab5:
    st.subheader("📢 Mass Communication & Alerts")
    comm_tab1, comm_tab2 = st.tabs(["📧 Email Broadcast", "📱 WhatsApp Parent Alerts"])

    with comm_tab1:
        st.info("📧 Email broadcast sends via SMTP using your configured credentials.")
        if os.path.exists("students.csv"):
            with st.form("broadcast_form"):
                st.radio("Send Email to:", ["All Registered Students", "Custom List"])
                msg_subject = st.text_input("Subject")
                msg_body    = st.text_area("Message")
                if st.form_submit_button("📤 Send Broadcast Email"):
                    if not SENDER_PASSWORD:
                        st.error("❌ EMAIL_PASSWORD not set. Add it to Streamlit Secrets.")
                    elif not msg_subject or not msg_body:
                        st.warning("Please fill in Subject and Message.")
                    else:
                        import smtplib
                        from email.message import EmailMessage
                        try:
                            sdf2 = pd.read_csv("students.csv")
                            emails = sdf2["Email"].dropna().tolist() if "Email" in sdf2.columns else []
                            sent = 0
                            for em in emails:
                                if "@" in str(em) and "update_email" not in str(em):
                                    m = EmailMessage()
                                    m["Subject"] = msg_subject
                                    m["From"]    = SENDER_EMAIL
                                    m["To"]      = em
                                    m.set_content(msg_body)
                                    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as srv:
                                        srv.login(SENDER_EMAIL, SENDER_PASSWORD)
                                        srv.send_message(m)
                                    sent += 1
                            st.success(f"✅ Email sent to {sent} student(s)!")
                            st.balloons()
                        except Exception as e:
                            st.error(f"❌ Failed: {e}")
        else:
            st.warning("⚠️ 'students.csv' missing.")

    with comm_tab2:
        st.markdown("#### 🚨 Send Automated Absence Alert to Parents")
        if not _WHATSAPP_AVAILABLE or _IS_CLOUD:
            st.warning("⚠️ WhatsApp alerts require `pywhatkit` and a **local** browser session. This feature is only available when running locally.")
        elif os.path.exists("students.csv"):
            s_df = pd.read_csv("students.csv")
            if "Parent_Phone" in s_df.columns:
                target = st.selectbox("Select Absent Student:", s_df["Name"].tolist())
                default_msg = (
                    f"URGENT: Dear Parent, your ward {target} has been marked ABSENT today. "
                    "Please ensure regular attendance — Rural Engineering College."
                )
                wa_msg = st.text_area("WhatsApp Message:", value=default_msg, height=100)
                if st.button("🚀 Send WhatsApp Alert", use_container_width=True):
                    phone = str(s_df[s_df["Name"] == target]["Parent_Phone"].iloc[0])
                    if pd.isna(phone) or not phone.strip():
                        st.error("❌ No phone number in database.")
                    else:
                        st.info("Opening WhatsApp Web… DO NOT touch mouse/keyboard!")
                        try:
                            pywhatkit.sendwhatmsg_instantly(phone, wa_msg, wait_time=15, tab_close=True, close_time=3)
                            st.success("✅ Alert sent!")
                        except Exception as e:
                            st.error(f"❌ {e}")
            else:
                st.error("⚠️ 'students.csv' needs a 'Parent_Phone' column.")

# ══════════════════════════════════════════════════════════════════════════
# TAB 6 – AI COMMAND CENTER
# ══════════════════════════════════════════════════════════════════════════
with tab6:
    st.header("🧠 AI Attendance Command Center")
    st.markdown("Powered by Google Gemini. Get deep insights and talk to your attendance data.")

    if not _AI_AVAILABLE:
        st.error("❌ AI module unavailable. Check that `GOOGLE_API_KEY` is set in Secrets.")
    elif df.empty:
        st.warning("No data available for AI analysis. Capture attendance logs first.")
    else:
        ai_col1, ai_col2 = st.columns(2)

        with ai_col1:
            st.subheader("📊 Intelligent Data Analysis")
            if st.button("✨ Generate AI Performance Report", use_container_width=True):
                with st.spinner("Gemini is analyzing your records..."):
                    summary = ai_analyst.get_attendance_summary(df)
                st.markdown("### 📝 AI Analysis Report")
                st.markdown(summary)

            st.markdown("---")
            st.subheader("🎓 Personalized Student Advice")
            student_to_advise = st.selectbox("Select Student:", student_names, key="ai_student_feedback")
            if st.button(f"💡 Get AI Advice for {student_to_advise}", use_container_width=True):
                with st.spinner(f"Analyzing {student_to_advise}'s patterns..."):
                    advice = ai_analyst.get_student_report_insight(
                        student_to_advise, df[df["Name"] == student_to_advise]
                    )
                st.info(advice)

        with ai_col2:
            st.subheader("💬 Chat with your Data")
            st.markdown("Ask: *'Who missed the most classes?'* or *'Show trends for Monday.'*")
            if "ai_chat_history" not in st.session_state:
                st.session_state.ai_chat_history = []
            user_query = st.text_input("Ask Gemini about your attendance logs:")
            if st.button("🚀 Ask AI", use_container_width=True) and user_query:
                with st.spinner("Processing..."):
                    answer = ai_analyst.chat_with_data(user_query, df)
                    st.session_state.ai_chat_history.append({"q": user_query, "a": answer})
            for chat in reversed(st.session_state.ai_chat_history):
                with st.chat_message("user"):
                    st.write(chat["q"])
                with st.chat_message("assistant", avatar="🧠"):
                    st.write(chat["a"])
