"""Test agent.py final: run_multi_agent tanpa ADK Runner (menggunakan google.genai langsung)."""
import sys, os
sys.path.insert(0, ".")

# Baca GEMINI_API_KEY dari .env
with open(".env") as f:
    for line in f:
        if line.startswith("GEMINI_API_KEY="):
            os.environ["GEMINI_API_KEY"] = line.strip().split("=", 1)[1]

from agent import run_multi_agent

context = """
Kamu adalah Jakarta Pulse AI. Data saat ini: 160 keluhan total, 67 terbuka, 20 eskalasi.
El Nino 2026: ONI Index 1.6, El Nino Kuat, 5 provinsi kekeringan kritis.
Traffic terparah: Jl. Thamrin 9/10, Jl. Sudirman 8/10.
"""

tests = [
    ("simple", "Halo, kamu siapa dan apa fungsimu?"),
    ("data", "Berapa jumlah keluhan terbuka saat ini?"),
]

for qtype, q in tests:
    print(f"\n{'='*60}")
    print(f"[{qtype.upper()}] Q: {q}")
    print(f"{'='*60}")
    answer = run_multi_agent(q, context)
    print(f"A: {answer}")
