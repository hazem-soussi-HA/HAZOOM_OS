import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

def initiate_auth():
    flow = InstalledAppFlow.from_client_secrets_file(
        'credentials.json', SCOPES, redirect_uri='http://localhost:8080')
    
    auth_url, _ = flow.authorization_url(prompt='consent')
    
    print("\n" + "="*60)
    print("?? NEURAL GATEWAY ONLINE")
    print("="*60)
    print(f"\n1. Open this URL in your browser:\n\n{auth_url}\n")
    print("2. Log in and accept.")
    print("3. You will be redirected to an error page (localhost:8080).")
    print("4. COPY the full URL of that error page and paste it below.")
    print("="*60)
    
    redirect_response = input("\nPASTE REDIRECT URL HERE > ")
    flow.fetch_token(authorization_response=redirect_response)
    
    creds = flow.credentials
    with open('token.json', 'w') as token:
        token.write(creds.to_json())
    print("\n[?] APOCALYPSE KEY GENERATED AND SEALED.")

if __name__ == '__main__':
    initiate_auth()
