import os
from groq import Groq
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Groq API
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)
    # Using Llama 3 70B for high-quality academic analysis
    MODEL_NAME = "llama-3.3-70b-versatile"
else:
    client = None

def get_groq_response(prompt, system_prompt="You are a helpful academic assistant."):
    """Helper function to get completion from Groq."""
    if not client:
        return None
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=MODEL_NAME,
            temperature=0.7,
            max_tokens=1024,
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        return None

def get_greeting(name):
    """Generates a friendly AI greeting for the student when recognized."""
    prompt = f"Generate a very short, professional, and welcoming greeting for a student named {name} who just entered the classroom. Keep it under 5 words."
    response = get_groq_response(prompt)
    
    if response:
        return response
    return f"Welcome {name}"

def get_attendance_summary(df):
    """Analyzes the attendance dataframe and returns a professional summary."""
    if df.empty:
        return "No data to analyze."

    try:
        # Prepare a data snippet for the AI
        summary_stats = df.groupby('Name')['Status'].value_counts().unstack(fill_value=0)
        data_string = summary_stats.to_string()
        
        prompt = (
            "Analyze the following attendance data summary and provide "
            "a concise, professional report (3-4 bullet points) on trends, top performers, and students at risk.\n\n"
            f"Data Summary:\n{data_string}\n\n"
            "Focus on identifying students with low attendance and suggesting improvements."
        )
        
        response = get_groq_response(prompt, system_prompt="You are an expert Academic Analyst.")
        if response:
            return response
        return "Analysis unavailable at this moment."
    except Exception as e:
        return f"Error analyzing data: {str(e)}"

def get_student_report_insight(name, df_student):
    """Provides personalized AI feedback for a specific student's attendance pattern."""
    if df_student.empty:
        return "No specific insights available for this student."

    try:
        total_days = len(df_student)
        present_days = len(df_student[df_student['Status'] == 'Present'])
        attendance_rate = (present_days / total_days) * 100
        
        prompt = (
            f"Student {name} has an attendance rate of {attendance_rate:.1f}% "
            f"({present_days} present out of {total_days} total sessions). "
            "Provide a single encouraging sentence of advice to help them improve or maintain their attendance."
        )
        
        response = get_groq_response(prompt, system_prompt="You are a supportive academic mentor.")
        if response:
            return response
        return f"Keep up the good work, {name}!"
    except Exception as e:
        return f"Keep up the good work, {name}!"

def chat_with_data(query, df):
    """Answers specific admin queries about the attendance data using AI."""
    if not client:
        return "AI Chat is currently offline. Please check your API key."

    try:
        # Create a condensed version of the data for context
        if len(df) > 100:
            # If data is too large, send a pivot table/summary instead of raw rows
            context_df = df.groupby(['Name', 'Status']).size().reset_index(name='Count')
        else:
            context_df = df[['Name', 'Roll No', 'Status', 'Date']]

        data_context = context_df.to_string(index=False)
        
        prompt = (
            "Answer the user's question based on the provided attendance records.\n\n"
            f"Attendance Records Summary:\n{data_context}\n\n"
            f"User Question: {query}\n\n"
            "If the answer isn't in the data, politely say so. Keep answers concise."
        )
        
        response = get_groq_response(prompt, system_prompt="You are the SmartFace AI Assistant.")
        if response:
            return response
        return "I'm sorry, I couldn't process that request right now."
    except Exception as e:
        return f"I encountered an error while processing your request: {str(e)}"
