import os, sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_backend.settings')
import django
django.setup()

from users.models import ProgramHead
from django.db import connection

print('Recent ProgramHead entries:')
for ph in ProgramHead.objects.all().order_by('-id')[:5]:
    print({'id': ph.id, 'username': ph.username, 'email': ph.email, 'status': ph.status})

print('\nChecking users_programhead legacy table for matching usernames:')
with connection.cursor() as cursor:
    cursor.execute("SELECT username, email, id FROM users_programhead ORDER BY id DESC LIMIT 5")
    rows = cursor.fetchall()
    for r in rows:
        print({'username': r[0], 'email': r[1], 'legacy_id': r[2]})

print('\nDone')
