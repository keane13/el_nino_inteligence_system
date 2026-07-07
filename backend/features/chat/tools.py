import os
from google.cloud import bigquery, storage

# In Cloud Run, Default Service Account (ADC) is used automatically.
# In local, make sure GOOGLE_APPLICATION_CREDENTIALS is set in your .env or shell.
# If not set, it might fallback to local paths but we don't hardcode them here.

# Initialize clients globally using Service Account keys if provided
try:
    from google.oauth2 import service_account
    from dotenv import load_dotenv
    load_dotenv()
    
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "smooth-reason-491707-f6")
    bq_key_path = os.getenv("BIGQUERY_SERVICE_ACCOUNT")
    gcs_key_path = os.getenv("GCSTORAGE_SERVICE_ACCOUNT")
    
    if bq_key_path and os.path.exists(bq_key_path):
        bq_creds = service_account.Credentials.from_service_account_file(bq_key_path)
        bq_client = bigquery.Client(credentials=bq_creds, project=project_id)
    else:
        bq_client = bigquery.Client(project=project_id)
        
    if gcs_key_path and os.path.exists(gcs_key_path):
        gcs_creds = service_account.Credentials.from_service_account_file(gcs_key_path)
        storage_client = storage.Client(credentials=gcs_creds, project=project_id)
    else:
        storage_client = storage.Client(project=project_id)
except Exception as e:
    print(f"Warning: Failed to initialize Google Cloud clients with explicit keys: {e}")
    # Fallback
    bq_client = bigquery.Client(project="smooth-reason-491707-f6")
    storage_client = storage.Client(project="smooth-reason-491707-f6")

def query_bigquery(sql_query: str) -> str:
    """
    Executes a Google Standard SQL query against BigQuery.
    Tables available: 
    - smooth-reason-491707-f6.el_nino.rekap_elnino_baru_2025_2026
    - smooth-reason-491707-f6.el_nino.food_availability_rekap_2025_2026
    - smooth-reason-491707-f6.el_nino.weather_air_quality_2025_2026
    - smooth-reason-491707-f6.el_nino.medical_history_2025_2026_rekap
    - smooth-reason-491707-f6.el_nino.water_supply_2025_2026
    Do NOT use DML (INSERT/UPDATE/DELETE). Only SELECT queries are allowed.
    """
    try:
        if not sql_query.strip().upper().startswith("SELECT"):
            return "Error: Only SELECT queries are allowed."
            
        query_job = bq_client.query(sql_query)
        results = query_job.result()
        
        rows = [dict(row) for row in results]
        import json
        return "BigQuery Results:\n" + json.dumps(rows, default=str)
    except Exception as e:
        return f"Error executing SQL: {str(e)}"

def get_realtime_hotspots(province_name: str = None) -> str:
    """
    Get realtime hotspot and average karhutla area from local data.
    If province_name is provided, filters for that province.
    """
    try:
        from data import INDONESIA_PROVINCES
        if province_name:
            filtered = [p for p in INDONESIA_PROVINCES if p["name"].lower() == province_name.lower()]
            if filtered:
                p = filtered[0]
                return f"{p['name']}: {p['fire_base']} hotspots, Avg Area: {p['avg_karhutla_area']} Ha"
            return f"No realtime data found for province: {province_name}"
        
        # Return top 5
        sorted_provs = sorted(INDONESIA_PROVINCES, key=lambda x: x.get("fire_base", 0), reverse=True)
        res = "Top 5 Hotspot Provinces (Realtime):\n"
        for p in sorted_provs[:5]:
            res += f"- {p['name']}: {p['fire_base']} hotspots, Avg Area: {p['avg_karhutla_area']} Ha\n"
        return res
    except Exception as e:
        return f"Error fetching realtime data: {str(e)}"

def list_gcs_files(bucket_name: str = "el_nino01") -> str:
    """
    List files available in the Google Cloud Storage bucket.
    """
    try:
        bucket = storage_client.bucket(bucket_name)
        blobs = bucket.list_blobs()
        files = [blob.name for blob in blobs]
        if not files:
            return f"The bucket {bucket_name} is empty."
        return f"Files in {bucket_name}:\n" + "\n".join([f"- {f}" for f in files])
    except Exception as e:
        return f"Error accessing GCS bucket {bucket_name}: {str(e)}"

def read_gcs_file(bucket_name: str, file_name: str) -> str:
    """Read the text content of a file (PDF, TXT, MD, DOCX) from Google Cloud Storage."""
    try:
        import fitz  # PyMuPDF
        import docx
        from io import BytesIO
        
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(file_name)
        if not blob.exists(): return f"File {file_name} not found in {bucket_name}"
        
        content_bytes = blob.download_as_bytes()
        
        if file_name.lower().endswith('.pdf'):
            doc = fitz.open(stream=content_bytes, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            return text
        elif file_name.lower().endswith('.docx'):
            doc = docx.Document(BytesIO(content_bytes))
            return "\n".join([p.text for p in doc.paragraphs])
        else:
            return content_bytes.decode('utf-8')
    except Exception as e:
        return f"Error reading {file_name}: {str(e)}"
