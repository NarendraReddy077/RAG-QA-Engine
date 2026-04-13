import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    APP_NAME = "RAG Q&A Engine"
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"
    
    API_PREFIX = "/api"
    CORS_ORIGINS = ["*"]
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    
    CHROMA_PERSIST_DIRECTORY = os.getenv("CHROMA_PERSIST_DIRECTORY", "./chroma_db")
    EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
    HF_TOKEN = os.getenv("HF_TOKEN")
    
    # RAG Parameters
    RAG_K = int(os.getenv("RAG_K", "3"))
    RAG_SCORE_THRESHOLD = float(os.getenv("RAG_SCORE_THRESHOLD", "0.7"))
    CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
    
    OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma:2b")
    OLLAMA_API_KEY = os.getenv("OLLAMA_API_KEY")
    
    DUMMY_EMAIL = "user@example.com"

settings = Config()
