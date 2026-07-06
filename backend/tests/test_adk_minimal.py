"""
Minimal test: ADK Runner + Agent menjawab pertanyaan singkat tanpa tools.
"""
import asyncio
from google.adk import Agent, Runner
from google.adk.sessions import InMemorySessionService
import google.genai.types as types

MODEL = "gemini-2.0-flash"

agent = Agent(
    model=MODEL,
    name="jakarta_pulse_test",
    instruction="Kamu adalah Jakarta Pulse AI. Jawab singkat dan ramah.",
)

session_service = InMemorySessionService()

runner = Runner(
    app_name="jakarta_pulse_test",
    agent=agent,
    session_service=session_service,
)

USER_ID = "test_user"
SESSION_ID = "session_001"

async def ask(question: str) -> str:
    # Ensure session exists
    await session_service.create_session(
        app_name="jakarta_pulse_test",
        user_id=USER_ID,
        session_id=SESSION_ID,
    )

    message = types.Content(
        role="user",
        parts=[types.Part(text=question)],
    )

    reply = ""
    async for event in runner.run_async(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=message,
    ):
        if event.is_final_response() and event.content:
            for part in event.content.parts:
                reply += part.text or ""
    return reply

if __name__ == "__main__":
    question = "Siapa kamu dan apa fungsimu?"
    print(f"Q: {question}")
    answer = asyncio.run(ask(question))
    print(f"A: {answer}")
