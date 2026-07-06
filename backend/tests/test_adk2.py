import asyncio
from google.adk import Agent

agent = Agent(model='gemini-1.5-flash', instruction='hi', name='test')

async def main():
    print(await agent.run_async(node_input='hi'))
    
asyncio.run(main())
