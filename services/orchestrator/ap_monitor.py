import imaplib, os, json, time

def fetch_loop():
    password = os.getenv('ALPHA_PONY_GMAIL_APP_PASSWORD')
    while True:
        try:
            mail = imaplib.IMAP4_SSL('imap.gmail.com')
            mail.login('hazem.soussi@gmail.com', password)
            mail.select('inbox')
            _, data = mail.search(None, 'UNSEEN')
            count = len(data[0].split()) if data[0] else 0
            with open('sync_state.json', 'w') as f:
                json.dump({'status': 'ONLINE', 'unread': count, 'last': time.ctime()}, f)
            mail.logout()
        except: pass
        time.sleep(30)

if __name__ == '__main__':
    fetch_loop()
