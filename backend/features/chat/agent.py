"""
Jakarta Pulse Multi-Agent System
=================================
Arsitektur: Multi-Agent dengan google.genai SDK (Function Calling native)
Compliant dengan Google ADK philosophy: Agent, Tool, Orchestration, Context injection.

HIERARKI AGEN:
  Supervisor → Routes ke agen spesialis berdasarkan intent
  ├── search_data_agent   → Mencari data realtime dari konteks (BigQuery/GCS-ready)
  ├── nlq_agent           → Analisis mendalam, prediksi, rekomendasi
  ├── chart_agent         → Membuat visualisasi JSON chart
  └── generation_agent    → Merangkum output menjadi respons profesional
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
        raise ValueError("GEMINI_API_KEY tidak ditemukan di .env")
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
    Agent Search Data — Mengekstrak data spesifik dari konteks realtime.
    Dilengkapi Native Gemini Tools: query_bigquery, get_realtime_hotspots, list_gcs_files.
    """
    system = (
        "Kamu adalah Data Search Agent El Nino Inteligence Assistant.\n"
        "Ekstrak data spesifik yang relevan dari konteks data realtime, gunakan tools jika perlu mencari di BigQuery, GCS, atau local hotspots.\n"
        "PANDUAN PENGGUNAAN SUMBER DATA:\n"
        "1. JIKA pertanyaan menyangkut konsep El Nino, tantangan, upaya mitigasi, peran pemerintah, kebijakan, atau SOP ENSO: WAJIB gunakan tool read_gcs_file(bucket_name='el_nino01', file_name='nama_file'). 3 dokumen terkait di GCS: 'El-Nino-La-Nina-2020_Summary.md', 'Mitigasi_El_Nino_Komprehensif.docx', dan 'ENSO_SOPs_10Page_Summary.pdf'. (Panggil list_gcs_files jika butuh cek).\n"
        "2. JIKA pertanyaan memiliki unsur kuantitatif (kondisi data, kasus, kejadian, sebaran, analisis): WAJIB gunakan tool query_bigquery untuk mencari data real.\n"
        "3. Untuk rekomendasi dan solusi: kombinasikan akses dari BigQuery dan dokumen di GCS.\n\n"
        "Untuk mengakses BigQuery, panggil tool query_bigquery(sql_query) dengan query Google Standard SQL yang valid.\n"
        "Tabel BigQuery yang tersedia:\n"
        "1. `smooth-reason-491707-f6.el_nino.rekap_elnino_baru_2025_2026` (Tabel Gabungan Utama)\n"
        "   Skema: provinsi (STRING), tahun (INTEGER), bulan (STRING), suhu_celsius (FLOAT), curah_hujan_mm (FLOAT), tutupan_awan_oktas (INT), kualitas_udara_pm25_ugm3 (FLOAT), kedalaman_rata_rata_meter (FLOAT), status (STRING), total_produksi_liter_per_detik (FLOAT), kontinuitas_aliran_jam_per_hari (INT), volume_tampungan_juta_m3 (FLOAT), persentase_kapasitas (FLOAT), status_operasi (STRING), jumlah_kasus_ispa (INT), jumlah_kasus_diare (INT), ketersediaan_ton (FLOAT), kebutuhan_ton (FLOAT), neraca_ton (FLOAT), rasio_ketersediaan_kebutuhan_persen (FLOAT), jumlah_kebakaran_gedung_dan_permukiman (INT), jumlah_kebakaran_hutan_dan_lahan (INT), jumlah_cuaca_ekstrem (INT), jumlah_kekeringan (INT).\n"
        "2. `smooth-reason-491707-f6.el_nino.food_availability_rekap_2025_2026`\n"
        "   Skema: provinsi (STRING), tahun (INTEGER), bulan (STRING), ketersediaan_ton (FLOAT), kebutuhan_ton (FLOAT), neraca_ton (FLOAT), rasio_ketersediaan_kebutuhan_persen (FLOAT).\n"
        "3. `smooth-reason-491707-f6.el_nino.weather_air_quality_2025_2026`\n"
        "   Skema: provinsi (STRING), tahun (INTEGER), bulan (STRING), suhu_celsius (FLOAT), curah_hujan_mm (FLOAT), tutupan_awan_oktas (INTEGER), kualitas_udara_pm25_ugm3 (FLOAT).\n"
        "4. `smooth-reason-491707-f6.el_nino.medical_history_2025_2026_rekap`\n"
        "   Skema: provinsi (STRING), tahun (INTEGER), bulan (STRING), jumlah_kasus_ispa (INTEGER), jumlah_kasus_diare (INTEGER).\n"
        "5. `smooth-reason-491707-f6.el_nino.water_supply_2025_2026` (Water Supply)\n"
        "   Skema: provinsi (STRING), tahun (INTEGER), bulan (STRING), kondisi_air_tanah (RECORD), pdam (RECORD), bendungan (RECORD).\n\n"
        "Gunakan operasi agregasi SQL seperti MAX, MIN, AVG, SUM, dan COUNT jika ditanya statistik. HANYA gunakan tabel-tabel di atas (JANGAN gunakan rekap_kejadian_elnino_2024_2026). Pastikan nama kolom dan tabel 100% sama dengan skema.\n"
        "Hanya gunakan instruksi SELECT.\n"
        "Output: data faktual terstruktur beserta sebutkan dengan jelas sumber datanya (GCS dokumen apa, atau BigQuery), tanpa analisis mendalam.\n\n"
        f"KONTEKS DATA REALTIME:\n{context}"
    )
    # Give the agent our native Python functions as tools
    tool_list = [query_bigquery, get_realtime_hotspots, list_gcs_files, read_gcs_file]
    return _llm(client, system, f"Cari data untuk: {query}", image_data=image_data, tools=tool_list)


