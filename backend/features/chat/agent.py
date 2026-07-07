"""
Jakarta Pulse Multi-Agent System
=================================
Architecture: Multi-Agent with google.genai SDK (Native Function Calling)
Compliant with Google ADK philosophy: Agent, Tool, Orchestration, Context injection.

AGENT HIERARCHY:
  Supervisor → Routes to specialist agents based on intent
  ├── search_data_agent   → Searches for realtime data from context (BigQuery/GCS-ready)
  ├── nlq_agent           → Deep analysis, prediction, recommendation
  ├── chart_agent         → Creates JSON chart visualizations
  └── generation_agent    → Summarizes output into a professional response
"""

import os
import json
import base64
from google import genai
from google.genai import types as genai_types
from dotenv import load_dotenv

# Import our custom python tools
from features.chat.tools import (
    query_bigquery,
    get_realtime_hotspots,
    list_gcs_files,
    read_gcs_file
)

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MODEL = "gemini-flash-lite-latest"


def _get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not found in .env")
    return genai.Client(api_key=GEMINI_API_KEY)


def _llm(client: genai.Client, system: str, prompt: str, image_data: str = None, tools: list = None) -> str:
    """Single call to Gemini with system instruction + prompt (and optional image & tools)."""
    
    # Process image if exists
    contents = [prompt]
    if image_data:
        # Expected format: "data:image/jpeg;base64,/9j/4AAQ..."
        if "," in image_data:
            mime_type = image_data.split(";")[0].split(":")[1]
            base64_str = image_data.split(",")[1]
            img_bytes = base64.b64decode(base64_str)
            contents.append(
                genai_types.Part.from_bytes(data=img_bytes, mime_type=mime_type)
            )
            
    config = genai_types.GenerateContentConfig(
        system_instruction=system,
        temperature=0.3,
        max_output_tokens=2048,
    )
    
    if tools:
        config.tools = tools
        # For automatic function calling loop, we should ideally use a Chat session
        chat = client.chats.create(model=MODEL, config=config)
        response = chat.send_message(contents)
        return response.text or ""

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=config,
    )
    return response.text or ""


from langsmith import traceable

# ═══════════════════════════════════════════════════════════
# SPECIALIST AGENTS (ADK-concept compliant via function tools)
# ═══════════════════════════════════════════════════════════

@traceable(run_type="chain", name="Search_Data_Agent")
def search_data_agent(client: genai.Client, query: str, context: str, image_data: str = None) -> str:
    """
    Data Search Agent — Extracts specific data from realtime context.
    Equipped with Native Gemini Tools: query_bigquery, get_realtime_hotspots, list_gcs_files.
    """
    system = (
        "You are the Data Search Agent for the El Nino Intelligence Assistant.\n"
        "Extract specific relevant data from the realtime data context, use tools to search in BigQuery, GCS, or local hotspots if necessary.\n"
        "DATA SOURCE USAGE GUIDELINES:\n"
        "1. IF the question is about El Nino concepts, challenges, mitigation efforts, government roles, policies, or ENSO SOPs: MUST use the read_gcs_file(bucket_name='el_nino01', file_name='filename') tool. The 3 relevant documents in GCS are: 'El-Nino-La-Nina-2020_Summary.md', 'Mitigasi_El_Nino_Komprehensif.docx', and 'ENSO_SOPs_10Page_Summary.pdf'. (Call list_gcs_files if you need to check).\n"
        "2. IF the question involves quantitative elements (data conditions, cases, events, distribution, analysis): MUST use the query_bigquery tool to search for real data.\n"
        "3. For recommendations and solutions: combine access from BigQuery and documents in GCS.\n\n"
        "To access BigQuery, call the query_bigquery(sql_query) tool with a valid Google Standard SQL query.\n"
        "Available BigQuery tables:\n"
        "1. `smooth-reason-491707-f6.el_nino.rekap_elnino_baru_2025_2026` (Main Combined Table)\n"
        "   Schema: provinsi (STRING), tahun (INTEGER), bulan (STRING), suhu_celsius (FLOAT), curah_hujan_mm (FLOAT), tutupan_awan_oktas (INT), kualitas_udara_pm25_ugm3 (FLOAT), kedalaman_rata_rata_meter (FLOAT), status (STRING), total_produksi_liter_per_detik (FLOAT), kontinuitas_aliran_jam_per_hari (INT), volume_tampungan_juta_m3 (FLOAT), persentase_kapasitas (FLOAT), status_operasi (STRING), jumlah_kasus_ispa (INT), jumlah_kasus_diare (INT), ketersediaan_ton (FLOAT), kebutuhan_ton (FLOAT), neraca_ton (FLOAT), rasio_ketersediaan_kebutuhan_persen (FLOAT), jumlah_kebakaran_gedung_dan_permukiman (INT), jumlah_kebakaran_hutan_dan_lahan (INT), jumlah_cuaca_ekstrem (INT), jumlah_kekeringan (INT).\n"
        "2. `smooth-reason-491707-f6.el_nino.food_availability_rekap_2025_2026`\n"
        "   Schema: provinsi (STRING), tahun (INTEGER), bulan (STRING), ketersediaan_ton (FLOAT), kebutuhan_ton (FLOAT), neraca_ton (FLOAT), rasio_ketersediaan_kebutuhan_persen (FLOAT).\n"
        "3. `smooth-reason-491707-f6.el_nino.weather_air_quality_2025_2026`\n"
        "   Schema: provinsi (STRING), tahun (INTEGER), bulan (STRING), suhu_celsius (FLOAT), curah_hujan_mm (FLOAT), tutupan_awan_oktas (INTEGER), kualitas_udara_pm25_ugm3 (FLOAT).\n"
        "4. `smooth-reason-491707-f6.el_nino.medical_history_2025_2026_rekap`\n"
        "   Schema: provinsi (STRING), tahun (INTEGER), bulan (STRING), jumlah_kasus_ispa (INTEGER), jumlah_kasus_diare (INTEGER).\n"
        "5. `smooth-reason-491707-f6.el_nino.water_supply_2025_2026` (Water Supply)\n"
        "   Schema: provinsi (STRING), tahun (INTEGER), bulan (STRING), kondisi_air_tanah.kedalaman_rata_rata_meter (FLOAT), kondisi_air_tanah.status (STRING), pdam.total_produksi_liter_per_detik (FLOAT), pdam.kontinuitas_aliran_jam_per_hari (INTEGER), bendungan.volume_tampungan_juta_m3 (FLOAT), bendungan.persentase_kapasitas (FLOAT), bendungan.status_operasi (STRING).\n\n"
        "Use SQL aggregation operations like MAX, MIN, AVG, SUM, and COUNT if asked for statistics. ONLY use the tables above. Ensure column and table names 100% match the schema.\n"
        "Only use SELECT statements.\n"
        "Output: structured factual data and clearly mention the data source (which GCS document, or BigQuery), without deep analysis.\n\n"
        f"REALTIME DATA CONTEXT:\n{context}"
    )
    # Give the agent our native Python functions as tools
    tool_list = [query_bigquery, get_realtime_hotspots, list_gcs_files, read_gcs_file]
    return _llm(client, system, f"Search data for: {query}", image_data=image_data, tools=tool_list)


