from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import requests
import asyncio
from datetime import datetime, timedelta
import random
import uvicorn

app = FastAPI(
    title="Korean Economic News API",
    description="🇰🇷 AI-powered Korean Economic News API with real-time updates",
    version="1.0.0"
)

# CORS 설정 - React 앱에서 접근 가능하도록
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://172.30.1.64:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 모델 정의
class NewsItem(BaseModel):
    title: str
    source: str
    date: str
    content: str
    imageUrl: str
    link: str

class NewsResponse(BaseModel):
    경제: List[NewsItem]
    스포츠: List[NewsItem]
    미국주식: List[NewsItem]
    환율: List[NewsItem]

# 뉴스 생성 함수
def generate_korean_news(category: str) -> List[NewsItem]:
    """한국 경제 뉴스 생성"""
    now = datetime.now()
    today = now.strftime("%m월 %d일")
    
    news_templates = {
        "경제": [
            {
                "title": f"{today} 한국은행 기준금리 {random.choice(['2.75%로 0.25%p 인상', '2.25%로 0.25%p 인하'])} 결정",
                "content": "한국은행 금융통화위원회가 경제 성장세 둔화와 물가 안정을 고려하여 기준금리 조정을 결정했습니다.",
                "source": "연합뉴스",
                "imageUrl": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070"
            },
            {
                "title": f"{today} 코스피 {random.randint(2650, 2800)}선에서 {random.choice(['강세', '조정'])} 마감",
                "content": "국내 증시가 외국인 투자자들의 매매 동향과 반도체 업종의 실적 기대감에 영향을 받았습니다.",
                "source": "한국경제",
                "imageUrl": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070"
            }
        ],
        "스포츠": [
            {
                "title": f"{today} 손흥민, 토트넘 vs {random.choice(['아스널', '맨시티', '리버풀'])} 경기에서 {random.randint(1,3)}골 대활약",
                "content": "프리미어리그에서 손흥민이 뛰어난 활약을 펼치며 팀 승리에 크게 기여했습니다.",
                "source": "스포츠조선",
                "imageUrl": "https://pbs.twimg.com/media/GOZX2gYbYAE_Xkt?format=jpg&name=large"
            },
            {
                "title": f"{today} 김민재, 바이에른 뮌헨 {random.choice(['승리', '무승부'])}에 기여 - 안정적인 수비력 과시",
                "content": "분데스리가에서 김민재가 바이에른 뮌헨의 중앙 수비수로 완벽한 경기를 펼쳤습니다.",
                "source": "OSEN",
                "imageUrl": "https://pbs.twimg.com/media/GQ1YX5QbcAAQD2g?format=jpg&name=large"
            }
        ],
        "미국주식": [
            {
                "title": f"{today} 테슬라 주가 {random.choice(['+', '-'])}{random.randint(1,8):.1f}% - 자율주행 기술 발전 기대감",
                "content": "테슬라가 전기차 시장에서의 기술 혁신과 자율주행 분야 발전으로 투자자들의 주목을 받고 있습니다.",
                "source": "월스트리트저널",
                "imageUrl": "https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg"
            },
            {
                "title": f"{today} 나스닥 지수 {random.randint(16800, 17600)}선 {random.choice(['돌파', '근접'])} - 기술주 강세",
                "content": "나스닥 종합지수가 기술주들의 실적 발표와 AI 투자 확대에 힘입어 상승세를 보였습니다.",
                "source": "CNBC",
                "imageUrl": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=2070"
            }
        ],
        "환율": [
            {
                "title": f"{today} 원/달러 환율 {random.randint(1365, 1395)}원 {random.choice(['하락', '상승'])} - 달러 약세 지속",
                "content": "원/달러 환율이 미국 연준의 통화정책 전망과 한국의 경제 지표 발표에 영향을 받으며 변동했습니다.",
                "source": "연합뉴스",
                "imageUrl": "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=2071"
            },
            {
                "title": f"{today} 엔/달러 환율 {random.randint(144, 152)}엔 {random.choice(['급등', '안정'])} - 일본은행 정책 유지",
                "content": "일본 엔화가 일본은행의 통화정책과 함께 아시아 외환시장 전반의 변동성이 확대되고 있습니다.",
                "source": "머니투데이",
                "imageUrl": "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?q=80&w=2070"
            }
        ]
    }
    
    category_news = news_templates.get(category, [])
    selected_news = random.sample(category_news, min(len(category_news), 5))
    
    result = []
    for i, news in enumerate(selected_news):
        result.append(NewsItem(
            title=news["title"],
            source=news["source"],
            date=(now - timedelta(minutes=random.randint(10, 180))).strftime("%Y-%m-%d %H:%M"),
            content=news["content"],
            imageUrl=news["imageUrl"],
            link=f"https://news.naver.com/section/101"
        ))
    
    return result

@app.get("/")
async def root():
    """API 루트 엔드포인트"""
    return {
        "message": "🇰🇷 Korean Economic News API",
        "version": "1.0.0",
        "endpoints": [
            "/news - 모든 카테고리 뉴스",
            "/news/{category} - 특정 카테고리 뉴스",
            "/health - 서버 상태 확인"
        ]
    }

@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "server": "FastAPI Korean News API"
    }

@app.get("/news", response_model=NewsResponse)
async def get_all_news():
    """모든 카테고리 뉴스 가져오기"""
    categories = ["경제", "스포츠", "미국주식", "환율"]
    
    news_data = {}
    for category in categories:
        news_data[category] = generate_korean_news(category)
    
    return NewsResponse(**news_data)

@app.get("/news/{category}")
async def get_category_news(category: str):
    """특정 카테고리 뉴스 가져오기"""
    valid_categories = ["경제", "스포츠", "미국주식", "환율"]
    
    if category not in valid_categories:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid category. Valid categories: {valid_categories}"
        )
    
    return generate_korean_news(category)

@app.post("/news/refresh")
async def refresh_news():
    """뉴스 데이터 새로고침"""
    categories = ["경제", "스포츠", "미국주식", "환율"]
    
    news_data = {}
    for category in categories:
        news_data[category] = generate_korean_news(category)
    
    return {
        "message": "뉴스 데이터가 성공적으로 새로고침되었습니다.",
        "timestamp": datetime.now().isoformat(),
        "data": news_data
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    ) 