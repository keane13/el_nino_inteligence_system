import guardrails as gd
import re

# Custom validator logic for factual grounding
def check_factual_grounding(output: str, context: str) -> bool:
    """
    In a real implementation, you might use an LLM or cross-encoder to check
    if the `output` is factually grounded in the `context`.
    For this demo, we'll do a basic keyword check or return True.
    """
    # For a full implementation, you can build a custom Validator class from Guardrails.
    # Here we simply provide a placeholder function.
    return True

# Initialize Guard
# Note: In Guardrails 0.4+, you typically subclass Validator for custom logic,
# but for PII redaction, RegexMatch handles simple cases.
# We will use string parsing in main.py to redact the matched regex.
import re

def redact_indonesian_pii(text: str) -> str:
    """Fallback method for PII redaction if Guardrails validators are complex to chain."""
    # Redact NIK
    text = re.sub(r"\b\d{16}\b", "[NIK REDACTED]", text)
    # Redact Phone
    text = re.sub(r"\b(?:\+62|08)\d{8,12}\b", "[PHONE REDACTED]", text)
    return text

def validate_response(text: str, context: str) -> str:
    """Applies guardrails and grounding checks."""
    text = redact_indonesian_pii(text)
    
    if not check_factual_grounding(text, context):
        return "I'm sorry, I cannot verify that information."
    
    return text
