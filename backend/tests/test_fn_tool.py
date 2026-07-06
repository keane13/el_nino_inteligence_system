from google.adk import Agent, Runner
from google.adk.tools import FunctionTool
from google.adk.sessions import InMemorySessionService

def my_search_tool(query: str, context: str) -> str:
    """Search data based on query.
    
    Args:
        query: The search query.
        context: Context data for search.
    
    Returns:
        Search results as string.
    """
    return f"Result for query: {query}"

agent = Agent(
    model="gemini-2.0-flash",
    name="test_agent",
    instruction="You are a test agent. Use search tool when needed.",
    tools=[FunctionTool(my_search_tool)],
)

runner = Runner(
    app_name="test",
    agent=agent,
    session_service=InMemorySessionService(),
)
print("All OK! Agent + FunctionTool + Runner created successfully.")