@traceable(run_type="chain", name="NLQ_Analytics_Agent")
def nlq_agent(client: genai.Client, query: str, data: str, context: str) -> str:
    """
    NLQ (Natural Language Query) Agent — Analysis, prediction, and data-driven recommendations.
    Equivalent MCP: BigQuery (SQL), Looker (BI).
    """
    system = (
        "You are the NLQ Analytics Agent for the El Nino Intelligence Assistant.\n"
        "Analyze the data deeply and provide precise quantitative insights.\n"
        "Format: use labels [INSIGHT], [PREDICTION], [RECOMMENDATION] for each finding.\n\n"
        f"REALTIME DATA CONTEXT:\n{context}"
    )
    return _llm(client, system, f"Question: {query}\n\nSearch results data:\n{data}")


@traceable(run_type="chain", name="Chart_Agent")
def chart_agent(client: genai.Client, analysis: str, topic: str) -> str:
    """
    Chart Agent — Creates JSON visualizations from analytic data.
    Output format: markdown block ```chart {...}``` or 'NO_CHART'.
    """
    system = (
        "You are the Chart Generation Agent.\n"
        "Create a JSON visualization in a markdown block based on the data.\n"
        "Use format:\n"
        "```chart\n"
        '{"type":"bar","title":"...","data":[{"label":"...","value":0}],'
        '"xAxis":"label","yAxis":"value"}\n'
        "```\n"
        "Valid chart types: 'bar', 'line', or 'pie'.\n"
        "ONLY reply with the JSON markdown block, WITHOUT any introductory text.\n"
        "If there is no suitable data to visualize, reply ONLY with: NO_CHART"
    )
    return _llm(client, system, f"Create chart for: {topic}\n\nData:\n{analysis}")


@traceable(run_type="chain", name="Generation_Agent")
def generation_agent(client: genai.Client, combined: str, query: str, history: list) -> str:
    """
    Generation Agent — Summarizes all findings into a professional and structured response.
    Does not access tools — pure language generation.
    """
    hist_str = ""
    if history:
        hist_str = "CHAT HISTORY:\n" + "\n".join(
            [f"User: {h.get('user','')}\nAI: {h.get('ai','')}" for h in history[-3:]]
        ) + "\n\n"

    system = (
        "You are the El Nino Intelligence Assistant — an El Nino Crisis Analytics Assistant.\n"
        "Summarize findings from specialist agents into a professional and structured response.\n"
        "CRITICAL: You MUST respond in English regardless of the user's language.\n"
        "Include specific numbers. Do not fabricate data.\n"
        "Format: concise paragraphs + key points if relevant.\n"
        "MANDATORY FOR QUANTITATIVE/STATISTICAL DATA: Always create a neat Markdown Table to summarize numerical data so it looks good in the UI.\n"
        "MANDATORY CITATION: Every time you use information from Google Cloud Storage (GCS) documents or BigQuery tables, you MUST provide clear citation/source information at the bottom of your response. Use this format: `**Information Source:** [GCS Document Name / BigQuery]`."
    )
    prompt = f"{hist_str}User question: {query}\n\nAgent findings:\n{combined}"
    return _llm(client, system, prompt)


