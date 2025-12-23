from langchain_text_splitters import RecursiveCharacterTextSplitter

def chunk_documents(docs):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=100,
        separators=["\n\n", "\n", ".", "?", "!", " "]
    )

    chunks = []
    for doc in docs:
        texts = splitter.split_text(doc["content"])
        for text in texts:
            chunks.append({
                "source": doc["source"],
                "category": doc["category"],
                "content": text
            })
    return chunks