from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
import os 
import pandas as pd

with open("medcom_fhir_ig.txt", "r", encoding="utf-8") as file:
    text = file.read()
embeddings = OllamaEmbeddings(model="mxbai-embed-large")

db_location = "./chrome_langchain_db"
add_documents = not os.path.exists(db_location)

vector_store = Chroma(
    collection_name="medcom_fhir_ig",
    persist_directory=db_location,
    embedding_function=embeddings,
)

if add_documents:
    documents = []
    ids = []

    for i, chunk in enumerate(text.split("\n\n")):
        document = Document(
            page_content=chunk,
            id=str(i)
        )
        ids.append(str(i))
        documents.append(document)

    vector_store.add_documents(documents=documents, ids=ids)

retriever = vector_store.as_retriever(
    search_kwargs={"k": 5}
)