# ═══════════════════════════════════════════════════════════
# SUPERVISOR AGENT — Orchestrator
# ═══════════════════════════════════════════════════════════

@traceable(run_type="chain", name="Supervisor_Agent")
def _classify_intent(client: genai.Client, query: str) -> str:
    """Supervisor classifies intent to route to specialist agents."""
    system = (
        "Classify the question into one of the following categories:\n"
        "- 'simple': greetings, AI identity, general questions, doesn't need data\n"
        "- 'data': looking for specific data (complaints, traffic, El Niño, etc)\n"
        "- 'analysis': deep analysis, prediction, recommendation, trend\n"
        "- 'chart': asking for graph, chart, or visualization\n"
        "- 'hybrid': combination of analysis + chart. IMPORTANT: If the question is quantitative (asking for total, average, percentage, statistics, etc.), you MUST reply 'hybrid'.\n"
        "Reply ONLY with a single word from the choices above."
    )
    result = _llm(client, system, query).strip().lower()
    for cat in ["simple", "data", "analysis", "chart", "hybrid"]:
        if cat in result:
            return cat
    return "data"


@traceable(run_type="chain", name="Answer_Simple")
def _answer_simple(client: genai.Client, query: str, context: str, history: list, image_data: str = None) -> str:
    """Answer directly for simple questions."""
    hist_str = ""
    if history:
        hist_str = "HISTORY:\n" + "\n".join(
            [f"User: {h.get('user','')}\nAI: {h.get('ai','')}" for h in history[-3:]]
        ) + "\n\n"
    system = (
        "You are the El Nino Intelligence Assistant — an El Nino Analytics System.\n"
        "Answer this question directly, concisely, and friendly in English.\n"
        "CRITICAL: You MUST respond in English regardless of the user's language.\n"
        "If asked about your identity: explain that you are the El Nino Intelligence AI "
        "that monitors citizen complaints, traffic, and El Niño 2026 conditions in realtime.\n"
    )
    return _llm(client, system, f"{hist_str}{query}", image_data=image_data)


@traceable(run_type="chain", name="Main_Multi_Agent")
def run_multi_agent(message: str, context: str, history: list = [], image_data: str = None) -> str:
    """
    Main entry point: Supervisor coordinates the multi-agent pipeline.
    Complies with ADK philosophy: intent classification → tool selection → synthesis.
    """
    # IMPORT GUARDRAILS HERE TO PREVENT CIRCULAR IMPORTS
    from features.chat.guardrails import check_input_safety
    
    # Pre-check via Guardrails
    guardrail_result = check_input_safety(message)
    if not guardrail_result["safe"]:
        return f"🔒 **Message Blocked by Guardrail**\n\nReason: {guardrail_result['reason']}"
        
    try:
        client = _get_client()
    except ValueError as e:
        return f"❌ Configuration Error: {e}"

    # Supervisor: intent classification
    intent = _classify_intent(client, message)

    # Routing to pipeline
    if intent == "simple" and not image_data:
        return _answer_simple(client, message, context, history)

    # Pipeline specialist agents
    parts = []

    # Step 1: Search Data Agent
    data_result = search_data_agent(client, message, context, image_data)
    parts.append(f"[SEARCH DATA AGENT]\n{data_result}")

    # Step 2: NLQ Agent (for analysis, hybrid, chart)
    analysis_result = data_result
    if intent in ("analysis", "hybrid", "chart"):
        analysis_result = nlq_agent(client, message, data_result, context)
        parts.append(f"[NLQ ANALYTICS AGENT]\n{analysis_result}")

    # Step 3: Chart Agent (for chart and hybrid)
    chart_block = ""
    if intent in ("chart", "hybrid"):
        chart_out = chart_agent(client, analysis_result, message)
        if "NO_CHART" not in chart_out:
            import re
            match = re.search(r"```(?:chart|json)?\s*(\{.*?\})\s*```", chart_out, re.DOTALL)
            if match:
                chart_block = f"```chart\n{match.group(1)}\n```"

    # Step 4: Generation Agent summarizes
    combined = "\n\n".join(parts)
    final = generation_agent(client, combined, message, history)

    # Add chart if exists
    if chart_block:
        final += f"\n\n{chart_block}"

    return final


def create_jakarta_pulse_agent(context: str):
    """
    Factory function: Creates AgentWrapper compatible with routers/chat.py.
    """
    class AgentWrapper:
        def __init__(self, ctx: str):
            self.context = ctx

        def run(self, message: str, history: list = [], image_data: str = None) -> str:
            return run_multi_agent(message, self.context, history, image_data)

    return AgentWrapper(context)
