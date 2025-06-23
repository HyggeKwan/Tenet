import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

class GmailAuth:
    def __init__(self):
        self.SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
        self.CREDENTIALS_FILE = 'client_secret_874408153647-1u0qeuhobc0kktfeeot7l1nvitra7grp.apps.googleusercontent.com.json'
        self.TOKEN_FILE = 'token.pickle'
        
    def authenticate(self):
        """Gmail API 인증을 수행합니다."""
        creds = None
        
        # 토큰 파일이 있으면 로드
        if os.path.exists(self.TOKEN_FILE):
            with open(self.TOKEN_FILE, 'rb') as token:
                creds = pickle.load(token)
        
        # 유효한 인증 정보가 없거나 만료된 경우
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                flow = InstalledAppFlow.from_client_secrets_file(
                    self.CREDENTIALS_FILE, self.SCOPES)
                creds = flow.run_local_server(port=0)
            
            # 토큰을 파일에 저장
            with open(self.TOKEN_FILE, 'wb') as token:
                pickle.dump(creds, token)
        
        return creds
    
    def get_service(self):
        """Gmail API 서비스를 반환합니다."""
        try:
            creds = self.authenticate()
            service = build('gmail', 'v1', credentials=creds)
            return service
        except HttpError as error:
            print(f'Gmail API 오류: {error}')
            return None 