import os, json
from google_auth_oauthlib.flow import InstalledAppFlow

# Security: Scopes limited to Read-Only
scopes = ['https://www.googleapis.com/auth/gmail.readonly']

if os.path.exists('credentials.json'):
    try:
        flow = InstalledAppFlow.from_client_secrets_file('credentials.json', scopes)
        creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
        print(' APOCALYPSE KEY SECURED.')
    except Exception as e:
        print(f' ERROR: {e}')
else:
    print(' ERROR: credentials.json missing.')