@traceable(run_type="chain", name="NLQ_Analytics_Agent")
def nlq_agent(client: genai.Client, query: str, data: str, context: str) -> str:
    """
    Agent NLQ (Natural Language Query) — Analisis, prediksi, rekomendasi berbasis data.
    Equivalent MCP: BigQuery (SQL), Looker (BI).
    """
    system = (
        "Kamu adalah NLQ Analytics Agent El Nino Inteligence Assistant.\n"
        "Analisis data secara mendalam, berikan insight kuantitatif presisi.\n"
        "Format: gunakan label [INSIGHT], [PREDIKSI], [REKOMENDASI] untuk setiap temuan.\n\n"
        f"KONTEKS DATA REALTIME:\n{context}"
    )
    return _llm(client, system, f"Pertanyaan: {query}\n\nData hasil pencarian:\n{data}")


@traceable(run_type="chain", name="Chart_Agent")
def chart_agent(client: genai.Client, analysis: str, topic: str) -> str:
    """
    Agent Chart — Membuat visualisasi JSON dari data analitik.
    Format output: markdown block ```chart {...}``` atau 'NO_CHART'.
    """
    system = (
        "Kamu adalah Chart Generation Agent.\n"
        "Buat visualisasi JSON dalam format markdown block berdasarkan data.\n"
        "Gunakan format:\n"
        "```chart\n"
        '{"type":"bar","title":"...","data":[{"label":"...","value":0}],'
        '"xAxis":"label","yAxis":"value"}\n'
        "```\n"
        "Tipe chart yang valid: 'bar', 'line', atau 'pie'.\n"
        "HANYA balas dengan block markdown JSON tersebut, TANPA teks pengantar apapun.\n"
        "Jika tidak ada data yang cocok untuk divisualisasikan, balas hanya: NO_CHART"
    )
    return _llm(client, system, f"Buat chart untuk: {topic}\n\nData:\n{analysis}")


@traceable(run_type="chain", name="Generation_Agent")
def generation_agent(client: genai.Client, combined: str, query: str, history: list) -> str:
    """
    Agent Generation — Merangkum semua temuan menjadi respons profesional dan terstruktur.
    Tidak mengakses tools apapun — murni language generation.
    """
    hist_str = ""
    if history:
        hist_str = "RIWAYAT CHAT:\n" + "\n".join(
            [f"User: {h.get('user','')}\nAI: {h.get('ai','')}" for h in history[-3:]]
        ) + "\n\n"

    system = (
        "Kamu adalah El Nino Inteligence Assistant — Asisten Analitik El Nino Crisis.\n"
        "Rangkum temuan dari agen spesialis menjadi respons profesional dan terstruktur.\n"
        "CRITICAL: Kamu WAJIB merespons menggunakan BAHASA YANG SAMA persis dengan bahasa pertanyaan user (Jika user bahasa Inggris, balas full Inggris. Jika Indonesia, balas Indonesia).\n"
        "Sertakan angka spesifik. Jangan mengarang data.\n"
        "Format: paragraf ringkas + poin kunci jika relevan.\n"
        "WAJIB JIKA DATA KUANTITATIF/STATISTIK: Selalu buatkan Markdown Table (tabel) yang rapi untuk merangkum data angka tersebut agar UI terlihat bagus.\n"
        "WAJIB SITASI: Setiap kali kamu menggunakan informasi yang berasal dari Dokumen di Google Cloud Storage (GCS) atau tabel BigQuery, kamu WAJIB memberikan informasi kutipan/sumber (citation) yang JELAS di bagian bawah responsmu. Gunakan format blok `**Sumber Informasi:** [Nama Dokumen GCS / BigQuery]`."
    )
    prompt = f"{hist_str}Pertanyaan user: {query}\n\nTemuan agen:\n{combined}"
    return _llm(client, system, prompt)


