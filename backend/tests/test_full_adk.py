"""Full ADK pipeline test: FunctionTool yang memanggil google.genai.Client"""
import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from google.adk import Agent, Runner
from google.adk.tools import FunctionTool
from google.adk.sessions import InMemorySessionService
from google import genai
from google.genai import types as genai_types

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def search_realtime_data(query: str) -> str:
    """
    Search realtime Jakarta Pulse data based on query.

    Args:
        query: Data query from user.

    Returns:
        Relevant data as text string.
    """
    # Simulated data (in production, this queries BigQuery/GCS)
    data = {
        "keluhan": "160 total, 67 terbuka, 20 eskalasi",
        "traffic": "Jl. Thamrin 9/10 kemacetan, Sudirman 8/10",
        "elnino": "ONI 1.6, El Nino Kuat, 5 provinsi kritis",
    }
    q = query.lower()
    if "keluhan" in q or "laporan" in q:
        return data["keluhan"]
    if "traffic" in q or "macet" in q:
        return data["traffic"]
    if "elnino" in q or "kekeringan" in q:
        return data["elnino"]
    return f"Data umum Jakarta Pulse: {data}"


def generate_insight(data: str, topic: str) -> str:
    """
    Generate professional AI insight from raw data.

    Args:
        data: Raw data to analyze.
        topic: The topic or question to address.

    Returns:
        Professional analysis text.
    """
    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"Analisis data berikut untuk topik: {topic}\n\nData: {data}",
        config=genai_types.GenerateContentConfig(
            system_instruction="Kamu adalah analyst kota Jakarta. Berikan insight singkat dan profesional.",
            temperature=0.3,
            max_output_tokens=512,
        ),
    )
    return response.text or "Tidak ada insight."


agent = Agent(
    model="gemini-2.0-flash",
    name="jakarta_pulse_test",
    instruction=(
        "Kamu adalah Jakarta Pulse AI. Untuk pertanyaan umum, jawab langsung. "
        "Untuk pertanyaan data, gunakan search_realtime_data lalu generate_insight."
    ),
    tools=[FunctionTool(search_realtime_data), FunctionTool(generate_insight)],
)

_session_service = InMemorySessionService()
runner = Runner(app_name="jakarta_pulse", agent=agent, session_service=_session_service)


async def ask(question: str) -> str:
    await _session_service.create_session(
        app_name="jakarta_pulse",
        user_id="test_user",
        session_id="session_001",
    )
    from google.genai import types as gt
    msg = gt.Content(role="user", parts=[gt.Part(text=question)])
    final = ""
    async for event in runner.run_async(
        user_id="test_user",
        session_id="session_001",
        new_message=msg,
    ):
        if hasattr(event, "is_final_response") and event.is_final_response():
            if event.content and event.content.parts:
                for p in event.content.parts:
                    if hasattr(p, "text") and p.text:
                        final += p.text
    return final or "No response"


if __name__ == "__main__":
    q = "Halo, siapa kamu?"
    print(f"Q: {q}")
    ans = asyncio.run(ask(q))
    print(f"A: {ans}")
