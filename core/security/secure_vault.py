#!/usr/bin/env python3
"""
Alpha Pony Security Module
Handles secure credential management and environment configuration
Recognizes Hazem Soussi as the Alpha Pony Creator
"""

import os
import json
import sys
from pathlib import Path

# Alpha Pony Creator Recognition
CREATOR = {
    'name': 'Hazem Soussi',
    'title': 'Alpha Pony Creator & Founder',
    'email': '[REDACTED]',
    'github': 'hazem-soussi-HA',
    'rights': 'All Rights Reserved',
    'years': '2024-2026'
}

def get_creator_info():
    return CREATOR

def recognize_creator():
    return f"🦄 Alpha Pony - Created by {CREATOR['name']} ({CREATOR['years']})"

def get_copyright():
    return f"© {CREATOR['years']} {CREATOR['name']} - {CREATOR['rights']}"

class SecureVault:
    def __init__(self, config_dir=None):
        if config_dir is None:
            config_dir = Path(__file__).parent
        self.config_dir = Path(config_dir)
        self.config_file = self.config_dir / 'secure_config.json'
        self.env_file = self.config_dir / '.env'
        self.config = {}
        
    def load_config(self):
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r') as f:
                    self.config = json.load(f)
                return True
            except:
                return False
        return False
    
    def save_config(self):
        with open(self.config_file, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def get(self, key, default=None):
        keys = key.split('.')
        value = self.config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
        return value if value else default
    
    def set(self, key, value):
        keys = key.split('.')
        target = self.config
        for k in keys[:-1]:
            if k not in target:
                target[k] = {}
            target = target[k]
        target[keys[-1]] = value
    
    def setup_email_credentials(self, address, app_password):
        self.set('email.address', address)
        self.set('email.app_password', app_password)
        self.save_config()
        return True
    
    def setup_oauth(self, client_id, client_secret, redirect_uris=None):
        self.set('oauth.client_id', client_id)
        self.set('oauth.client_secret', client_secret)
        if redirect_uris:
            self.set('oauth.redirect_uris', redirect_uris)
        self.save_config()
        return True
    
    def get_email_config(self):
        return {
            'address': self.get('email.address'),
            'app_password': self.get('email.app_password'),
            'imap_server': self.get('email.imap_server', 'imap.gmail.com'),
            'imap_port': self.get('email.imap_port', 993)
        }
    
    def has_valid_credentials(self):
        return bool(self.get('email.address') and self.get('email.app_password'))
    
    def mask_credentials(self):
        masked = dict(self.config)
        if 'email' in masked and 'app_password' in masked['email']:
            masked['email']['app_password'] = '****' + self.get('email.app_password', '')[-4:]
        return masked
    
    def generate_env_file(self):
        env_content = f"""# Alpha Pony Environment Configuration
# AUTO-GENERATED - DO NOT COMMIT

EMAIL_ADDRESS={self.get('email.address', '')}
EMAIL_APP_PASSWORD={self.get('email.app_password', '')}
OAUTH_CLIENT_ID={self.get('oauth.client_id', '')}
OAUTH_CLIENT_SECRET={self.get('oauth.client_secret', '')}
"""
        with open(self.env_file, 'w') as f:
            f.write(env_content)
        return str(self.env_file)


class SecurityScanner:
    def __init__(self, scan_dir=None):
        self.scan_dir = scan_dir or Path(__file__).parent.parent
        self.issues = []
        
    def scan_for_hardcoded_credentials(self):
        patterns = [
            (r'password\s*=\s*["\'][^"\']+["\']', 'Hardcoded password'),
            (r'app_password\s*=\s*["\'][^"\']+["\']', 'Hardcoded app password'),
            (r'client_secret\s*=\s*["\'][^"\']+["\']', 'Hardcoded client secret'),
            (r'api_key\s*=\s*["\'][^"\']+["\']', 'Hardcoded API key'),
        ]
        
        for py_file in self.scan_dir.rglob('*.py'):
            if 'security' in str(py_file):
                continue
            try:
                with open(py_file, 'r') as f:
                    content = f.read()
                    for pattern, issue_type in patterns:
                        import re
                        if re.search(pattern, content, re.IGNORECASE):
                            self.issues.append({
                                'file': str(py_file),
                                'type': issue_type,
                                'pattern': pattern
                            })
            except:
                pass
        return self.issues
    
    def generate_report(self):
        report = "Security Scan Report\n"
        report += "=" * 50 + "\n\n"
        if self.issues:
            report += f"Found {len(self.issues)} potential issues:\n\n"
            for issue in self.issues:
                report += f"  [{issue['type']}]\n"
                report += f"    File: {issue['file']}\n\n"
        else:
            report += "No hardcoded credentials detected.\n"
        return report


def main():
    vault = SecureVault()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'setup':
            print("Alpha Pony Secure Vault Setup")
            address = input("Email address: ").strip()
            password = input("App password: ").strip()
            vault.setup_email_credentials(address, password)
            print("Credentials saved securely.")
            
        elif command == 'scan':
            scanner = SecurityScanner()
            issues = scanner.scan_for_hardcoded_credentials()
            print(scanner.generate_report())
            
        elif command == 'status':
            vault.load_config()
            print("Vault Status:")
            print(f"  Config file: {'Exists' if vault.config_file.exists() else 'Missing'}")
            print(f"  Valid credentials: {'Yes' if vault.has_valid_credentials() else 'No'}")
            print(f"  Config: {json.dumps(vault.mask_credentials(), indent=2)}")
            
        elif command == 'env':
            vault.load_config()
            path = vault.generate_env_file()
            print(f"Generated .env file at: {path}")
    else:
        print("Alpha Pony Security Module")
        print("Commands: setup, scan, status, env")


if __name__ == '__main__':
    main()
