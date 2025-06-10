const express = require('express');
const moment = require('moment');
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');
const cheerio = require('cheerio');

// 한국 시간 설정
moment.locale('ko');

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 정적 파일 서빙 (프론트엔드 빌드 파일)
// 실제 배포 시 사용할 코드
// app.use(express.static(path.join(__dirname, '../frontend/build')));

// 뉴스 카테고리 정의
const categories = ['경제', '스포츠', '미국주식', '환율'];

// 뉴스 데이터를 저장할 객체
let newsData = {
  경제: [],
  스포츠: [],
  미국주식: [],
  환율: []
};

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '한국 경제 뉴스 자동 수집 시스템 API',
    serverTime: moment().format('YYYY년 MM월 DD일 HH:mm:ss'),
    timezone: 'KST (UTC+9)',
    lastUpdate: lastUpdateTime,
    categories: categories
  });
});

// 마지막 업데이트 시간 추적
let lastUpdateTime = moment().format('YYYY년 MM월 DD일 HH:mm:ss');

// 모든 뉴스 가져오기 API
app.get('/api/news', (req, res) => {
  res.json({
    timestamp: moment().format('YYYY년 MM월 DD일 HH:mm:ss'),
    lastUpdate: lastUpdateTime,
    categories: categories,
    news: newsData
  });
});

// 카테고리별 뉴스 가져오기 API
app.get('/api/news/:category', (req, res) => {
  const category = req.params.category;
  
  if (!newsData[category]) {
    return res.status(404).json({ error: '카테고리를 찾을 수 없습니다.' });
  }
  
  res.json({
    timestamp: moment().format('YYYY년 MM월 DD일 HH:mm:ss'),
    lastUpdate: lastUpdateTime,
    category: category,
    count: newsData[category].length,
    news: newsData[category]
  });
});

