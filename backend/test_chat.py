import sys
import traceback
from services.rag import query_rag
from services.db import get_or_create_user, log_query

try:
    print("Testing DB...")
    uid = get_or_create_user("user@example.com")
    print(f"User ID: {uid}")
    
    print("Testing RAG...")
    ans, sources = query_rag("What is this about?")
    print("Answer:", ans)
    print("Sources:", sources)
    print("SUCCESS")
except Exception as e:
    print("ERROR:")
    traceback.print_exc()
