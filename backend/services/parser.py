import os
import re
from typing import Dict, Any

# Fallback text extractors
from pdfminer.high_level import extract_text as extract_pdf_text
import docx

def extract_text_from_pdf(file_path: str) -> str:
    try:
        return extract_pdf_text(file_path)
    except Exception as e:
        print(f"pdfminer failed: {e}")
        return ""

def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        fullText = []
        for para in doc.paragraphs:
            fullText.append(para.text)
        return '\n'.join(fullText)
    except Exception as e:
        print(f"python-docx failed: {e}")
        return ""

def extract_text_from_doc(file_path: str) -> str:
    # doc files are binary and require antiword or specialized libraries.
    # As a robust fallback, we will read the file and extract printable ascii chunks.
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
        printable = re.findall(b'[\x20-\x7E\s]{4,}', content)
        return "\n".join([s.decode('ascii', errors='ignore') for s in printable])
    except Exception as e:
        print(f"doc extraction failed: {e}")
        return ""

def extract_raw_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == '.pdf':
        return extract_text_from_pdf(file_path)
    elif ext == '.docx':
        return extract_text_from_docx(file_path)
    elif ext == '.doc':
        return extract_text_from_doc(file_path)
    return ""

def fallback_parse(file_path: str) -> Dict[str, Any]:
    raw_text = extract_raw_text(file_path)
    
    # 1. Extract Email
    email = None
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
    if email_match:
        email = email_match.group(0)

    # 2. Extract Phone
    phone = None
    phone_match = re.search(r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)
    if phone_match:
        phone = phone_match.group(0)

    # 3. Extract Name
    name = None
    lines = [line.strip() for line in raw_text.split('\n') if line.strip()]
    if lines:
        for line in lines[:5]:
            if "@" not in line and not re.search(r'\d', line) and len(line) < 50 and len(line) > 3:
                name = line
                break
    if not name:
        name = "Unknown Candidate"

    # 4. Extract Skills
    common_skills = {
        "python", "sql", "java", "javascript", "typescript", "c++", "c#", "react", "angular", "vue",
        "next.js", "docker", "kubernetes", "fastapi", "django", "flask", "aws", "gcp", "azure", "git",
        "html", "css", "mongodb", "postgresql", "mysql", "redis", "pytorch", "tensorflow", "graphql"
    }
    extracted_skills = []
    text_lower = raw_text.lower()
    for skill in common_skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
            display_name = skill.upper() if skill in ["sql", "html", "css", "aws", "gcp", "api"] else skill.capitalize()
            if skill == "javascript": display_name = "JavaScript"
            if skill == "typescript": display_name = "TypeScript"
            if skill == "next.js": display_name = "Next.js"
            if skill == "fastapi": display_name = "FastAPI"
            if skill == "mongodb": display_name = "MongoDB"
            if skill == "postgresql": display_name = "PostgreSQL"
            if skill == "mysql": display_name = "MySQL"
            if skill == "c++": display_name = "C++"
            if skill == "c#": display_name = "C#"
            extracted_skills.append(display_name)

    # 5. Extract Education
    education = []
    edu_keywords = ["bachelor", "master", "phd", "degree", "university", "college", "school", "bs", "ms", "b.tech", "m.tech", "b.sc", "m.sc"]
    for line in raw_text.split('\n'):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in edu_keywords):
            if len(line.strip()) < 100 and len(line.strip()) > 5:
                education.append(line.strip())
                
    # 6. Extract Experience
    experience = []
    exp_keywords = ["experience", "work", "employment", "history", "job", "position", "role", "developer", "engineer", "manager"]
    for line in raw_text.split('\n'):
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in exp_keywords):
            if re.search(r'\b(19|20)\d{2}\b|\bpresent\b|\bcurrent\b', line_lower):
                if len(line.strip()) < 120 and len(line.strip()) > 5:
                    experience.append(line.strip())

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": extracted_skills,
        "education": education,
        "experience": experience,
        "raw_text": raw_text
    }

def parse_resume_file(file_path: str) -> Dict[str, Any]:
    try:
        # Check if pyresparser is installed
        from pyresparser import ResumeParser
        import nltk
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)
        
        data = ResumeParser(file_path).get_extracted_data()
        raw_text = extract_raw_text(file_path)
        
        return {
            "name": data.get("name") or "Unknown Candidate",
            "email": data.get("email"),
            "phone": data.get("mobile_number"),
            "skills": data.get("skills") or [],
            "education": data.get("degree") or [],
            "experience": data.get("experience") or [],
            "raw_text": raw_text
        }
    except Exception as e:
        print(f"pyresparser failed or not installed. Falling back to pdfminer/docx/regex. Error: {e}")
        return fallback_parse(file_path)