// 뉴스 수집 함수 - 실제 구현에서는 외부 API나 웹 스크래핑을 사용할 것
const collectEconomicNews = async () => {
  try {
    console.log('경제 뉴스 수집 중...');
    
    // 한국경제 웹사이트에서 직접 경제 뉴스 스크래핑
    const response = await axios.get('https://www.hankyung.com/economy', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // 메인 뉴스
    $('.news-list .news-item').each((index, element) => {
      if (articles.length < 9) {
        const titleEl = $(element).find('.news-tit');
        const title = titleEl.text().trim();
        const link = $(element).find('a').attr('href');
        const date = $(element).find('.time').text().trim() || moment().format('YYYY-MM-DD HH:mm');
        
        if (title && link) {
          articles.push({
            title,
            source: '한국경제',
            date,
            content: `${title} - 자세한 내용은 원문을 참조하세요.`,
            link,
            imageUrl: $(element).find('img').attr('src') || 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070'
          });
        }
      }
    });
    
    // 뉴스가 부족하면 다른 사이트에서도 가져오기
    if (articles.length < 9) {
      try {
        // 매일경제 뉴스도 추가로 가져오기
        const maekyungResponse = await axios.get('https://www.mk.co.kr/economy/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const mk$ = cheerio.load(maekyungResponse.data);
        
        mk$('.list_area li').each((index, element) => {
          if (articles.length < 9) {
            const titleEl = mk$(element).find('.news_ttl');
            const title = titleEl.text().trim();
            let link = titleEl.find('a').attr('href');
            
            // 상대 경로를 절대 경로로 변환
            if (link && !link.startsWith('http')) {
              link = link.startsWith('/') ? 'https://www.mk.co.kr' + link : 'https://www.mk.co.kr/' + link;
            }
            
            const date = mk$(element).find('.time').text().trim() || moment().format('YYYY-MM-DD HH:mm');
            
            if (title && link) {
              articles.push({
                title,
                source: '매일경제',
                date,
                content: `${title} - 자세한 내용은 원문을 참조하세요.`,
                link,
                imageUrl: mk$(element).find('img').attr('src') || 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=2076'
              });
            }
          }
        });
      } catch (mkError) {
        console.error('매일경제 뉴스 스크래핑 중 오류 발생:', mkError.message);
      }
    }
    
    // 데이터가 없으면 네이버 경제 뉴스에서 가져오기
    if (articles.length < 9) {
      try {
        const naverResponse = await axios.get('https://news.naver.com/main/main.naver?mode=LSD&mid=shm&sid1=101', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const naver$ = cheerio.load(naverResponse.data);
        
        naver$('.sh_item').each((index, element) => {
          if (articles.length < 9) {
            const titleEl = naver$(element).find('.sh_text_headline');
            const title = titleEl.text().trim();
            let link = titleEl.attr('href');
            
            if (title && link) {
              articles.push({
                title,
                source: '네이버 뉴스',
                date: moment().format('YYYY-MM-DD HH:mm'),
                content: `${title} - 자세한 내용은 원문을 참조하세요.`,
                link,
                imageUrl: naver$(element).find('img').attr('src') || 'https://images.unsplash.com/photo-1638913662415-8c5f79b20656?q=80&w=2070'
              });
            }
          }
        });
      } catch (naverError) {
        console.error('네이버 뉴스 스크래핑 중 오류 발생:', naverError.message);
      }
    }
    
    // 가져온 뉴스가 있으면 사용, 없으면 기본 데이터 사용
    if (articles.length > 0) {
      newsData['경제'] = articles;
      console.log(`경제 뉴스 ${articles.length}개 수집 완료 (실제 뉴스)`);
    } else {
      // 기본 데이터
      const fallbackData = [{
        title: `오늘의 경제 동향: ${moment().format('MM월 DD일')} 기준`,
        source: '경제신문',
        date: moment().format('YYYY-MM-DD HH:mm'),
        content: `오늘의 경제 동향을 분석합니다. ${moment().format('YYYY년 MM월 DD일')}의 주요 이슈는 물가와 금리 정책입니다. 현재 원/달러 환율은 약 1350원 수준입니다.`,
        imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070',
        link: 'https://www.hankyung.com/economy'
      }];
      
      newsData['경제'] = fallbackData;
      console.log(`경제 뉴스 ${fallbackData.length}개 수집 완료 (기본 데이터)`);
    }
    
  } catch (error) {
    console.error('경제 뉴스 수집 중 오류 발생:', error.message);
    
    // 오류 발생 시 기본 데이터 사용
    const fallbackData = [{
      title: `오늘의 경제 뉴스: ${moment().format('MM월 DD일')}`,
      source: '경제신문',
      date: moment().format('YYYY-MM-DD HH:mm'),
      content: `오늘의 주요 경제 뉴스입니다. 실시간 환율 정보와 주요 이슈를 확인하세요.`,
      imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070',
      link: 'https://www.hankyung.com/economy'
    }];
    
    newsData['경제'] = fallbackData;
    console.log(`경제 뉴스 ${fallbackData.length}개 수집 완료 (오류 대체 데이터)`);
  }
};

const collectSportsNews = async () => {
  try {
    console.log('스포츠 뉴스 수집 중...');
    
    // 네이버 스포츠 뉴스에서 직접 스크래핑
    const sportsArticles = [];
    
    // 네이버 스포츠 뉴스 스크래핑
    try {
      const response = await axios.get('https://sports.naver.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // 주요 뉴스 스크래핑
      $('.home_news .today_item, .home_news .main_item').each((index, element) => {
        if (sportsArticles.length < 9) {
          const titleEl = $(element).find('.title');
          const title = titleEl.text().trim();
          let link = $(element).find('a').attr('href');
          
          // 상대 경로를 절대 경로로 변환
          if (link && !link.startsWith('http')) {
            link = 'https://sports.naver.com' + link;
          }
          
          if (title && link) {
            sportsArticles.push({
              title,
              source: '네이버 스포츠',
              date: moment().format('YYYY-MM-DD HH:mm'),
              content: `${title} - 자세한 내용은 원문을 참조하세요.`,
              link,
              imageUrl: $(element).find('img').attr('src') || sportsImages[sportsArticles.length % sportsImages.length]
            });
          }
        }
      });
    } catch (naverError) {
      console.error('네이버 스포츠 뉴스 스크래핑 중 오류 발생:', naverError.message);
    }
    
    // 네이버에서 충분한 뉴스를 가져오지 못했다면 스포티비 뉴스에서도 가져오기
    if (sportsArticles.length < 9) {
      try {
        const sportvResponse = await axios.get('https://www.spotvnews.co.kr/news/articleList.html?sc_section_code=S1N1', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const sportv$ = cheerio.load(sportvResponse.data);
        
        sportv$('.article-list .list-block').each((index, element) => {
          if (sportsArticles.length < 9) {
            const titleEl = sportv$(element).find('.list-titles');
            const title = titleEl.text().trim();
            let link = sportv$(element).find('a').attr('href');
            
            // 상대 경로를 절대 경로로 변환
            if (link && !link.startsWith('http')) {
              link = 'https://www.spotvnews.co.kr' + link;
            }
            
            const date = sportv$(element).find('.list-dated').text().trim() || moment().format('YYYY-MM-DD HH:mm');
            
            if (title && link) {
              sportsArticles.push({
                title,
                source: '스포티비뉴스',
                date,
                content: `${title} - 자세한 내용은 원문을 참조하세요.`,
                link,
                imageUrl: sportv$(element).find('img').attr('src') || sportsImages[sportsArticles.length % sportsImages.length]
              });
            }
          }
        });
      } catch (sportvError) {
        console.error('스포티비 뉴스 스크래핑 중 오류 발생:', sportvError.message);
      }
    }
    
    // 가져온 뉴스가 있으면 사용, 없으면 기본 데이터 사용
    if (sportsArticles.length > 0) {
      newsData['스포츠'] = sportsArticles;
      console.log(`스포츠 뉴스 ${sportsArticles.length}개 수집 완료 (실제 뉴스)`);
    } else {
      // 기본 데이터
      const fallbackData = [{
        title: `오늘의 스포츠 하이라이트: ${moment().format('MM월 DD일')}`,
        source: '스포츠신문',
        date: moment().format('YYYY-MM-DD HH:mm'),
        content: `오늘의 주요 스포츠 소식입니다. 국내외 스포츠 경기 결과와 선수들의 활약상을 확인하세요.`,
        imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070',
        link: 'https://sports.naver.com/'
      }];
      
      newsData['스포츠'] = fallbackData;
      console.log(`스포츠 뉴스 ${fallbackData.length}개 수집 완료 (기본 데이터)`);
    }
    
  } catch (error) {
    console.error('스포츠 뉴스 수집 중 오류 발생:', error.message);
    
    // 오류 발생 시 기본 데이터 사용
    const fallbackData = [{
      title: `오늘의 스포츠 소식: ${moment().format('MM월 DD일')}`,
      source: '스포츠신문',
      date: moment().format('YYYY-MM-DD HH:mm'),
      content: `오늘의 주요 스포츠 경기 결과와 소식을 확인하세요.`,
      imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070',
      link: 'https://sports.naver.com/'
    }];
    
    newsData['스포츠'] = fallbackData;
    console.log(`스포츠 뉴스 ${fallbackData.length}개 수집 완료 (오류 대체 데이터)`);
  }
};

const collectUSStockNews = async () => {
  try {
    console.log('미국주식 뉴스 수집 중...');
    
    // 더미 데이터 생성
    const newNews = [
      {
        title: `미국 주식시장: ${moment().format('MM월 DD일')} 마감 동향`,
        source: '월스트리트저널',
        date: moment().format('YYYY-MM-DD HH:mm'),
        content: `오늘의 뉴욕 증시 마감 동향입니다. ${moment().format('YYYY년 MM월 DD일')}의 주요 지수와 종목별 분석을 확인하세요.`,
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070'
      },
    ];
    
    newsData['미국주식'] = [...newNews, ...newsData['미국주식']].slice(0, 9);
    console.log(`미국주식 뉴스 ${newNews.length}개 수집 완료`);
    
  } catch (error) {
    console.error('미국주식 뉴스 수집 중 오류 발생:', error);
  }
};

const collectExchangeRateNews = async () => {
  try {
    console.log('환율 뉴스 수집 중...');
    
    // 네이버 금융 환율 정보 페이지에서 직접 스크래핑
    const response = await axios.get('https://finance.naver.com/marketindex/?tabSel=exchange', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const exchangeArticles = [];
    
    // 주요 환율 정보 추출
    $('.data_lst li').each((index, element) => {
      if (exchangeArticles.length < 9) {
        const currencyName = $(element).find('.h_lst').text().trim();
        const value = $(element).find('.value').text().trim();
        const change = $(element).find('.change').text().trim();
        const status = $(element).find('.blind').text().trim();
        const tabCd = $(element).attr('data-tab-cd') || '';
        
        if (currencyName && value) {
          const detailUrl = `https://finance.naver.com/marketindex/exchangeDetail.naver?marketindexCd=${tabCd}`;
          const title = `${currencyName} 환율: ${value}원`;
          const content = `현재 ${currencyName} 환율은 ${value}원이며, 전일 대비 ${change} ${status}했습니다. 이는 실시간으로 변동되는 시세입니다.`;
          
          exchangeArticles.push({
            title,
            source: '네이버 금융',
            date: moment().format('YYYY-MM-DD HH:mm'),
            content,
            link: detailUrl,
            imageUrl: currencyImages[index % currencyImages.length]
          });
        }
      }
    });
    
    // 환율 뉴스 가져오기
    if (exchangeArticles.length < 9) {
      try {
        // 뉴스 스크래핑 시도 - 이데일리 환율뉴스
        const newsResponse = await axios.get('https://www.edaily.co.kr/search/news/?keyword=%ED%99%98%EC%9C%A8&page=1', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const news$ = cheerio.load(newsResponse.data);
        
        news$('.list-news li').each((index, element) => {
          if (exchangeArticles.length < 9) {
            const titleEl = news$(element).find('.tit');
            const title = titleEl.text().trim();
            let link = news$(element).find('a').attr('href');
            
            if (link && !link.startsWith('http')) {
              link = 'https://www.edaily.co.kr' + link;
            }
            
            const date = news$(element).find('.date').text().trim() || moment().format('YYYY-MM-DD HH:mm');
            
            if (title && link) {
              exchangeArticles.push({
                title,
                source: '이데일리',
                date,
                content: `${title} - 자세한 내용은 원문을 참조하세요.`,
                link,
                imageUrl: news$(element).find('img').attr('src') || currencyImages[(exchangeArticles.length) % currencyImages.length]
              });
            }
          }
        });
      } catch (newsError) {
        console.error('환율 뉴스 스크래핑 중 오류 발생:', newsError.message);
      }
    }
    
    // 네이버 뉴스에서도 환율 관련 뉴스 가져오기
    if (exchangeArticles.length < 9) {
      try {
        const naverNewsResponse = await axios.get('https://search.naver.com/search.naver?where=news&query=%ED%99%98%EC%9C%A8&sm=tab_opt&sort=1', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        const naverNews$ = cheerio.load(naverNewsResponse.data);
        
        naverNews$('.news_area').each((index, element) => {
          if (exchangeArticles.length < 9) {
            const titleEl = naverNews$(element).find('.news_tit');
            const title = titleEl.text().trim();
            const link = titleEl.attr('href');
            const source = naverNews$(element).find('.info_group a.info').first().text().trim();
            const date = naverNews$(element).find('.info_group span.info').text().trim() || moment().format('YYYY-MM-DD HH:mm');
            
            if (title && link) {
              exchangeArticles.push({
                title,
                source: source || '네이버 뉴스',
                date,
                content: `${title} - 자세한 내용은 원문을 참조하세요.`,
                link,
                imageUrl: currencyImages[(exchangeArticles.length) % currencyImages.length]
              });
            }
          }
        });
      } catch (naverNewsError) {
        console.error('네이버 환율 뉴스 스크래핑 중 오류 발생:', naverNewsError.message);
      }
    }
    
    // 가져온 뉴스가 있으면 사용, 없으면 기본 데이터 사용
    if (exchangeArticles.length > 0) {
      newsData['환율'] = exchangeArticles;
      console.log(`환율 뉴스 ${exchangeArticles.length}개 수집 완료 (실제 데이터)`);
    } else {
      // 기본 데이터
      const fallbackData = [{
        title: `오늘의 환율 정보: 원/달러 약 1350원대 거래`,
        source: '외환시장',
        date: moment().format('YYYY-MM-DD HH:mm'),
        content: `현재 원/달러 환율은 약 1350원 수준에서 거래되고 있습니다. 이는 전일 대비 소폭 상승한 수치입니다. 글로벌 경제 불안과 미 달러화 강세가 원화 가치에 영향을 주고 있는 것으로 분석됩니다.`,
        imageUrl: 'https://images.unsplash.com/photo-1600679362237-e168aa39b362?q=80&w=2070',
        link: 'https://finance.naver.com/marketindex/?tabSel=exchange'
      }];
      
      newsData['환율'] = fallbackData;
      console.log(`환율 뉴스 ${fallbackData.length}개 수집 완료 (기본 데이터)`);
    }
    
  } catch (error) {
    console.error('환율 뉴스 수집 중 오류 발생:', error.message);
    
    // 오류 발생 시 기본 데이터 사용
    const fallbackData = [{
      title: `오늘의 환율 정보: 원/달러 약 1350원대 거래`,
      source: '외환시장',
      date: moment().format('YYYY-MM-DD HH:mm'),
      content: `현재 원/달러 환율은 약 1350원 수준에서 거래되고 있습니다. 이는 전일 대비 소폭 상승한 수치입니다. 글로벌 경제 불안과 미 달러화 강세가 원화 가치에 영향을 주고 있는 것으로 분석됩니다.`,
      imageUrl: 'https://images.unsplash.com/photo-1600679362237-e168aa39b362?q=80&w=2070',
      link: 'https://finance.naver.com/marketindex/?tabSel=exchange'
    }];
    
    newsData['환율'] = fallbackData;
    console.log(`환율 뉴스 ${fallbackData.length}개 수집 완료 (오류 대체 데이터)`);
  }
};

// 모든 뉴스 수집 함수
const collectAllNews = async () => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] 뉴스 수집 작업 시작...`);
  
  await Promise.all([
    collectEconomicNews(),
    collectSportsNews(),
    collectUSStockNews(),
    collectExchangeRateNews()
  ]);
  
  lastUpdateTime = moment().format('YYYY년 MM월 DD일 HH:mm:ss');
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] 뉴스 수집 작업 완료`);
};

// 초기 데이터 로드 - 서버 시작 시 실행
const initializeData = async () => {
  // 실제 사진으로 이미지 URL 목록 변경
  const economicImages = [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070',
    'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?q=80&w=2076',
    'https://images.unsplash.com/photo-1638913662415-8c5f79b20656?q=80&w=2070',
    'https://images.unsplash.com/photo-1604594849809-dfedbc827105?q=80&w=2070',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2070',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=2070',
    'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?q=80&w=2070',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070',
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071'
  ];
  
  const sportsImages = [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070',
    'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=2069',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=2070',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=2070',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2076',
    'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=2070',
    'https://images.unsplash.com/photo-1628891890467-b79f2c8ba9dc?q=80&w=2070',
    'https://images.unsplash.com/photo-1560089000-7433a4ebbd64?q=80&w=2070'
  ];
  
  const stockImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=2070',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070',
    'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=2070',
    'https://images.unsplash.com/photo-1560221328-12fe60f83ab8?q=80&w=2074',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070',
    'https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=2070',
    'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?q=80&w=2070'
  ];
  
  const currencyImages = [
    'https://images.unsplash.com/photo-1600679362237-e168aa39b362?q=80&w=2070',
    'https://images.unsplash.com/photo-1544375555-c5cabcd5b6ef?q=80&w=2070',
    'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=2071',
    'https://images.unsplash.com/photo-1591832608633-c212b667b4da?q=80&w=2070',
    'https://images.unsplash.com/photo-1534951009808-766178b47a4f?q=80&w=2070',
    'https://images.unsplash.com/photo-1601389848186-9ed2af7e8488?q=80&w=2052',
    'https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070',
    'https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=2071',
    'https://images.unsplash.com/photo-1618044619888-009e412ff12a?q=80&w=2070'
  ];
  
  // 실제 뉴스 데이터를 가져오기 위한 사이트 URL 설정
  const newsSources = {
    economy: {
      site: 'https://www.hankyung.com/economy',
      selector: '.news-list .news-item',
      titleSelector: '.news-tit',
      timeSelector: '.date-time',
      domain: 'https://www.hankyung.com'
    },
    sports: {
      site: 'https://sports.news.naver.com/',
      selector: '.home_news .content',
      titleSelector: '.title',
      timeSelector: '.info',
      domain: 'https://sports.news.naver.com'
    },
    stock: {
      site: 'https://finance.naver.com/news/mainnews.naver',
      selector: '.mainNewsList li',
      titleSelector: 'dd.articleSubject a',
      timeSelector: 'dd.articleSummary',
      domain: 'https://finance.naver.com'
    },
    exchange: {
      site: 'https://finance.naver.com/marketindex/?tabSel=exchange',
      selector: '.data_lst li',
      valueSelector: '.value',
      changeSelector: '.change',
      domain: 'https://finance.naver.com'
    }
  };

  // 뉴스 스크래핑 함수
  const scrapeNews = async (sourceType) => {
    try {
      const source = newsSources[sourceType];
      const response = await axios.get(source.site, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const items = [];
      
      $(source.selector).each((index, element) => {
        if (index < 9) {
          let title, link, time, content;
          
          if (sourceType === 'exchange') {
            const currencyName = $(element).find('.h_lst').text().trim();
            const value = $(element).find(source.valueSelector).text().trim();
            const change = $(element).find(source.changeSelector).text().trim();
            
            title = `${currencyName} 환율: ${value}원`;
            link = `${source.domain}/marketindex/exchangeDetail.naver?marketindexCd=${$(element).attr('data-tab-cd') || ''}`;
            time = moment().format('YYYY-MM-DD HH:mm');
            content = `현재 ${currencyName} 환율은 ${value}원이며, 전일 대비 ${change}입니다. 이는 실시간으로 변동되는 시세입니다.`;
          } else {
            title = $(element).find(source.titleSelector).text().trim();
            link = $(element).find('a').attr('href');
            
            if (link && !link.startsWith('http')) {
              link = link.startsWith('/') ? source.domain + link : source.domain + '/' + link;
            }
            
            time = $(element).find(source.timeSelector).text().trim() || moment().format('YYYY-MM-DD HH:mm');
            content = `${title} - 자세한 내용은 원문을 참조하세요.`;
          }
          
          // 각 카테고리별 기본 이미지 설정
          let imageUrl;
          switch(sourceType) {
            case 'economy':
              imageUrl = economicImages[index % economicImages.length];
              break;
            case 'sports':
              imageUrl = sportsImages[index % sportsImages.length];
              break;
            case 'stock':
              imageUrl = stockImages[index % stockImages.length];
              break;
            case 'exchange':
              imageUrl = currencyImages[index % currencyImages.length];
              break;
          }
          
          items.push({
            title,
            source: sourceType === 'economy' ? '한국경제' :
                    sourceType === 'sports' ? '스포츠 뉴스' :
                    sourceType === 'stock' ? '네이버 금융' : '네이버 환율정보',
            date: time,
            content,
            link,
            imageUrl
          });
        }
      });
      
      return items;
    } catch (error) {
      console.error(`${sourceType} 뉴스 스크래핑 중 오류 발생:`, error.message);
      return [];
    }
  };

  try {
    // 실시간 스크래핑 시도
    const economyNews = await scrapeNews('economy');
    const sportsNews = await scrapeNews('sports');
    const stockNews = await scrapeNews('stock');
    const exchangeNews = await scrapeNews('exchange');
    
    // 실제 뉴스 데이터가 있으면 사용하고, 없으면 기존 더미 데이터 사용
    newsData = {
      '경제': economyNews.length > 0 ? economyNews : Array.from({ length: 9 }, (_, i) => ({
        title: `한국 경제 뉴스 ${i+1}`,
        source: '경제신문',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 한국 경제에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: economicImages[i],
        link: 'https://www.hankyung.com/economy'
      })),
      '스포츠': sportsNews.length > 0 ? sportsNews : Array.from({ length: 9 }, (_, i) => ({
        title: `스포츠 뉴스 ${i+1}`,
        source: '스포츠신문',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 스포츠에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: sportsImages[i],
        link: 'https://sports.news.naver.com/'
      })),
      '미국주식': stockNews.length > 0 ? stockNews : Array.from({ length: 9 }, (_, i) => ({
        title: `미국 주식 뉴스 ${i+1}`,
        source: '월스트리트저널',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 미국 주식에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: stockImages[i],
        link: 'https://finance.naver.com/news/mainnews.naver'
      })),
      '환율': exchangeNews.length > 0 ? exchangeNews : Array.from({ length: 9 }, (_, i) => ({
        title: `환율 뉴스 ${i+1}`,
        source: '외환시장',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 환율에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: currencyImages[i],
        link: 'https://finance.naver.com/marketindex/?tabSel=exchange'
      }))
    };
    
    console.log('초기 데이터 생성 완료');
  } catch (error) {
    console.error('초기 데이터 생성 중 오류:', error.message);
    
    // 오류 발생 시 기본 데이터 사용
    newsData = {
      '경제': Array.from({ length: 9 }, (_, i) => ({
        title: `한국 경제 뉴스 ${i+1}`,
        source: '경제신문',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 한국 경제에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: economicImages[i],
        link: 'https://www.hankyung.com/economy'
      })),
      '스포츠': Array.from({ length: 9 }, (_, i) => ({
        title: `스포츠 뉴스 ${i+1}`,
        source: '스포츠신문',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 스포츠에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: sportsImages[i],
        link: 'https://sports.news.naver.com/'
      })),
      '미국주식': Array.from({ length: 9 }, (_, i) => ({
        title: `미국 주식 뉴스 ${i+1}`,
        source: '월스트리트저널',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 미국 주식에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: stockImages[i],
        link: 'https://finance.naver.com/news/mainnews.naver'
      })),
      '환율': Array.from({ length: 9 }, (_, i) => ({
        title: `환율 뉴스 ${i+1}`,
        source: '외환시장',
        date: moment().subtract(i, 'hours').format('YYYY-MM-DD HH:mm'),
        content: `이것은 환율에 관한 뉴스 ${i+1}의 내용입니다. 이 데이터는 서버 시작 시 생성된 초기 데이터입니다.`,
        imageUrl: currencyImages[i],
        link: 'https://finance.naver.com/marketindex/?tabSel=exchange'
      }))
    };
  }
};

// 스케줄러 설정 - 매 시간 0분에 실행 (시간당 한 번)
cron.schedule('0 * * * *', collectAllNews);

// 데모용 - 매 분마다 실행 (테스트용)
// cron.schedule('* * * * *', collectAllNews);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`현재 시간: ${moment().format('YYYY년 MM월 DD일 HH:mm:ss')} (KST)`);
  
  // 초기 데이터 생성
  initializeData().then(() => {
    console.log('초기 데이터 생성 완료');
    // 뉴스 수집 시작
    collectAllNews();
    
    // 1시간마다 뉴스 자동 수집 (cron 표현식: 매 시간 0분에 실행)
    cron.schedule('0 * * * *', () => {
      collectAllNews();
    });
  });
});

// SPA 지원을 위한 라우트 - 모든 경로에서 index.html 반환
// 실제 배포 시 사용할 코드
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
// }); 