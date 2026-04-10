# Smart-Hire — TalentGraph AI

> Multi-Agent AI system for intelligent resume parsing, skill normalization, and semantic job matching.

---

## Project Structure

```
Smart-Hire 2.2/
├── backend/          # FastAPI + Python AI pipeline
│   ├── agents/       # Parser, Normalizer, Matcher agents
│   ├── graph/        # LangGraph pipeline
│   ├── main.py       # FastAPI entry point
│   ├── requirements.txt
│   └── .env          # API keys
└── frontend/         # React + TypeScript + Vite
    └── src/
```

---

## Prerequisites

- **Python** 3.11+ — [python.org](https://python.org)
- **Node.js** 18+ — [nodejs.org](https://nodejs.org)

---

## Backend Setup & Run

```bash
# 1. Navigate to the backend directory
cd "Smart-Hire 2.2/backend"

# 2. Create a Python virtual environment
python3 -m venv venv

# 3. Activate the virtual environment
source venv/bin/activate          # macOS / Linux
# venv\Scripts\activate           # Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure your API key (edit the .env file)
#    OPENAI_API_KEY=your-key-here

# 6. Start the backend server
python main.py
```

The API will be available at **http://localhost:8000**  
Interactive docs (Swagger UI): **http://localhost:8000/docs**

---

## Frontend Setup & Run

```bash
# 1. Navigate to the frontend directory
cd "Smart-Hire 2.2/frontend"

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The frontend will be available at **http://localhost:5173**

---

## Running the Full Project (Quick Reference)

Open **two terminals** and run one command in each:

**Terminal 1 — Backend:**
```bash
cd "Smart-Hire 2.2/backend"
source venv/bin/activate    # macOS/Linux
python main.py
```

**Terminal 2 — Frontend:**
```bash
cd "Smart-Hire 2.2/frontend"
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/api/v1/jobs` | List available job descriptions |
| `POST` | `/api/v1/parse` | Upload resume (PDF/DOCX) and get match results |

---

## Notes

- On **first run**, the sentence-transformer model will be downloaded automatically (~90 MB). This may take a minute.
- Supported resume formats: **PDF**, **DOCX**
- Max file size: **10 MB**
