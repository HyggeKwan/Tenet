# 🇰🇷 YouTube 뉴스 자동 수집 시스템

> **AI 기반 YouTube 뉴스 실시간 수집 및 표시 웹 애플리케이션**

## 📋 프로젝트 개요

YouTube 채널의 최신 뉴스 동영상을 자동으로 수집하여 사용자에게 제공하는 웹 애플리케이션입니다.

## ✨ 주요 기능

* 🔄 실시간 YouTube 뉴스 수집 (썸네일, 제목, 채널명, 링크)
* 📱 반응형 디자인 (모바일, 데스크톱 지원)
* 🗂️ 카테고리별 분류 (한국 경제, 스포츠, 미국 주식, 환율)
* ⏰ 최신순 정렬

## 🛠️ 기술 스택

* Frontend: React, TypeScript
* Backend: Python (Flask)
* YouTube Data API v3

## 🚀 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/HyggeKwan/Tenet.git
cd Tenet

# 백엔드 실행
cd pybackend
python3 app.py

# 프론트엔드 실행
cd ../frontend
npm install
npm start
```

## 📁 프로젝트 구조

```
Tenet/
├── pybackend/          # Python Flask 백엔드
│   └── app.py         # YouTube Data API 연동
├── frontend/          # React 프론트엔드
│   ├── src/
│   │   └── App.tsx   # 메인 컴포넌트
│   └── package.json
└── README.md
```

## 🔧 환경 설정

1. YouTube Data API 키 발급
   - Google Cloud Console에서 프로젝트 생성
   - YouTube Data API v3 활성화
   - API 키 생성

2. 백엔드 설정
   - `pybackend/app.py`의 `YOUTUBE_API_KEY` 변수에 발급받은 API 키 입력

## 📝 라이선스

MIT License

---

**🇰🇷 Made with ❤️ in Korea**