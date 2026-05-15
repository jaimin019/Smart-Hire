"""
Parser Agent — Node 1 of the LangGraph pipeline.
Extracts raw text from uploaded PDF/DOCX resumes using PyMuPDF or python-docx.
"""

import fitz  # PyMuPDF
from docx import Document
from io import BytesIO
from typing import Any


def parser_agent(state: dict[str, Any]) -> dict[str, Any]:
    """
    Reads uploaded file bytes and extracts raw text.
    Supports PDF (via PyMuPDF) and DOCX (via python-docx).

    State Input:
        - file_bytes: bytes of the uploaded file
        - file_name: original filename (used to detect extension)

    State Output:
        - raw_text: extracted text string
        - agent_trace: updated with parser status
    """
    file_bytes: bytes = state["file_bytes"]
    file_name: str = state.get("file_name", "resume.pdf")
    trace: list = state.get("agent_trace", [])

    ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "pdf"
    print(f"📄 Parser: Extracting text from {file_name} ({ext})")

    raw_text = ""

    try:
        if ext == "pdf":
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                raw_text += page.get_text()
            doc.close()
            print(f"✅ Parser: Extracted {len(raw_text)} chars from PDF")
        elif ext in ("docx", "doc"):
            document = Document(BytesIO(file_bytes))
            raw_text = "\n".join(para.text for para in document.paragraphs)
            print(f"✅ Parser: Extracted {len(raw_text)} chars from DOCX")
        else:
            # Fallback — try treating as plain text
            raw_text = file_bytes.decode("utf-8", errors="ignore")
            print(f"✅ Parser: Extracted {len(raw_text)} chars from text file")
    except Exception as e:
        print(f"❌ Parser Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raw_text = ""

    trace.append({
        "agent": "Parser",
        "status": "completed",
        "chars_extracted": len(raw_text),
    })

    return {
        **state,
        "raw_text": raw_text,
        "agent_trace": trace,
    }
