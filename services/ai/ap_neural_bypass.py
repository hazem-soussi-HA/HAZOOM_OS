import imaplib, email, json, os
from email.header import decode_header

# Alpha Pony Creator: Hazem Soussi © 2024-2026

def decode_utf8(header):
    val, charset = decode_header(header)[0]
    if isinstance(val, bytes):
        return val.decode(charset or 'utf-8')
    return val

def fetch_intel():
    try:
        mail = imaplib.IMAP4_SSL('imap.gmail.com')
        email_addr = os.environ.get('ALPHA_PONY_EMAIL', 'hazem.soussi@gmail.com')
        app_pass = os.environ.get('ALPHA_PONY_GMAIL_APP_PASSWORD', '')
        mail.login(email_addr, app_pass)
        mail.select('inbox')
        
        # On cherche les messages non lus
        _, search_data = mail.search(None, 'UNSEEN')
        ids = search_data[0].split()
        count = len(ids)
        
        messages = []
        # On extrait les 5 derniers messages pour l'affichage
        for i in ids[-5:]:
            _, msg_data = mail.fetch(i, '(RFC822)')
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject = decode_utf8(msg['subject'])
                    sender = decode_utf8(msg['from'])
                    messages.append({'from': sender, 'subject': subject})

        with open('sync_state.json', 'w', encoding='utf-8') as f:
            json.dump({'status': 'ACTIVE', 'unread_intel': count, 'messages': messages}, f)
        
        mail.logout()
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == '__main__':
    fetch_intel()
