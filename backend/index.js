const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');
const cron = require('node-cron');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json());

// 글로벌 데이터 저장소
let newsData = {};
let lastUpdateTime = '';

// 📺 YouTube RSS 병렬 뉴스 수집 시스템 (5개 검증된 채널)
const VERIFIED_CHANNELS = [
  { id: 'UCkinYTS9IHqOEwR1Sze2JTw', name: 'SBS뉴스', lang: 'ko' },  // ✅ SBS 뉴스
  { id: 'UCcQTRi69dsVYHN3exePtZ1A', name: 'KBS뉴스', lang: 'ko' },  // ✅ KBS 뉴스  
  { id: 'UChlgI3UHCOnwUGzWzbJ3H5w', name: 'YTN', lang: 'ko' },      // ✅ YTN
  { id: 'UC16niRr50-MSBwiO3YDb3RA', name: 'BBC뉴스', lang: 'en' },  // ✅ BBC News
  { id: 'UCupvZG-5ko_eiXAupbDfxWw', name: 'CNN', lang: 'en' }       // ✅ CNN
];

// 카테고리별 키워드 매핑
const KEYWORDS = {
  economy: {
    ko: [
      // 거시경제
      '경제', 'GDP', '성장률', '경기', '경기침체', '경기회복', '경기전망',
      // 금융/통화
      '금리', '인플레이션', '물가', '디플레이션', '통화정책', '한은', '기준금리',
      // 산업/기업
      '산업', '기업', '대기업', '중소기업', '벤처', '스타트업', '신산업',
      // 무역/수출입
      '수출', '수입', '무역', '무역수지', '무역적자', '무역흑자', 'FTA',
      // 고용/노동
      '고용', '실업', '취업', '일자리', '노동시장', '최저임금', '노사',
      // 부동산
      '부동산', '아파트', '주택', '전세', '월세', '부동산시장', '재건축', '재개발'
    ],
    en: [
      'economy', 'GDP', 'growth', 'recession', 'recovery', 'outlook',
      'interest', 'inflation', 'deflation', 'monetary', 'policy',
      'industry', 'company', 'enterprise', 'venture', 'startup',
      'export', 'import', 'trade', 'balance', 'FTA',
      'employment', 'unemployment', 'job', 'labor', 'minimum wage',
      'real estate', 'apartment', 'housing', 'rent', 'development'
    ]
  },
  usStock: {
    ko: [
      // 주요 지수
      '다우존스', 'S&P500', '나스닥', '월스트리트', '뉴욕증시', '미국증시',
      // 주요 기업
      '애플', '마이크로소프트', '구글', '아마존', '테슬라', '메타', '넷플릭스',
      // 시장 동향
      '주가', '주식시장', '증시', '장중', '장외', '상승', '하락', '보합',
      // 투자/분석
      '투자', '매수', '매도', '포트폴리오', '펀드', 'ETF', '주식투자',
      // 경제지표
      '실적', '분기실적', '연간실적', '실적발표', '실적전망', 'PER', 'PBR'
    ],
    en: [
      'dow', 'jones', 'S&P', 'nasdaq', 'wall street', 'NYSE',
      'apple', 'microsoft', 'google', 'amazon', 'tesla', 'meta', 'netflix',
      'stock', 'market', 'trading', 'bull', 'bear',
      'investment', 'portfolio', 'fund', 'ETF',
      'earnings', 'quarterly', 'annual', 'forecast', 'PER', 'PBR'
    ]
  },
  exchangeRate: {
    ko: [
      // 주요 통화
      '환율', '달러', '원화', '엔화', '유로', '위안', '파운드',
      // 환율 관련
      '원-달러', '원-엔', '원-유로', '달러-엔', '달러-유로', '크로스레이트',
      // 시장 동향
      '외환시장', '환전', '환차익', '환차손', '환헤지', '환리스크',
      // 정책/기관
      '한은', '외환정책', '외환보유액', '외환시장개입', '스왑라인',
      // 경제지표
      '무역수지', '경상수지', '자본수지', '국제수지', '외채', '외환보유액'
    ],
    en: [
      'exchange', 'rate', 'dollar', 'won', 'yen', 'euro', 'yuan', 'pound',
      'forex', 'FX', 'cross rate',
      'currency', 'market', 'hedge', 'risk',
      'central bank', 'reserves', 'intervention', 'swap',
      'balance', 'current account', 'capital account', 'debt'
    ]
  },
  sports: {
    ko: [
      // 구기종목
      '축구', '야구', '농구', '배구', '골프', '테니스',
      // 국내 리그
      'K리그', 'KBO', 'KBL', 'V리그', 'KPGA', 'KLPGA',
      // 국제 대회
      '월드컵', '올림픽', '아시안게임', '챔피언스리그', '월드시리즈',
      // 선수/팀
      '선수', '팀', '감독', '코치', '스타', '유망주', '신인',
      // 경기/대회
      '경기', '대회', '리그', '토너먼트', '예선', '본선', '결승'
    ],
    en: [
      'football', 'soccer', 'baseball', 'basketball', 'volleyball', 'golf', 'tennis',
      'K-league', 'KBO', 'KBL', 'V-league', 'KPGA', 'KLPGA',
      'world cup', 'olympics', 'asian games', 'champions league', 'world series',
      'player', 'team', 'coach', 'star', 'rookie',
      'game', 'tournament', 'league', 'qualification', 'final'
    ]
  }
};

