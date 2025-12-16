from app.models.db_base import DBModel

class DocumentResponse(DBModel):
    id: int
    filename: str
    category: str
    created_at: str
    status: str

class RetrieveRequest(DBModel):
    query: str
    top_k: int = 3