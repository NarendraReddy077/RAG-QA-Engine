import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
persist_directory = "backend/chroma_db"
vectorstore = Chroma(
    embedding_function=embeddings,
    persist_directory=persist_directory
)

query = "When does the Mahatma Gandhi born?"
docs_with_scores = vectorstore.similarity_search_with_score(query, k=5)

print(f"Query: {query}")
for i, (doc, score) in enumerate(docs_with_scores):
    print(f"\nResult {i+1}:")
    print(f"Score: {score}")
    print(f"Source: {doc.metadata.get('source')}")
    print(f"Content snippet: {doc.page_content[:200]}...")
