import os
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

class AIAnalyst:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))

    async def get_student_insights(self, student_name: str, attendance_data: dict):
        prompt = f"""
        Analyze the attendance performance for student {student_name}.
        Data: {attendance_data}
        
        Provide:
        1. Academic Risk Level (Low, Medium, High)
        2. Key Insights
        3. Actionable Advice to improve attendance or maintain it.
        
        Format as a professional brief for the student. Keep it concise.
        """
        
        try:
            completion = await self.client.chat.completions.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "system", "content": "You are SmartAttendance - AI Academic Analyst, an expert in educational data science."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=500
            )
            return completion.choices[0].message.content
        except Exception as e:
            return f"AI Analysis temporarily unavailable. Details: {str(e)}"

ai_analyst = AIAnalyst()
