with open('backend/features/chat/tools.py', 'a') as f:
    f.write('''
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
            text = """
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
''')
