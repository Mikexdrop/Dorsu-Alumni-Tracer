import json
import urllib.request
import time

ts = int(time.time())
username = f'ph_test_api_{ts}'
email = f'{username}@example.com'

url = 'http://127.0.0.1:8000/api/program-heads/'
headers = {'Content-Type': 'application/json'}
payload = {
    'username': username,
    'name': 'Api',
    'surname': 'Tester',
    'mi': 'B',
    'gender': 'male',
    'contact': '0912345' + str(ts % 1000000).zfill(6),
    'email': email,
    'faculty': 'FALS',
    'program': 'Bachelor of Science in Agriculture (BSA)',
    'password': 'SomePass123!'
}
req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
try:
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8')
        print('Status:', resp.status)
        print('Response:', body)
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8')
    print('HTTPError status:', e.code)
    print('Response:', body)
except Exception as e:
    print('Error:', e)
