import os
import bs4
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_community.document_loaders import WebBaseLoader, PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_classic.schema import Document
from config import settings

embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDING_MODEL_NAME)

persist_directory = settings.CHROMA_PERSIST_DIRECTORY
vectorstore = Chroma(
    embedding_function=embeddings,
    persist_directory=persist_directory
)

headers = {}
if settings.OLLAMA_API_KEY:
    headers["Authorization"] = f"Bearer {settings.OLLAMA_API_KEY}"

llm = ChatOllama(
    model=settings.OLLAMA_MODEL,
    base_url=settings.OLLAMA_BASE_URL,
    headers=headers
)

system_prompt = (
    "You are a helpful assistant for question-answering tasks.\n"
    "Use the provided context if relevant.\n"
    "If the context is not relevant, answer using your own knowledge.\n"
    "Keep answers concise.\n\n"
    "Context:\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}")
])


def clean_and_split(text, source):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )
    splits = splitter.split_text(text)

    docs = [
        Document(page_content=s.strip(), metadata={"source": source})
        for s in splits
        if len(s.strip()) > 10  # Reduced threshold to avoid ignoring short but valid chunks
    ]
    return docs


def ingest_text(text: str, source: str):
    docs = clean_and_split(text, source)
    vectorstore.add_documents(docs)


def ingest_url(url: str):
    loader = WebBaseLoader(
        web_paths=(url,),
        bs_kwargs=dict(parse_only=bs4.SoupStrainer())
    )
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )
    splits = splitter.split_documents(docs)

    clean_docs = [
        Document(page_content=d.page_content.strip(), metadata={"source": url})
        for d in splits
        if len(d.page_content.strip()) > 50
    ]

    vectorstore.add_documents(clean_docs)


def ingest_pdf(file_path: str):
    print(f"RAG: Ingesting PDF from {file_path}")
    try:
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        print(f"RAG: Loaded {len(docs)} pages from PDF")

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        splits = splitter.split_documents(docs)
        print(f"RAG: Split PDF into {len(splits)} chunks")

        clean_docs = [
            Document(page_content=d.page_content.strip(), metadata={"source": os.path.basename(file_path).replace("temp_", "")})
            for d in splits
            if len(d.page_content.strip()) > 10
        ]
        
        if clean_docs:
            vectorstore.add_documents(clean_docs)
            print(f"RAG: Added {len(clean_docs)} chunks to vector store")
        else:
            print("RAG: No valid chunks found in PDF after filtering")
            
    except Exception as e:
        print(f"RAG ERROR: Failed to ingest PDF: {str(e)}")
        import traceback
        traceback.print_exc()
        raise e

def query_rag(query: str):
    # Step 1: Retrieve with scores
    docs_with_scores = vectorstore.similarity_search_with_score(query, k=settings.RAG_K)

    print(f"\n--- RAG DEBUG: Query: '{query}' ---")
    for i, (doc, score) in enumerate(docs_with_scores):
        print(f"Result {i+1}: Source: {doc.metadata.get('source')}, Score: {score}")
    print("-----------------------------------\n")

    # Step 2: Filter relevant docs
    threshold = settings.RAG_SCORE_THRESHOLD
    relevant_docs_with_scores = [
        (doc, score) for doc, score in docs_with_scores if score < threshold
    ]

    # Step 3: Fallback (NO relevant docs)
    if len(relevant_docs_with_scores) == 0:
        print("RAG DEBUG: No relevant docs → fallback to LLM")

        response = llm.invoke(query)

        sources = [{
            "content": "Answered using model's general knowledge",
            "metadata": {"source": "My Knowledge"}
        }]

        return response.content, sources

    # Step 4: Use ONLY relevant docs
    relevant_docs = [doc for doc, _ in relevant_docs_with_scores]

    # Step 4: Run QA chain with relevant docs
    qa_chain = create_stuff_documents_chain(llm, prompt)
    answer = qa_chain.invoke({"input": query, "context": relevant_docs})
    if hasattr(answer, 'content'):
        answer = answer.content

    # Step 5: Return ONLY relevant sources (no noise)
    sources = []
    seen_sources = set()

    for doc in relevant_docs:
        src = doc.metadata.get("source", "Unknown")

        if src not in seen_sources:
            sources.append({
                "content": doc.page_content[:200],  # short preview
                "metadata": {"source": src}
            })
            seen_sources.add(src)

    return answer, sources

def get_all_knowledge():
    data = vectorstore.get()
    metadatas = data.get("metadatas", [])

    unique_sources = set()
    for m in metadatas:
        if m and "source" in m:
            unique_sources.add(m["source"])

    return list(unique_sources)

def delete_knowledge(source: str):
    data = vectorstore.get(where={"source": source})
    ids = data.get("ids", [])

    if ids:
        vectorstore.delete(ids=ids)

    return len(ids)