// 카테고리별 제외 키워드
const EXCLUDE_KEYWORDS = {
  economy: {
    ko: [...KEYWORDS.exchangeRate.ko, ...KEYWORDS.usStock.ko],
    en: [...KEYWORDS.exchangeRate.en, ...KEYWORDS.usStock.en]
  },
  usStock: {
    ko: [...KEYWORDS.exchangeRate.ko],
    en: [...KEYWORDS.exchangeRate.en]
  },
  exchangeRate: {
    ko: [...KEYWORDS.usStock.ko],
    en: [...KEYWORDS.usStock.en]
  }
};

// 🎯 모든 뉴스 카테고리를 병렬로 수집
const collectAllNews = async () => {
  const startTime = Date.now();
  console.log(`\n🚀 [${moment().format('YYYY-MM-DD HH:mm:ss')}] 뉴스 수집 작업 시작...`);
  
  // 예상 완료 시간 계산 (최대 5초)
  const expectedDuration = 5; // 초
  const expectedEndTime = moment().add(expectedDuration, 'seconds');
  console.log(`⏳ 예상 완료 시간: ${expectedEndTime.format('HH:mm:ss')} (최대 ${expectedDuration}초)`);
  
  // 카테고리별로 뉴스 분류 (비동기 for...of 루프 사용)
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    console.log(`\n📺 ${category} 뉴스 수집 중...`);
    let filled = false;
    let attempt = 0;
    let lastError = null;
    let failureReasons = new Set();
    
    // 다양한 설정 조합
    const settings = [
      { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } },
      { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' } },
      { timeout: 15000, headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' } },
      { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' } },
      { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0', 'Pragma': 'no-cache' } },
      { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/xml' } },
      { timeout: 18000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Encoding': 'gzip, deflate' } }
    ];

    while (!filled) {
      attempt++;
      const setting = settings[attempt % settings.length];
      console.log(`\n🔄 ${category} 뉴스 수집 시도 #${attempt}`);
      console.log(`⚙️ 현재 설정: timeout=${setting.timeout}ms, headers=${JSON.stringify(setting.headers)}`);
      
      let articles = [];
      let channelErrors = new Map();
      
      try {
        // 채널별로 RSS 수집 (설정 변경 적용)
        await Promise.all(VERIFIED_CHANNELS.map(async (channel) => {
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`;
          try {
            const response = await axios.get(rssUrl, {
              timeout: setting.timeout,
              headers: setting.headers
            });
            
            // 응답 데이터 검증
            if (!response.data) {
              throw new Error('응답 데이터 없음');
            }
            
            const $ = cheerio.load(response.data, { xmlMode: true });
            const entries = $('entry');
            
            if (entries.length === 0) {
              throw new Error('RSS 엔트리 없음');
            }
            
            entries.each((index, element) => {
              if (articles.length < 20) {
                const title = $(element).find('title').text().trim();
                const videoId = $(element).find('yt\\:videoId, videoId').text().trim();
                const published = $(element).find('published').text().trim();
                
                // 데이터 유효성 검증
                if (!title || !videoId) {
                  console.log(`⚠️ ${channel.name}: 제목 또는 비디오 ID 누락`);
                  return;
                }
                
                // 더미/로딩/안내성 뉴스 필터링
                if (title.includes('로딩') || title.includes('안내') || title.includes('더미')) {
                  console.log(`⚠️ ${channel.name}: 더미/로딩/안내성 뉴스 제외`);
                  return;
                }
                
                const publishedDate = published ? moment(published).format('YYYY-MM-DD HH:mm') : moment().format('YYYY-MM-DD HH:mm');
                articles.push({
                  id: `youtube_${channel.name}_${videoId}`,
                  title: title,
                  source: channel.name,
                  date: publishedDate,
                  content: `${title} - ${channel.name}에서 제공하는 뉴스입니다.`,
                  imageUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                  link: `https://www.youtube.com/watch?v=${videoId}`
                });
              }
            });
          } catch (err) {
            const errorType = err.code === 'ECONNABORTED' ? '타임아웃' :
                            err.response ? `HTTP ${err.response.status}` :
                            err.message.includes('parse') ? '파싱 오류' : '알 수 없는 오류';
            channelErrors.set(channel.name, { type: errorType, message: err.message });
            console.log(`❌ ${channel.name} 수집 실패: ${errorType} - ${err.message}`);
          }
        }));

        // 실패 원인 분석 및 로깅
        if (channelErrors.size > 0) {
          console.log('\n📊 실패 원인 분석:');
          channelErrors.forEach((error, channel) => {
            console.log(`- ${channel}: ${error.type} - ${error.message}`);
            failureReasons.add(error.type);
          });
        }

        // 키워드 필터 및 중복 제거 로직 수정
        let categoryArticles = [];
        const categoryKeywords = KEYWORDS[category] || {};
        const excludeKeywords = EXCLUDE_KEYWORDS[category] || {};

        articles.forEach(article => {
          const title = article.title.toLowerCase();
          
          // 제외 키워드 체크
          const isExcluded = (excludeKeywords.ko || []).some(keyword => title.includes(keyword.toLowerCase())) ||
                            (excludeKeywords.en || []).some(keyword => title.includes(keyword.toLowerCase()));
          
          if (isExcluded) return;
          
          // 포함 키워드 체크
          const isRelevant = (categoryKeywords.ko || []).some(keyword => title.includes(keyword.toLowerCase())) ||
                            (categoryKeywords.en || []).some(keyword => title.includes(keyword.toLowerCase()));
          
          if (isRelevant) {
            // 중복 제거
            if (!categoryArticles.find(a => a.id === article.id || a.title === article.title)) {
              categoryArticles.push(article);
            }
          }
        });
        // 최신순 정렬 후 5개만
        let sortedArticles = categoryArticles
          .sort((a, b) => moment(b.date).unix() - moment(a.date).unix());
        // 조건 완화: 5개 미만이면 키워드 일부라도 포함된 뉴스만 추가(연관성 없는 뉴스는 절대 포함하지 않음)
        if (sortedArticles.length < 5) {
          const alreadyIds = new Set(sortedArticles.map(a => a.id));
          const fillArticles = articles
            .filter(a => {
              if (alreadyIds.has(a.id)) return false;
              // 제목에 카테고리 연관 키워드 일부라도 포함된 경우만 허용
              return (categoryKeywords.ko || []).some(keyword => a.title.toLowerCase().includes(keyword.toLowerCase())) ||
                     (categoryKeywords.en || []).some(keyword => a.title.toLowerCase().includes(keyword.toLowerCase()));
            })
            .sort((a, b) => moment(b.date).unix() - moment(a.date).unix());
          for (const a of fillArticles) {
            if (sortedArticles.length >= 5) break;
            sortedArticles.push(a);
          }
        }
        sortedArticles = sortedArticles.slice(0, 5);

        if (sortedArticles.length === 5) {
          newsData[category] = sortedArticles;
          console.log(`\n✅ ${category} 뉴스 5개 수집 성공! (시도 ${attempt})`);
          console.log('📰 수집된 뉴스:');
          sortedArticles.forEach((article, index) => {
            console.log(`${index + 1}. ${article.title} (${article.source})`);
          });
          filled = true;
        } else {
          console.log(`\n⚠️ ${category} 뉴스 ${sortedArticles.length}개만 수집됨 (목표: 5개)`);
          if (sortedArticles.length > 0) {
            console.log('📰 현재까지 수집된 뉴스:');
            sortedArticles.forEach((article, index) => {
              console.log(`${index + 1}. ${article.title} (${article.source})`);
            });
          }
          console.log('🔄 재시도 계속...');
        }
      } catch (err) {
        lastError = err;
        console.log(`\n❌ ${category} 전체 수집 실패 (시도 ${attempt}):`, err.message);
        console.log('🔄 재시도 계속...');
      }
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  lastUpdateTime = moment().format('YYYY년 MM월 DD일 HH:mm:ss');
  console.log(`\n⏱️ 소요시간: ${duration}초`);
  
  if (duration > expectedDuration) {
    console.log(`\n⚠️ 경고: 예상 시간(${expectedDuration}초)보다 ${(duration - expectedDuration).toFixed(2)}초 더 걸렸습니다.`);
  }
  
  console.log(`\n🎉 [${moment().format('YYYY-MM-DD HH:mm:ss')}] 뉴스 수집 완료!`);
  console.log(`📊 총 ${Object.values(newsData).flat().length}개의 뉴스 수집됨\n`);
};

