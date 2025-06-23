import base64
import email
from typing import List, Dict, Optional
from googleapiclient.errors import HttpError
from gmail_auth import GmailAuth

class GmailService:
    def __init__(self):
        self.auth = GmailAuth()
        self.service = self.auth.get_service()
    
    def get_emails(self, max_results: int = 10) -> List[Dict]:
        """이메일 목록을 가져옵니다."""
        if not self.service:
            return []
        
        try:
            # 이메일 목록 가져오기
            results = self.service.users().messages().list(
                userId='me', 
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                email_data = self.get_email_details(message['id'])
                if email_data:
                    emails.append(email_data)
            
            return emails
            
        except HttpError as error:
            print(f'이메일 목록 가져오기 오류: {error}')
            return []
    
    def get_email_details(self, message_id: str) -> Optional[Dict]:
        """특정 이메일의 상세 정보를 가져옵니다."""
        try:
            message = self.service.users().messages().get(
                userId='me', 
                id=message_id,
                format='full'
            ).execute()
            
            headers = message['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '제목 없음')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), '발신자 없음')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '날짜 없음')
            
            # 이메일 본문 추출
            body = self.extract_email_body(message['payload'])
            
            return {
                'id': message_id,
                'subject': subject,
                'sender': sender,
                'date': date,
                'body': body,
                'snippet': message.get('snippet', '')
            }
            
        except HttpError as error:
            print(f'이메일 상세 정보 가져오기 오류: {error}')
            return None
    
    def extract_email_body(self, payload: Dict) -> str:
        """이메일 본문을 추출합니다."""
        if 'body' in payload and payload['body'].get('data'):
            data = payload['body']['data']
            decoded_data = base64.urlsafe_b64decode(data).decode('utf-8')
            return decoded_data
        elif 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    if 'data' in part['body']:
                        data = part['body']['data']
                        decoded_data = base64.urlsafe_b64decode(data).decode('utf-8')
                        return decoded_data
        return ''
    
    def search_emails(self, query: str, max_results: int = 10) -> List[Dict]:
        """특정 키워드로 이메일을 검색합니다."""
        if not self.service:
            return []
        
        try:
            # Gmail 검색 쿼리 실행
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=max_results
            ).execute()
            
            messages = results.get('messages', [])
            emails = []
            
            for message in messages:
                email_data = self.get_email_details(message['id'])
                if email_data:
                    emails.append(email_data)
            
            return emails
            
        except HttpError as error:
            print(f'이메일 검색 오류: {error}')
            return [] 