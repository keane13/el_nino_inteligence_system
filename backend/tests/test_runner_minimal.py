"""Minimal test: ADK Runner.run_async without FunctionTool."""
import asyncio
from google.adk import Agent, Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types as gt

# Use the correct available model
MODEL = "gemini-flash-lite-latest"

agent = Agent(
    model=MODEL,
    name="test_minimal",
    instruction="Kamu adalah AI. Jawab singkat.",
)

ss = InMemorySessionService()
runner = Runner(app_name="test", agent=agent, session_service=ss)


class SimpleContent:
    """Content wrapper that avoids Pydantic schema issues with typing.IO[bytes]."""
    class Part:
        def __init__(self, text):
            self.text = text
            self.inline_data = None
            self.function_call = None
            self.function_response = None
    def __init__(self, text, role="user"):
        self.role = role
        self.parts = [self.Part(text)]


async def main():
    await ss.create_session(app_name="test", user_id="u1", session_id="s1")
    msg = SimpleContent("Halo, kamu siapa?")
    for event in runner.run(user_id="u1", session_id="s1", new_message=msg):
        if hasattr(event, "is_final_response") and event.is_final_response():
            if event.content and event.content.parts:
                for p in event.content.parts:
                    if hasattr(p, "text") and p.text:
                        print("ADK Response:", p.text)


asyncio.run(main())

