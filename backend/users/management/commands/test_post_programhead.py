from django.core.management.base import BaseCommand
import json
import time
from django.test import Client

class Command(BaseCommand):
    help = 'Post a test ProgramHead signup and print the response'

    def handle(self, *args, **options):
        c = Client()
        now = int(time.time())
        username = f'ph_test_cmd_{now}'
        email = f'{username}@example.com'
        payload = {
            'username': username,
            'name': 'CmdTest',
            'surname': 'User',
            'mi': 'B',
            'gender': 'female',
            'contact': '09123456789',
            'email': email,
            'faculty': 'FALS',
            'program': 'Bachelor of Science in Agriculture (BSA)',
            'password': 'Abcd1234!'
        }
        resp = c.post('/api/program-heads/', data=json.dumps(payload), content_type='application/json')
        self.stdout.write('STATUS %s' % resp.status_code)
        try:
            self.stdout.write('BODY %s' % json.dumps(resp.json(), ensure_ascii=False))
        except Exception:
            self.stdout.write('RAW %s' % resp.content)
