# 🐍 Korean Economic News API (Python FastAPI)

한국 경제 뉴스를 제공하는 Python FastAPI 백엔드 서버입니다.

## ✨ 주요 기능

- 🔥 **FastAPI 기반** 고성능 API 서버
- 🇰🇷 **4개 카테고리** 뉴스 제공 (경제/스포츠/미국주식/환율)
- 🤖 **실시간 뉴스 생성** AI 시뮬레이션
- 📊 **자동 API 문서** (Swagger UI)
- 🌐 **CORS 지원** (React 앱 연동)

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
pip install -r requirements.txt
```

### 2. 서버 실행
```bash
python main.py
# 또는
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. API 확인
- **서버**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs
- **상태 확인**: http://localhost:8000/health

## 📖 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/` | API 정보 |
| GET | `/health` | 서버 상태 확인 |
| GET | `/news` | 모든 카테고리 뉴스 |
| GET | `/news/{category}` | 특정 카테고리 뉴스 |
| POST | `/news/refresh` | 뉴스 데이터 새로고침 |

### 사용 가능한 카테고리
- `경제` - 한국 경제 뉴스
- `스포츠` - 한국 스포츠 뉴스  
- `미국주식` - 미국 주식 뉴스
- `환율` - 환율 뉴스 