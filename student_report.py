import os
import pandas as pd
from datetime import datetime
import warnings
from fpdf import FPDF
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

# Suppress pandas warnings
warnings.simplefilter(action='ignore', category=FutureWarning)

# --- EMAIL SECRETS ---
load_dotenv()
SENDER_EMAIL = "saxhin0708@gmail.com"
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")

# ==========================================
# PREMIUM PDF DESIGN CLASS
# ==========================================
class PremiumPDF(FPDF):
    def header(self):
        self.set_fill_color(10, 25, 47) 
        self.rect(0, 0, 210, 40, 'F')
        
        self.set_y(12)
        self.set_font('Arial', 'B', 22)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, 'SMART ATTENDANCE REPORT', 0, 1, 'C')
        
        self.set_font('Arial', 'I', 11)
        self.set_text_color(255, 215, 0)
        self.cell(0, 6, 'AI Face Recognition System', 0, 0, 'C')
        self.ln(25)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(150, 150, 150)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.cell(0, 10, f'Generated automatically by AI System | {timestamp} | Page {self.page_no()}', 0, 0, 'C')

def export_to_pdf(student_df, name, roll, total, present, absent, pct, monthly_stats):
    if not os.path.exists("Reports"):
        os.makedirs("Reports")

    pdf = PremiumPDF()
    pdf.add_page()
    
    # Profile
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(10, 25, 47)
    pdf.cell(0, 10, 'STUDENT PROFILE', 0, 1, 'L')
    
    pdf.set_font('Arial', '', 12)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(40, 8, 'Full Name:', 0, 0)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 8, name.upper(), 0, 1)
    
    pdf.set_font('Arial', '', 12)
    pdf.cell(40, 8, 'Roll Number:', 0, 0)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 8, roll.upper(), 0, 1)
    pdf.ln(5)
    
    # Stats
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(10, 25, 47)
    pdf.cell(0, 10, 'OVERALL STATISTICS', 0, 1, 'L')
    
    pdf.set_fill_color(240, 245, 250)
    pdf.rect(10, pdf.get_y(), 190, 25, 'F')
    pdf.set_y(pdf.get_y() + 5)
    
    pdf.set_font('Arial', 'B', 11)
    pdf.set_text_color(10, 25, 47)
    pdf.cell(45, 8, f'Total Classes: {total}', 0, 0, 'C')
    pdf.set_text_color(0, 128, 0)
    pdf.cell(45, 8, f'Present: {present}', 0, 0, 'C')
    pdf.set_text_color(200, 0, 0)
    pdf.cell(45, 8, f'Absent: {absent}', 0, 0, 'C')
    pdf.set_text_color(255, 140, 0)
    pdf.cell(55, 8, f'Attendance: {pct:.2f}%', 0, 1, 'C')
    pdf.ln(15)

    # Breakdown Table
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(10, 25, 47)
    pdf.cell(0, 10, 'MONTHLY BREAKDOWN', 0, 1, 'L')
    
    pdf.set_fill_color(10, 25, 47)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(60, 10, 'Month', 1, 0, 'C', fill=True)
    pdf.cell(45, 10, 'Classes Held', 1, 0, 'C', fill=True)
    pdf.cell(45, 10, 'Attended', 1, 0, 'C', fill=True)
    pdf.cell(40, 10, 'Percentage', 1, 1, 'C', fill=True)
    
    pdf.set_text_color(50, 50, 50)
    pdf.set_font('Arial', '', 11)
    
    fill = False
    for month, row in monthly_stats.iterrows():
        m_total = row['Total_Classes']
        m_present = row['Present_Count']
        m_pct = (m_present / m_total) * 100
        
        pdf.set_fill_color(245, 245, 245)
        pdf.cell(60, 10, month, 1, 0, 'C', fill=fill)
        pdf.cell(45, 10, str(m_total), 1, 0, 'C', fill=fill)
        pdf.cell(45, 10, str(m_present), 1, 0, 'C', fill=fill)
        
        if m_pct >= 75: pdf.set_text_color(0, 128, 0)
        elif m_pct >= 50: pdf.set_text_color(255, 140, 0)
        else: pdf.set_text_color(200, 0, 0)
            
        pdf.cell(40, 10, f'{m_pct:.1f}%', 1, 1, 'C', fill=fill)
        pdf.set_text_color(50, 50, 50)
        fill = not fill

    filename = f"Reports/{roll}_{name.replace(' ', '_')}_Report.pdf"
    pdf.output(filename)
    return filename

# ==========================================
# EMAIL HELPER FUNCTIONS
# ==========================================
def get_student_email(roll_no):
    """Fetches the student's email from students.csv"""
    if os.path.exists("students.csv"):
        try:
            df = pd.read_csv("students.csv", dtype=str)
            df.columns = [c.strip() for c in df.columns]
            # Find matching row
            student_row = df[df['Roll No'].str.strip() == roll_no]
            if not student_row.empty:
                return student_row.iloc[0]['Email'].strip()
        except: pass
    return None