// 초기 데이터 설정
const initializeData = async () => {
  console.log('🎬 초기 데이터 설정 중...');
  
  const defaultImages = {
    경제: [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070',
    'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=2076',
    'https://images.unsplash.com/photo-1638913662415-8c5f79b20656?q=80&w=2070',
    'https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=2070',
      'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2070'
    ],
    스포츠: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070',
      'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=2070'
    ],
    미국주식: [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=2070',
    'https://images.unsplash.com/photo-1560221328-12fe60f83ab8?q=80&w=2074',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070',
      'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=2070'
    ],
    환율: [
    'https://images.unsplash.com/photo-1600679362237-e168aa39b362?q=80&w=2070',
    'https://images.unsplash.com/photo-1544375555-c5cabcd5b6ef?q=80&w=2070',
    'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=2071',
    'https://images.unsplash.com/photo-1591832608633-c212b667b4da?q=80&w=2070',
      'https://images.unsplash.com/photo-1534951009808-766178b47a4f?q=80&w=2070'
    ]
  };
  
  // 초기 더미 데이터 (실제 YouTube 데이터로 곧 교체됨)
  Object.keys(defaultImages).forEach(category => {
    newsData[category] = Array.from({ length: 5 }, (_, i) => ({
      id: `init_${category}_${i}`,
      title: `${category} 뉴스 ${i+1} (초기 데이터)`,
      source: '초기화',
      date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
      content: `이것은 ${category}에 관한 초기 데이터입니다. 곧 실제 YouTube 뉴스로 교체됩니다.`,
      imageUrl: defaultImages[category][i],
      link: '#'
    }));
  });
  
  console.log('✅ 초기 데이터 설정 완료');
};

