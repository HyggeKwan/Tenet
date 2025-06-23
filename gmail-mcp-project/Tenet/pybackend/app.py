from flask import Flask, jsonify, request
import requests
from datetime import datetime, timedelta

app = Flask(__name__)

# YouTube Data API 키를 여기에 입력하세요
YOUTUBE_API_KEY = "YOUR_API_KEY"  # TODO: 실제 API 키로 교체 필요

YOUTUBE_CHANNELS = {
    "korea_economy": [
        {"name": "SBS", "id": "UCkinYTS9IHqOEwR1Sze2JTw"},
        {"name": "KBS", "id": "UCcQTRi69dsVYHN3exePtZ1A"},
        {"name": "YTN", "id": "UChlgI3UHCOnwUGzWzbJ3H5w"}
    ],
    "sports": [
        {"name": "NBA", "id": "UCWJ2lWNubArHWmf3FIHbfcQ"},
        {"name": "MLB", "id": "UCoLrcjPV5PbUrUyXq5mjc_A"},
        {"name": "FIFA", "id": "UCpcTrCXblq78GZrTUTLWeBw"},
        {"name": "Olympics", "id": "UCFYpOk92qurlO5t-Z_y-bOQ"},
        {"name": "PGA Tour", "id": "UCkPIFz4uAqkT6pU6S2FhGYA"}
    ],
    "us_stock": [
        {"name": "CNBC", "id": "UCvJJ_dzjViJCoLf5uKUTwoA"},
        {"name": "Bloomberg", "id": "UCIALMKvObZNtJ6AmdCLP7Lg"}
    ],
    "exchange": [
        {"name": "연합뉴스TV", "id": "UCRuCgcDo_9lLmzBSJjk4c4Q"}
    ]
}

def get_channel_videos(channel_id):
    try:
        # 채널의 최근 동영상 가져오기
        url = f"https://www.googleapis.com/youtube/v3/search"
        params = {
            "key": YOUTUBE_API_KEY,
            "channelId": channel_id,
            "part": "snippet",
            "order": "date",
            "maxResults": 5,
            "type": "video"
        }
        response = requests.get(url, params=params)
        data = response.json()
        
        if "items" not in data:
            print(f"Error fetching videos for channel {channel_id}:", data)
            return []
            
        return data["items"]
    except Exception as e:
        print(f"Error fetching videos for channel {channel_id}:", str(e))
        return []

@app.route('/youtube-news')
def youtube_news():
    category = request.args.get('category', 'korea_economy')
    channels = YOUTUBE_CHANNELS.get(category, [])
    all_news = []
    
    for channel in channels:
        videos = get_channel_videos(channel["id"])
        for video in videos:
            snippet = video["snippet"]
            all_news.append({
                'channel': channel['name'],
                'title': snippet['title'],
                'videoId': video['id']['videoId'],
                'link': f'https://www.youtube.com/watch?v={video["id"]["videoId"]}',
                'thumbnail': snippet['thumbnails']['high']['url'],
                'published': snippet['publishedAt']
            })
    
    # 최신순으로 정렬
    all_news.sort(key=lambda x: x['published'], reverse=True)
    return jsonify(all_news)

if __name__ == '__main__':
    app.run(port=5000, debug=True) 