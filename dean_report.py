import os
import pandas as pd
from datetime import datetime, timedelta
from fpdf import FPDF
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv
import ai_analyst

# --- CONFIGURATION ---
load_dotenv()
SENDER_EMAIL = "saxhin0708@gmail.com"
SENDER_PASSWORD = os.getenv("EMAIL_PASSWORD")
DEAN_EMAIL = "saxhin0708@gmail.com" # Default Dean/Admin Email

class DeanReportPDF(FPDF):
    def header(self):
        # Dark Blue Header
        self.set_fill_color(10, 25, 47) 
        self.rect(0, 0, 210, 45, 'F')
        
        self.set_y(12)
        self.set_font('Arial', 'B', 24)
        self.set_text_color(255, 255, 255)
        self.cell(0, 10, 'EXECUTIVE ATTENDANCE SUMMARY', 0, 1, 'C')
        
        self.set_font('Arial', 'I', 11)
        self.set_text_color(255, 215, 0) # Gold
        self.cell(0, 6, 'SmartFace AI Academic Intelligence', 0, 0, 'C')
        self.ln(30)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.set_text_color(150, 150, 150)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.cell(0, 10, f'Confidential Administrative Document | Generated: {timestamp} | Page {self.page_no()}', 0, 0, 'C')

def generate_dean_report():
    print("[INFO] Processing Academic Records for Executive Report...")
    
    folder = "Attendance_Logs"
    if not os.path.exists(folder):
        return "Error: No logs found."

    # 1. Load All Data
    all_data = []
    for file in os.listdir(folder):
        if file.startswith("Attendance_") and file.endswith(".csv"):
            try:
                all_data.append(pd.read_csv(os.path.join(folder, file)))
            except: pass

    if not all_data:
        return "Error: No attendance logs found."

    df = pd.concat(all_data, ignore_index=True)
    
    # 2. Calculate Stats
    summary = df.groupby(['Roll No', 'Name']).agg(
        Total=('Status', 'count'),
        Present=('Status', lambda x: (x == 'Present').sum())
    ).reset_index()
    
    summary['Percentage'] = (summary['Present'] / summary['Total']) * 100
    
    # Categories
    top_performers = summary[summary['Percentage'] >= 90].sort_values(by='Percentage', ascending=False)
    critical_list = summary[summary['Percentage'] < 75].sort_values(by='Percentage', ascending=True)
    
    # 3. PDF Generation
    pdf = DeanReportPDF()
    pdf.add_page()
    
    # Overview
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(10, 25, 47)
    pdf.cell(0, 10, '📊 ACADEMIC OVERVIEW', 0, 1, 'L')
    
    total_students = len(summary)
    avg_attendance = summary['Percentage'].mean()
    
    pdf.set_font('Arial', '', 12)
    pdf.set_text_color(50, 50, 50)
    pdf.cell(50, 8, f"Total Students Tracked:", 0, 0)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 8, str(total_students), 0, 1)
    
    pdf.set_font('Arial', '', 12)
    pdf.cell(50, 8, f"Campus-wide Average:", 0, 0)
    pdf.set_font('Arial', 'B', 12)
    pdf.cell(0, 8, f"{avg_attendance:.1f}%", 0, 1)
    pdf.ln(10)
    
    # Top Performers
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(0, 100, 0) # Green
    pdf.cell(0, 10, '🌟 TOP PERFORMERS (Above 90%)', 0, 1, 'L')
    
    pdf.set_font('Arial', 'B', 11)
    pdf.set_fill_color(230, 255, 230)
    pdf.cell(30, 10, 'Roll No', 1, 0, 'C', True)
    pdf.cell(100, 10, 'Student Name', 1, 0, 'C', True)
    pdf.cell(60, 10, 'Attendance %', 1, 1, 'C', True)
    
    pdf.set_font('Arial', '', 10)
    for _, row in top_performers.head(10).iterrows():
        pdf.cell(30, 8, str(row['Roll No']), 1, 0, 'C')
        pdf.cell(100, 8, str(row['Name']), 1, 0, 'L')
        pdf.cell(60, 8, f"{row['Percentage']:.1f}%", 1, 1, 'C')
    
    pdf.ln(10)
    
    # Critical List
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(200, 0, 0) # Red
    pdf.cell(0, 10, '🚨 CRITICAL SHORTAGE LIST (Below 75%)', 0, 1, 'L')
    
    pdf.set_font('Arial', 'B', 11)
    pdf.set_fill_color(255, 230, 230)
    pdf.cell(30, 10, 'Roll No', 1, 0, 'C', True)
    pdf.cell(100, 10, 'Student Name', 1, 0, 'C', True)
    pdf.cell(60, 10, 'Attendance %', 1, 1, 'C', True)
    
    pdf.set_font('Arial', '', 10)
    for _, row in critical_list.head(10).iterrows():
        pdf.cell(30, 8, str(row['Roll No']), 1, 0, 'C')
        pdf.cell(100, 8, str(row['Name']), 1, 0, 'L')
        pdf.cell(60, 8, f"{row['Percentage']:.1f}%", 1, 1, 'C')

    # AI Executive Summary
    pdf.ln(10)
    pdf.set_font('Arial', 'B', 16)
    pdf.set_text_color(10, 25, 47)
    pdf.cell(0, 10, '🧠 AI EXECUTIVE SUMMARY', 0, 1, 'L')
    
    try:
        ai_prompt = f"Write a professional executive summary for the Dean based on this data: {total_students} students tracked, average attendance is {avg_attendance:.1f}%. {len(top_performers)} students are doing excellent, while {len(critical_list)} students are at risk. Provide 2 strategic suggestions."
        ai_summary = ai_analyst.get_ai_response(ai_prompt)
    except:
        ai_summary = "AI Summary service unavailable. Overall system data suggests a consistent attendance pattern across the department."
        
    pdf.set_font('Arial', 'I', 11)
    pdf.set_text_color(50, 50, 50)
    pdf.multi_cell(0, 8, ai_summary)

    # Save
    if not os.path.exists("Reports"): os.makedirs("Reports")
    filename = f"Reports/Dean_Executive_Report_{datetime.now().strftime('%Y%m%d')}.pdf"
    pdf.output(filename)
    
    # 4. Email
    if SENDER_PASSWORD:
        msg = EmailMessage()
        msg['Subject'] = f"📊 Weekly Executive Attendance Report - {datetime.now().strftime('%d %b %Y')}"
        msg['From'] = SENDER_EMAIL
        msg['To'] = DEAN_EMAIL
        msg.set_content(f"Dear Dean/Administrator,\n\nPlease find the weekly AI-generated attendance report attached.\n\nThis report highlights top performers and at-risk students for administrative action.\n\nBest regards,\nSmartFace AI System")
        
        with open(filename, 'rb') as f:
            msg.add_attachment(f.read(), maintype='application', subtype='pdf', filename=os.path.basename(filename))
            
        try:
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
            server.quit()
            return f"Success! Report emailed to {DEAN_EMAIL}"
        except Exception as e:
            return f"PDF generated at {filename}, but email failed: {e}"
    
    return f"Report generated at {filename} (Email skipped - No Password)"

if __name__ == "__main__":
    result = generate_dean_report()
    print(f"[STATUS] {result}")
