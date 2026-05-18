"""
Normalizer Agent — Node 2 of the LangGraph pipeline.
Uses OpenAI LLM to extract structured JSON from raw resume text,
normalising skill names to canonical forms.
"""

import json
import os
from typing import Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage


# Canonical skill mapping for normalisation
SKILL_ALIASES: dict[str, str] = {
    "reactjs": "React",
    "react.js": "React",
    "react js": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vuejs": "Vue.js",
    "vue.js": "Vue.js",
    "angularjs": "Angular",
    "angular.js": "Angular",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node js": "Node.js",
    "expressjs": "Express.js",
    "express.js": "Express.js",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "python3": "Python",
    "py": "Python",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "golang": "Go",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "mysql": "MySQL",
    "aws": "AWS",
    "amazon web services": "AWS",
    "gcp": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "azure": "Azure",
    "microsoft azure": "Azure",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "ml": "Machine Learning",
    "machine learning": "Machine Learning",
    "dl": "Deep Learning",
    "deep learning": "Deep Learning",
    "nlp": "NLP",
    "natural language processing": "NLP",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "Scikit-learn",
    "sklearn": "Scikit-learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "tailwindcss": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "tailwind": "Tailwind CSS",
    "html5": "HTML",
    "html": "HTML",
    "css3": "CSS",
    "css": "CSS",
    "sass": "Sass",
    "scss": "Sass",
    "graphql": "GraphQL",
    "rest api": "REST APIs",
    "restful": "REST APIs",
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "jira": "Jira",
    "figma": "Figma",
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    "redis": "Redis",
    "kafka": "Apache Kafka",
    "rabbitmq": "RabbitMQ",
    "terraform": "Terraform",
    "linux": "Linux",
    "sql": "SQL",
    "nosql": "NoSQL",
}


def _normalise_skill(skill: str) -> str:
    """Map a skill string to its canonical form."""
    key = skill.strip().lower()
    return SKILL_ALIASES.get(key, skill.strip())


def _extract_resume_demo(raw_text: str) -> dict:
    """
    Fallback demo extraction using regex patterns when LLM is unavailable.
    Extracts basic resume information without API calls.
    """
    import re
    
    text_lower = raw_text.lower()
    
    # Extract name (usually first non-empty line or after common headers)
    name = "Unknown"
    lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
    if lines:
        name = lines[0]
    
    # Extract email
    email = None
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', raw_text)
    if email_match:
        email = email_match.group(0)
    
    # Extract phone
    phone = None
    phone_match = re.search(r'\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', raw_text)
    if phone_match:
        phone = phone_match.group(0)
    
    # Extract skills by looking for common keywords
    technical_skills = []
    skill_keywords = [
        'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'kotlin',
        'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'fastapi',
        'sql', 'postgresql', 'mongodb', 'mysql', 'redis', 'docker', 'kubernetes',
        'aws', 'gcp', 'azure', 'git', 'github', 'gitlab', 'ci/cd', 'jenkins',
        'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'machine learning',
        'html', 'css', 'sass', 'tailwind', 'rest api', 'graphql', 'websocket',
        'agile', 'scrum', 'jira', 'linux', 'windows', 'macos',
    ]
    
    for skill in skill_keywords:
        if skill in text_lower:
            technical_skills.append(_normalise_skill(skill))
    
    # Extract projects from raw text in demo mode
    projects = []
    project_section = []
    in_projects = False
    
    for line in raw_text.split('\n'):
        line_s = line.strip()
        line_l = line_s.lower()
        if any(h in line_l for h in ["projects", "personal projects", "academic projects", "key projects"]):
            in_projects = True
            continue
        if in_projects:
            if any(h in line_l for h in ["education", "experience", "skills", "certifications", "employment", "summary", "languages"]):
                in_projects = False
            elif line_s:
                project_section.append(line_s)
                
    # Parse the collected project lines
    current_project = None
    for item in project_section:
        if len(item) < 60 and not item.endswith('.') and any(keyword in item.lower() for keyword in ["system", "app", "platform", "website", "application", "tool", "bot", "engine", "classifier", "model", "analyzer"]):
            if current_project:
                projects.append(current_project)
            
            proj_skills = []
            for skill in technical_skills:
                if skill.lower() in item.lower():
                    proj_skills.append(skill)
            
            current_project = {
                "name": item.strip(" -•*"),
                "description": "",
                "technologies": proj_skills
            }
        elif current_project:
            current_project["description"] = (current_project["description"] + " " + item).strip()
            for skill in technical_skills:
                if skill.lower() in item.lower() and skill not in current_project["technologies"]:
                    current_project["technologies"].append(skill)

    if current_project:
        projects.append(current_project)
        
    # Fallback to extract technology-related lines if no structured projects found
    if not projects:
        project_keywords = ["built", "developed", "created", "implemented", "designed", "engineered"]
        for line in raw_text.split('\n'):
            line_s = line.strip()
            if any(kw in line_s.lower() for kw in project_keywords) and len(line_s) > 20:
                proj_skills = [skill for skill in technical_skills if skill.lower() in line_s.lower()]
                if proj_skills:
                    name_words = [w for w in line_s.split()[:4] if w.istitle() or w.lower() in project_keywords]
                    projects.append({
                        "name": " ".join(name_words) or f"{proj_skills[0]} Project",
                        "description": line_s,
                        "technologies": proj_skills
                    })
                    if len(projects) >= 3:
                        break

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "summary": "Resume processed in demo mode.",
        "experience": [],
        "education": [],
        "technical_skills": technical_skills,
        "certifications": [],
        "projects": projects,
    }


