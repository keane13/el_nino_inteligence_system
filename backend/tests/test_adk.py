import asyncio
from google.adk import Agent, Context

agent = Agent(model='gemini-1.5-flash', instruction='hi', name='test')

async def main():
    async for e in agent.run(ctx=Context(), node_input='hi'):
        print(e.output)

asyncio.run(main())