def send_pdf_to_student(pdf_path, student_name, student_email):
    """Emails the generated PDF to the target address."""
    if not SENDER_PASSWORD:
        print("❌ [EMAIL ERROR] Missing EMAIL_PASSWORD in .env file.")
        return

    msg = EmailMessage()
    msg['Subject'] = f"🎓 Your AI Attendance Report - {student_name}"
    msg['From'] = SENDER_EMAIL
    msg['To'] = student_email

    body = (f"Hello {student_name},\n\n"
            f"Please find your official Smart Attendance Report attached as a PDF.\n\n"
            f"If you have any questions regarding your attendance percentage, please contact the administration.\n\n"
            f"Best regards,\nAI Smart Attendance System")
    msg.set_content(body)

    try:
        with open(pdf_path, 'rb') as f:
            file_data = f.read()
            file_name = os.path.basename(pdf_path)

        msg.add_attachment(file_data, maintype='application', subtype='pdf', filename=file_name)

        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"📧 [SUCCESS] PDF Report sent securely to: {student_email}!")
    except Exception as e:
        print(f"❌ [EMAIL ERROR] Failed to send to {student_email}: {e}")


# ==========================================
# MAIN DASHBOARD LOGIC
# ==========================================
def generate_student_report():
    folder = "Attendance_Logs"
    if not os.path.exists(folder):
        print(f"[ERROR] The folder '{folder}' does not exist yet. Run the main system first.")
        return

    all_data = []
    for file in os.listdir(folder):
        if file.startswith("Attendance_") and file.endswith(".csv"):
            filepath = os.path.join(folder, file)
            try:
                all_data.append(pd.read_csv(filepath))
            except: pass

    if not all_data:
        print("[INFO] No attendance session logs found.")
        return

    master_df = pd.concat(all_data, ignore_index=True)
    master_df['Roll No'] = master_df['Roll No'].astype(str).str.strip()
    master_df['Name'] = master_df['Name'].astype(str).str.strip()
    master_df['Date'] = pd.to_datetime(master_df['Date'])

    print("="*50)
    print("   📊 ADMIN DASHBOARD: STUDENT REPORT GENERATOR   ")
    print("="*50)

    while True:
        search_query = input("\nEnter Student Name or Roll No (or type 'exit' to quit): ").strip().lower()
        if search_query == 'exit': break
        if not search_query: continue

        match_mask = (master_df['Roll No'].str.lower() == search_query) | (master_df['Name'].str.lower() == search_query)
        student_df = master_df[match_mask].copy()

        if student_df.empty:
            print(f"❌ No records found for '{search_query}'.")
            continue

        actual_name = student_df.iloc[0]['Name']
        actual_roll = student_df.iloc[0]['Roll No']
        total_classes = len(student_df)
        total_present = len(student_df[student_df['Status'] == 'Present'])
        total_absent = len(student_df[student_df['Status'] == 'Absent'])
        overall_pct = (total_present / total_classes) * 100

        print(f"\n{'='*50}")
        print(f" 🎓 ATTENDANCE REPORT: {actual_name.upper()} ({actual_roll})")
        print(f"{'='*50}")
        print(f" Total Classes: {total_classes} | Present: {total_present} | Absent: {total_absent} | Percentage: {overall_pct:.2f}%")
        
        student_df['Month'] = student_df['Date'].dt.strftime('%B %Y')
        monthly_stats = student_df.groupby('Month').agg(
            Total_Classes=('Status', 'count'),
            Present_Count=('Status', lambda x: (x == 'Present').sum())
        )
        
        print("\n 📅 MONTHLY BREAKDOWN:")
        for month, row in monthly_stats.iterrows():
            m_pct = (row['Present_Count'] / row['Total_Classes']) * 100
            print(f"    - {month}: {row['Present_Count']}/{row['Total_Classes']} classes ({m_pct:.1f}%)")
        print(f"{'='*50}")

        # --- EXPORT & EMAIL WORKFLOW ---
        export = input("\n💾 Export to Premium PDF & Email? (y/n): ").strip().lower()
        if export == 'y':
            # 1. Generate PDF
            pdf_path = export_to_pdf(student_df, actual_name, actual_roll, total_classes, total_present, total_absent, overall_pct, monthly_stats)
            print(f"✅ Success! PDF saved locally to: {pdf_path}")
            
            # 2. Lookup Email
            student_email = get_student_email(actual_roll)
            
            # Check if email is missing or just a placeholder
            if not student_email or "update_email" in student_email or "no_email" in student_email:
                print(f"⚠️ No valid email found for {actual_name} in students.csv (Found: {student_email})")
                student_email = input(f"   Enter email manually to send it now (or press Enter to skip): ").strip()
                
            # 3. Send Email
            if student_email:
                print("⏳ Sending email... please wait.")
                send_pdf_to_student(pdf_path, actual_name, student_email)
            else:
                print("⏭️ Email sending skipped.")

if __name__ == "__main__":
    generate_student_report()