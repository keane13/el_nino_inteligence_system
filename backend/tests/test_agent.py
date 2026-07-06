import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from agent import create_jakarta_pulse_agent
from main import build_context

def test_create_agent():
    context = build_context()
    agent = create_jakarta_pulse_agent(context)
    assert agent is not None
    assert agent.name == "jakarta_pulse_agent"
    
def test_fallback_reply():
    from main import _fallback_reply
    reply = _fallback_reply("bagaimana kondisi macet")
    assert "macet" in reply.lower() or "traffic" in reply.lower() or "kemacetan" in reply.lower()
