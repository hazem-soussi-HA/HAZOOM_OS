import imaplib, email, os, json, sys
from email.header import decode_header

def decode_utf8(header):
    val, charset = decode_header(header)[0]
    if isinstance(val, bytes): return val.decode(charset or 'utf-8')
    return val

def mail_interface():
    USER = 'hazem.soussi@gmail.com'
    PWD = os.getenv('ALPHA_PONY_GMAIL_APP_PASSWORD')
    
    os.system('cls && chcp 65001 > nul')
    print("\033[1;35m---  ALPHA PONY : DIRECT NEURAL MESSENGER v2.2 ---\033[0m")
    
    try:
        server = imaplib.IMAP4_SSL('imap.gmail.com')
        server.login(USER, PWD)
        print("\033[1;32m[CONNECTED]\033[0m Gateway SSL established.\n")
        
        while True:
            print("\033[1;37m[1]\033[0m List Intel (10 Last Mails)")
            print("\033[1;37m[2]\033[0m Read Intel (by ID)")
            print("\033[1;31m[Q]\033[0m Shutdown App")
            
            choice = input("\nHazoom > ").lower()
            if choice == '1':
                server.select('inbox')
                _, data = server.search(None, 'ALL')
                ids = data[0].split()[-10:]
                for m_id in ids:
                    _, m_data = server.fetch(m_id, '(RFC822)')
                    msg = email.message_from_bytes(m_data[0][1])
                    print(f" \033[1;36mID:{m_id.decode()}\033[0m | {decode_utf8(msg['subject'])}")
            elif choice == 'q':
                break
        server.logout()
    except Exception as e:
        print(f"\033[1;31m[CRITICAL ERROR] {e}\033[0m")

if __name__ == '__main__':
    mail_interface()
