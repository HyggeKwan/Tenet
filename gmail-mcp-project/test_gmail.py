#!/usr/bin/env python3
"""
Gmail API 기능 테스트 스크립트
"""

from gmail_service import GmailService

def test_gmail_service():
    """Gmail 서비스 기능을 테스트합니다."""
    print("Gmail API 테스트를 시작합니다...")
    
    # Gmail 서비스 초기화
    gmail_service = GmailService()
    
    if not gmail_service.service:
        print("❌ Gmail 서비스 초기화 실패")
        return
    
    print("✅ Gmail 서비스 초기화 성공")
    
    # 1. 이메일 목록 가져오기 테스트
    print("\n📧 이메일 목록 가져오기 테스트...")
    emails = gmail_service.get_emails(max_results=5)
    
    if emails:
        print(f"✅ {len(emails)}개의 이메일을 가져왔습니다.")
        for i, email in enumerate(emails, 1):
            print(f"  {i}. {email['subject']} - {email['sender']}")
    else:
        print("❌ 이메일 목록을 가져올 수 없습니다.")
    
    # 2. 키워드 검색 테스트
    print("\n🔍 키워드 검색 테스트...")
    search_keywords = ["important", "urgent", "meeting", "project"]
    
    for keyword in search_keywords:
        print(f"\n'{keyword}' 키워드로 검색 중...")
        search_results = gmail_service.search_emails(keyword, max_results=3)
        
        if search_results:
            print(f"✅ '{keyword}' 검색 결과: {len(search_results)}개")
            for j, email in enumerate(search_results, 1):
                print(f"  {j}. {email['subject']} - {email['sender']}")
        else:
            print(f"❌ '{keyword}' 검색 결과가 없습니다.")
    
    print("\n🎉 Gmail API 테스트 완료!")

if __name__ == "__main__":
    test_gmail_service() 