SYSTEM_PROMPT = """You are an expert resume parser. Given raw resume text, extract the following information as a JSON object:

{
  "name": "Full name of the candidate",
  "email": "Email address if present, else null",
  "phone": "Phone number if present, else null",
  "summary": "Brief professional summary (1-2 sentences)",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Duration (e.g., Jan 2020 - Mar 2023)",
      "highlights": ["Key achievement or responsibility"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University/College Name",
      "year": "Graduation year or duration"
    }
  ],
  "technical_skills": ["Skill1", "Skill2", "Skill3"],
  "certifications": ["Certification Name"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Short description of what was built and accomplished",
      "technologies": ["React", "Python"]
    }
  ]
}

Rules:
- Extract ONLY what is explicitly stated. Do NOT hallucinate.
- For technical_skills, list every technology, language, framework, or tool mentioned.
- Return ONLY valid JSON. No markdown, no explanation, no wrapping.
"""


def normalizer_agent(state: dict[str, Any]) -> dict[str, Any]:
    """
    Takes raw_text from parser, sends to OpenAI for structured extraction,
    then normalises skill names.

    State Input:
        - raw_text: string from parser agent

    State Output:
        - parsed_data: structured dict with normalised skills
        - agent_trace: updated
    """
    raw_text: str = state["raw_text"]
    trace: list = state.get("agent_trace", [])

    api_key = os.getenv("OPENAI_API_KEY")
    print(f"🤖 Normalizer: Starting extraction (raw_text length: {len(raw_text)})")
    
    # Fallback to demo mode if no API key
    if not api_key:
        print("⚠️  No OpenAI API key found. Using demo extraction mode.")
        parsed = _extract_resume_demo(raw_text)
        trace.append({
            "agent": "Normalizer",
            "status": "completed (demo mode)",
            "skills_found": len(parsed.get("technical_skills", [])),
        })
        print(f"✅ Normalizer: Found {len(parsed.get('technical_skills', []))} skills in demo mode")
        return {
            **state,
            "parsed_data": parsed,
            "agent_trace": trace,
        }

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        api_key=api_key,
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Here is the raw resume text:\n\n{raw_text[:8000]}"),
    ]

    try:
        response = llm.invoke(messages)
        content = response.content.strip()
    except Exception as e:
        print(f"❌ LLM Error: {str(e)}")
        import traceback
        traceback.print_exc()
        print("⚠️  Falling back to demo extraction mode.")
        # Fallback - use demo extraction
        parsed = _extract_resume_demo(raw_text)
        trace.append({
            "agent": "Normalizer",
            "status": "completed (fallback mode)",
            "skills_found": len(parsed.get("technical_skills", [])),
        })
        return {
            **state,
            "parsed_data": parsed,
            "agent_trace": trace,
        }

    # Strip markdown code fences if the model wraps them
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()

    try:
        parsed: dict = json.loads(content)
    except json.JSONDecodeError:
        # Fallback - return minimal structure
        parsed = {
            "name": "Unknown",
            "email": None,
            "phone": None,
            "summary": "Could not parse resume.",
            "experience": [],
            "education": [],
            "technical_skills": [],
            "certifications": [],
        }

    # Normalise skills
    raw_skills = parsed.get("technical_skills", [])
    normalised = list(dict.fromkeys(_normalise_skill(s) for s in raw_skills))  # dedupe
    parsed["technical_skills"] = normalised

    trace.append({
        "agent": "Normalizer",
        "status": "completed",
        "skills_found": len(normalised),
    })

    return {
        **state,
        "parsed_data": parsed,
        "agent_trace": trace,
    }
