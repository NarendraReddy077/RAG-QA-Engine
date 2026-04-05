# 🚀 RAG Powered Multi-Source Q&A Engine

A scalable Retrieval-Augmented Generation (RAG) system built with **FastAPI**, **LangChain**, and **Ollama**. It supports ingestion of PDFs, web content, and raw text, transforms them into embeddings, and enables real-time, context-aware Q&A using a local LLM. The system includes semantic search, efficient vector retrieval, and source attribution for transparent answers.

---

## ✨ Key Features

- **Multi-Source Ingestion**:
  - 📄 **PDF Support**: Ingest local PDF files with automatic text splitting and cleaning.
  - 🌐 **Web Scraping**: Extract and index content directly from URLs.
  - ✍️ **Raw Text**: Submitting plain text for immediate knowledge indexing.
- **Advanced Retrieval**:
  - 🧠 Uses **ChromaDB** for high-speed vector embeddings and similarity search.
  - 🔍 Employs **HuggingFace** (`all-MiniLM-L6-v2`) for state-of-the-art text representations.
- **Intelligent Q&A**:
  - 🤖 Powered by **Ollama** (`gemma:2b`) for generating precise, contextually relevant answers.
  - 🛡️ **Smart Fallback**: Automatically falls back to the model's base knowledge if no relevant context is found in the vector store.
  - 📍 **Source Attribution**: Provides clear references and content snippets for every answer.
- **Session Management**:
  - 📜 Full chat history tracking and retrieval.
  - 📁 Knowledge base management (view and delete ingested sources).
- **Modern UI**: A premium, responsive interface designed for maximum productivity.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python) |
| **Orchestration** | LangChain |
| **Vector Database** | ChromaDB |
| **LLM Engine** | Ollama (`gemma:2b`) |
| **Embeddings** | HuggingFace (`all-MiniLM-L6-v2`) |
| **Frontend** | React + Vite |
| **Database/Storage** | Supabase (User & Metadata storage) |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Ollama**: [Download and install Ollama](https://ollama.com/)
  - After installing, run: `ollama pull gemma:2b`

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```
2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   SUPABASE_URL="your_supabase_url"
   SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```
5. **Start the API server**:
   ```bash
   python main.py
   ```
   The backend will be running at `http://localhost:8000`.

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 🔌 API Endpoints

- `POST /api/ingest`: Upload PDFs, URLs, or text for indexing.
- `POST /api/chat`: Submit a query and receive a context-aware response.
- `GET /api/knowledge`: List all ingested sources.
- `DELETE /api/knowledge?source=...`: Remove a specific source from the memory.
- `GET /api/history`: Retrieve chat session history.

---

## 🛡️ RAG Workflow

1. **Clean & Split**: Ingested data is split into 500-character chunks with 100-character overlap for optimal retrieval resolution.
2. **Embed**: Chunks are converted into 384-dimensional vectors using HuggingFace.
3. **Query**: When a user asks a question, the top 3 most relevant chunks are retrieved.
4. **Filter**: A similarity threshold is applied to filter out noise.
5. **Synthesize**: The context (if any) and the question are piped through the Gemma-2b model to produce a final, sourced answer.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
