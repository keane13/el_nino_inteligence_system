import asyncio
from google.adk import Agent, Runner

agent = Agent(model='gemini-flash-lite-latest', instruction='hi', name='test')
runner = Runner(agent=agent)

def main():
    events = []
    for event in runner.run(user_id="test_user", session_id="test_session", new_message="hello"):
        events.append(event)
        print(event)

main()
