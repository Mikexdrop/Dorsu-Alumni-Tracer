import os
import sys
import json
import time

BASE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE not in sys.path:
    sys.path.insert(0, BASE)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_backend.settings')
import django
django.setup()

from django.test import Client
from django.utils import timezone

c = Client()

now = int(time.time())
username = f"ph_test_{now}"
email = f"{username}@example.com"

payload = {
    'username': username,
    'name': 'Test',
    'surname': 'User',
    'mi': 'A',
    'gender': 'male',
    'contact': '09123456789',
    'email': email,
    'faculty': 'FALS',
    'program': 'Bachelor of Science in Agriculture (BSA)',
    'password': 'Abcd1234!'
}

resp = c.post('/api/program-heads/', data=json.dumps(payload), content_type='application/json')
print('STATUS', resp.status_code)
try:
    j = resp.json()
    print('BODY_JSON', json.dumps(j, ensure_ascii=False))
except Exception:
    print('BODY_RAW', resp.content.decode('utf-8', errors='replace'))