// API 엔드포인트들
app.get('/api/news/:category', (req, res) => {
  const { category } = req.params;
  const categoryMap = {
    'economy': '경제',
    'sports': '스포츠', 
    'us-stocks': '미국주식',
    'exchange-rate': '환율'
  };
  
  const koreanCategory = categoryMap[category];
  if (!koreanCategory || !newsData[koreanCategory]) {
    return res.status(404).json({ error: '카테고리를 찾을 수 없습니다' });
  }
  
  res.json({
    news: newsData[koreanCategory],
    lastUpdate: lastUpdateTime,
    category: koreanCategory
  });
});

app.get('/api/news', (req, res) => {
  res.json({
    news: newsData,
    lastUpdate: lastUpdateTime,
    categories: Object.keys(newsData)
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    lastUpdate: lastUpdateTime,
    categories: Object.keys(newsData),
    totalArticles: Object.values(newsData).flat().length,
    server: 'YouTube RSS Only System',
    version: '2.0'
  });
});

// 수동 뉴스 수집 엔드포인트
app.post('/api/collect-news', async (req, res) => {
  try {
    await collectAllNews();
    res.json({ 
      success: true, 
      message: '뉴스 수집이 완료되었습니다',
      lastUpdate: lastUpdateTime 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 🚀 서버 시작
app.listen(PORT, async () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 시작되었습니다!`);
  
  // 초기 데이터 설정
  await initializeData();
  
  // 첫 뉴스 수집 실행
  await collectAllNews();
  
  // 10분마다 뉴스 수집 (cron)
  cron.schedule('*/10 * * * *', async () => {
    await collectAllNews();
  });
});