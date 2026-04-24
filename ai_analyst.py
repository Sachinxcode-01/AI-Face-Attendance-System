import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
import google.generativeai as genai
import pandas as pd
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Configure Gemini
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def get_ai_response(prompt, context_df=None):
    """
    General function to get a response from Gemini.
    If context_df is provided, it's included in the prompt.
    """
    if not GOOGLE_API_KEY:
        return "⚠️ Google API Key not found in .env file. Please add GOOGLE_API_KEY='your_key_here'."
    
    try:
        # Use gemini-2.0-flash for high-speed, high-quality analysis
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        full_prompt = prompt
        if context_df is not None:
            # We only send a subset of data if it's too large, but for attendance logs it should be fine
            # Focus on Name, Roll No, Date, Status
            summary_cols = ['Name', 'Roll No', 'Date', 'Status']
            available_cols = [col for col in summary_cols if col in context_df.columns]
            
            # Limit rows to avoid token limits if data is huge, but usually attendance is manageable
            data_sample = context_df[available_cols].tail(100) # Last 100 records for context
            data_str = data_sample.to_string(index=False)
            
            full_prompt = f"You are an AI Attendance Analyst. Below is the recent attendance data from the SmartFace AI system:\n\n{data_str}\n\nTask: {prompt}"
            
        response = model.generate_content(full_prompt)
        return response.text
    except Exception as e:
        return f"❌ AI Error: {str(e)}"

def get_attendance_summary(df):
    """Generates a professional overview of the entire class."""
    if df.empty:
        return "No data available to analyze."
    
    prompt = """
    Analyze the provided attendance records and provide a 'Management Summary'.
    - Highlight the overall attendance percentage.
    - Identify students who are frequently absent.
    - Note any patterns (e.g., high absenteeism on certain dates).
    - Provide 3 actionable recommendations for improving attendance.
    Format with nice headers and bullet points.
    """
    return get_ai_response(prompt, df)

def get_student_report_insight(student_name, student_df):
    """Generates personalized feedback for a specific student's report."""
    if student_df.empty:
        return "No records found for this student."
        
    prompt = f"""
    Write a short, professional 'AI Insight' for the student {student_name}.
    Analyze their attendance consistency. 
    If they are above 90%, praise their dedication.
    If they are between 75-90%, encourage them to be more consistent.
    If they are below 75%, warn them about potential academic impact and suggest meeting with a counselor.
    Keep it to 3-4 sentences.
    """
    return get_ai_response(prompt, student_df)

def chat_with_data(query, df):
    """Allows the admin to ask arbitrary questions about the attendance logs."""
    return get_ai_response(query, df)

def get_greeting(name):
    """Generates a short, motivating greeting for a student."""
    prompt = f"Generate a very short, unique, and motivating welcome greeting for a student named {name}. Keep it under 8 words. Example: 'Welcome back {name}, you are doing great!'"
    return get_ai_response(prompt)

