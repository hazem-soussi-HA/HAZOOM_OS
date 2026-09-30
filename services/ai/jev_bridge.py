#!/usr/bin/env python3
"""
JEV Integration Bridge for HAZOOM OS
Connects HAZOOM ecosystem to the JEV 1.13 decision model.
"""
import json
import os
import sys
import urllib.request
import urllib.error

class JEVBridge:
    def __init__(self):
        self.base_url = os.environ.get('JEV_BASE_URL', 'http://127.0.0.1:8440')
        self.token = os.environ.get('JEV_TOKEN', '')
        if not self.token:
            try:
                with open('/root/jev-security/config.json') as f:
                    self.token = json.load(f).get('token', '')
            except:
                self.token = ''

    def _headers(self):
        h = {'Content-Type': 'application/json'}
        if self.token:
            h['Authorization'] = 'Bearer ' + self.token
        return h

    def health(self):
        try:
            r = urllib.request.urlopen(self.base_url + '/healthz', timeout=3)
            return json.loads(r.read())
        except Exception as e:
            return {'ok': False, 'offline': True, 'reason': str(e)}

    def decide(self, state, questions):
        try:
            data = json.dumps({'state': state, 'questions': questions}).encode()
            req = urllib.request.Request(
                self.base_url + '/api/local/decide',
                data=data, headers=self._headers(), method='POST'
            )
            r = urllib.request.urlopen(req, timeout=10)
            return json.loads(r.read())
        except Exception as e:
            return {'error': str(e), 'offline': True}

    def choose(self, state, options, instruction='Choose the best option'):
        return self.decide(state, {
            'selection': {'type': 'choice', 'instructions': instruction, 'criteria': options}
        })

    def noul(self, state, instruction):
        return self.decide(state, {
            'judgment': {'type': 'noul', 'instructions': instruction}
        })

    def score(self, state, levels, instruction):
        return self.decide(state, {
            'evaluation': {'type': 'score', 'instructions': instruction, 'criteria': levels}
        })


if __name__ == '__main__':
    bridge = JEVBridge()
    print('JEV Bridge connected to', bridge.base_url)
    h = bridge.health()
    print('Health:', json.dumps(h, indent=2))
    if h.get('ok'):
        r = bridge.noul('Testing JEV integration', 'Is this working?')
        print('Decision:', json.dumps(r, indent=2))
