"""
SmartAttendance - AI: Groq-powered AI Analyst Module
This module provides async AI analysis using the Groq API (Llama 3).
It is the async-compatible counterpart to ai_analyst.py.
"""
import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = "llama-3.3-70b-versatile"


class GroqAnalyst:
    def __init__(self):
        self.client = AsyncGroq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

    async def get_student_insights(self, student_name: str, attendance_summary: dict) -> str:
        """
        Generates a personalized AI analysis for a student based on their
        subject-wise attendance summary.
        
        Args:
            student_name: The full name of the student.
            attendance_summary: A dict like {"Mathematics": "80%", "Physics": "60%"}
        
        Returns:
            A string containing the AI-generated analysis.
        """
        if not self.client:
            return "AI Analyst is currently offline. Please configure your GROQ_API_KEY."

        if not attendance_summary:
            return f"No attendance data found for {student_name} to analyze."

        # Format the summary for the prompt
        summary_lines = "\n".join(
            [f"  - {subject}: {pct}" for subject, pct in attendance_summary.items()]
        )

        prompt = (
            f"Student Name: {student_name}\n"
            f"Subject-wise Attendance:\n{summary_lines}\n\n"
            "Please provide:\n"
            "1. A brief overall assessment of this student's attendance.\n"
            "2. Identify any subjects where attendance is critically low (below 75%).\n"
            "3. One specific, encouraging piece of advice to help the student improve.\n\n"
            "Keep the response concise (3-4 sentences) and professional."
        )

        try:
            response = await self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are SmartAttendance AI, an expert academic analyst. "
                            "You provide concise, supportive, and actionable insights "
                            "to help students improve their academic performance."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                model=MODEL_NAME,
                temperature=0.6,
                max_tokens=512,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[GroqAnalyst] API Error: {e}")
            return f"Analysis temporarily unavailable for {student_name}. Please try again later."


# Singleton instance for use across the application
ai_analyst = GroqAnalyst()
