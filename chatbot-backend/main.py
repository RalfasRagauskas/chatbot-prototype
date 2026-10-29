
from langchain_ollama.llms import OllamaLLM
from langchain_core.prompts import ChatPromptTemplate
from vector import retriever

model = OllamaLLM(model="llama3.2")

template = """
You are an expert in MedCom FHIR Implementation Guides.

Answer the user's question using ONLY the provided documentation.

If the documentation does not contain the answer,
clearly state that you cannot find the information.

Do not invent information.

Here is the documentation:
{context}

Here is the question to answer:
{question}

Answer:
"""

prompt = ChatPromptTemplate.from_template(template)

chain = prompt | model

while True:
    print("\n\n---------------")

    question = input("Ask your question (q to quit): ")

    if question.lower() == "q":
        break

    # Retrieve relevant documents from ChromaDB
    documents = retriever.invoke(question)

    # Combine retrieved documents into context
    context = "\n\n".join(
        document.page_content for document in documents
    )

    # Generate answer using the question and retrieved context
    result = chain.invoke({
        "context": context,
        "question": question
    })

    print("\nAnswer:")
    print(result)
