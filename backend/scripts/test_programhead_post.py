import os
import sys
import json

# Ensure the project root is on sys.path
BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE not in sys.path:
    sys.path.insert(0, BASE)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_backend.settings')
import django
django.setup()

from django.test import Client

c = Client()

payload = {
    'username': '',
    'name': '',
    'surname': '',
    'mi': '',
    'gender': '',
    'contact': '',
    'email': 'invalid',
    'faculty': '',
    'program': '',
    'password': 'short'
}

resp = c.post('/api/program-heads/', data=json.dumps(payload), content_type='application/json')
print('STATUS', resp.status_code)
try:
    j = resp.json()
    print('BODY_JSON', json.dumps(j, ensure_ascii=False))
except Exception:
    print('BODY_RAW', resp.content.decode('utf-8', errors='replace'))
