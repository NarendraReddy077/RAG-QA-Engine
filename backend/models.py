from pydantic import BaseModel
from typing import List, Optional

class IngestRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None
    # For a full implementation, files would be handled via UploadFile in the route.

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class SourceInfo(BaseModel):
    content: str
    metadata: dict

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceInfo]
    session_id: str
