# Gmail MCP Project

Gmail API를 사용하여 이메일을 관리하고 검색하는 Python 프로젝트입니다.

## 기능

- ✅ Gmail API 인증 및 연동
- ✅ 이메일 목록 가져오기
- ✅ 특정 키워드로 이메일 검색
- ✅ FastAPI를 통한 웹 API 제공
- ✅ 이메일 상세 정보 조회

## 설치 및 설정

### 1. 의존성 설치

```bash
pip install -r requirements.txt
```

### 2. Google API 설정

1. Google Cloud Console에서 Gmail API를 활성화
2. OAuth 2.0 클라이언트 ID 생성
3. 클라이언트 시크릿 파일을 프로젝트 루트에 배치

### 3. 인증 설정

첫 실행 시 브라우저가 열리며 Google 계정으로 인증을 진행합니다.

## 사용법

### 1. 테스트 실행

```bash
python test_gmail.py
```

### 2. 웹 API 서버 실행

```bash
python main.py
```

서버가 실행되면 `http://localhost:8000`에서 API를 사용할 수 있습니다.

### 3. API 엔드포인트

- `GET /` - API 상태 확인
- `GET /emails?max_results=10` - 이메일 목록 가져오기
- `POST /search` - 키워드로 이메일 검색
- `GET /search/{keyword}` - URL 경로를 통한 키워드 검색

### 4. API 문서

서버 실행 후 `http://localhost:8000/docs`에서 Swagger UI를 통해 API 문서를 확인할 수 있습니다.

## 예제 사용법

### Python에서 직접 사용

```python
from gmail_service import GmailService

# Gmail 서비스 초기화
gmail = GmailService()

# 이메일 목록 가져오기
emails = gmail.get_emails(max_results=10)

# 키워드 검색
search_results = gmail.search_emails("important", max_results=5)
```

### HTTP API 사용

```bash
# 이메일 목록 가져오기
curl http://localhost:8000/emails?max_results=5

# 키워드 검색
curl -X POST http://localhost:8000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "important", "max_results": 5}'

# URL 경로를 통한 검색
curl http://localhost:8000/search/important?max_results=5
```

## 파일 구조

```
gmail-mcp-project/
├── gmail_auth.py          # Gmail API 인증 클래스
├── gmail_service.py       # Gmail 서비스 클래스
├── main.py               # FastAPI 웹 서버
├── test_gmail.py         # 테스트 스크립트
├── requirements.txt      # Python 의존성
└── README.md            # 프로젝트 문서
```

## 주의사항

- Gmail API는 일일 할당량이 있으므로 과도한 요청을 피하세요
- 인증 토큰은 `token.pickle` 파일에 저장되므로 보안에 주의하세요
- 프로덕션 환경에서는 환경 변수를 사용하여 클라이언트 시크릿을 관리하세요

## 문제 해결

### 인증 오류
- 클라이언트 시크릿 파일이 올바른 위치에 있는지 확인
- Gmail API가 Google Cloud Console에서 활성화되어 있는지 확인

### API 할당량 초과
- Gmail API의 일일 할당량을 확인하고 필요시 할당량 증가 요청

### 이메일 검색이 안 되는 경우
- Gmail 검색 쿼리 문법을 확인
- 검색할 이메일이 실제로 존재하는지 확인 