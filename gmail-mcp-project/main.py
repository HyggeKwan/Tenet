from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from gmail_service import GmailService

app = FastAPI(title="Gmail MCP API", description="Gmail API를 통한 이메일 관리 시스템")

# Gmail 서비스 인스턴스
gmail_service = GmailService()

class EmailResponse(BaseModel):
    id: str
    subject: str
    sender: str
    date: str
    snippet: str
    body: str

class SearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10

@app.get("/")
def read_root():
    return {"message": "Gmail MCP API가 실행 중입니다"}

@app.get("/emails", response_model=List[EmailResponse])
def get_emails(max_results: int = 10):
    """이메일 목록을 가져옵니다."""
    try:
        emails = gmail_service.get_emails(max_results)
        return emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이메일 목록 가져오기 실패: {str(e)}")

@app.post("/search", response_model=List[EmailResponse])
def search_emails(request: SearchRequest):
    """특정 키워드로 이메일을 검색합니다."""
    try:
        emails = gmail_service.search_emails(request.query, request.max_results)
        return emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이메일 검색 실패: {str(e)}")

@app.get("/search/{keyword}", response_model=List[EmailResponse])
def search_emails_by_keyword(keyword: str, max_results: int = 10):
    """URL 경로를 통한 키워드 검색"""
    try:
        emails = gmail_service.search_emails(keyword, max_results)
        return emails
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"이메일 검색 실패: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 