# ═══════════════════════════════════════════════════════════
# SUPERVISOR AGENT — Orchestrator
# ═══════════════════════════════════════════════════════════

@traceable(run_type="chain", name="Supervisor_Agent")
def _classify_intent(client: genai.Client, query: str) -> str:
    """Supervisor mengklasifikasikan intent untuk routing ke agen spesialis."""
    system = (
        "Klasifikasikan pertanyaan ke satu kategori berikut:\n"
        "- 'simple': sapaan, identitas AI, pertanyaan umum, tidak butuh data\n"
        "- 'data': mencari data spesifik (keluhan, traffic, El Niño, dll)\n"
        "- 'analysis': analisis mendalam, prediksi, rekomendasi, trend\n"
        "- 'chart': minta grafik, chart, atau visualisasi\n"
        "- 'hybrid': kombinasi analisis + chart. PENTING: Jika pertanyaan bersifat kuantitatif (menanyakan jumlah, total, rata-rata, persentase, statistik, dll), WAJIB balas 'hybrid'.\n"
        "Balas HANYA dengan satu kata dari pilihan di atas."
    )
    result = _llm(client, system, query).strip().lower()
    for cat in ["simple", "data", "analysis", "chart", "hybrid"]:
        if cat in result:
            return cat
    return "data"


@traceable(run_type="chain", name="Answer_Simple")
def _answer_simple(client: genai.Client, query: str, context: str, history: list, image_data: str = None) -> str:
    """Jawab langsung untuk pertanyaan sederhana."""
    hist_str = ""
    if history:
        hist_str = "RIWAYAT:\n" + "\n".join(
            [f"User: {h.get('user','')}\nAI: {h.get('ai','')}" for h in history[-3:]]
        ) + "\n\n"
    system = (
        "Kamu adalah El Nino Inteligence Assistant — Sistem Analitik El Nino.\n"
        "Jawab pertanyaan ini secara langsung, ringkas, dan ramah.\n"
        "CRITICAL: Jawab menggunakan bahasa yang sama persis dengan yang digunakan oleh user di pertanyaannya (Inggris atau Indonesia).\n"
        "Jika ditanya identitas: jelaskan bahwa kamu adalah AI analitik El Nino Inteligence "
        "yang memantau keluhan warga, lalu lintas, dan kondisi El Niño 2026 secara realtime.\n"
    )
    return _llm(client, system, f"{hist_str}{query}", image_data=image_data)


@traceable(run_type="chain", name="Main_Multi_Agent")
def run_multi_agent(message: str, context: str, history: list = [], image_data: str = None) -> str:
    """
    Entry point utama: Supervisor mengkoordinasikan pipeline multi-agen.
    Sesuai ADK philosophy: intent classification → tool selection → synthesis.
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
        return f"❌ Konfigurasi Error: {e}"

    # Supervisor: klasifikasi intent
    intent = _classify_intent(client, message)

    # Routing ke pipeline
    if intent == "simple" and not image_data:
        return _answer_simple(client, message, context, history)

    # Pipeline specialist agents
    parts = []

    # Step 1: Search Data Agent
    data_result = search_data_agent(client, message, context, image_data)
    parts.append(f"[SEARCH DATA AGENT]\n{data_result}")

    # Step 2: NLQ Agent (untuk analysis, hybrid, chart)
    analysis_result = data_result
    if intent in ("analysis", "hybrid", "chart"):
        analysis_result = nlq_agent(client, message, data_result, context)
        parts.append(f"[NLQ ANALYTICS AGENT]\n{analysis_result}")

    # Step 3: Chart Agent (untuk chart dan hybrid)
    chart_block = ""
    if intent in ("chart", "hybrid"):
        chart_out = chart_agent(client, analysis_result, message)
        if "NO_CHART" not in chart_out:
            import re
            match = re.search(r"```(?:chart|json)?\s*(\{.*?\})\s*```", chart_out, re.DOTALL)
            if match:
                chart_block = f"```chart\n{match.group(1)}\n```"

    # Step 4: Generation Agent merangkum
    combined = "\n\n".join(parts)
    final = generation_agent(client, combined, message, history)

    # Tambahkan chart jika ada
    if chart_block:
        final += f"\n\n{chart_block}"

    return final


def create_jakarta_pulse_agent(context: str):
    """
    Factory function: Membuat AgentWrapper yang kompatibel dengan routers/chat.py.
    """
    class AgentWrapper:
        def __init__(self, ctx: str):
            self.context = ctx

        def run(self, message: str, history: list = [], image_data: str = None) -> str:
            return run_multi_agent(message, self.context, history, image_data)

    return AgentWrapper(context)
