import os
import django
import json
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_backend.settings')
django.setup()

API_URL = 'http://127.0.0.1:8000/api/alumni-surveys/'

payload = {
    'last_name': 'E2E',
    'first_name': 'Tester',
    'email': 'e2e@test.example',
    'age': 29,
    'job_difficulties': [],
    # omit employment_records and self_employment when empty (frontend logic)
}

data = json.dumps(payload).encode('utf-8')
req = Request(API_URL, data=data, headers={'Content-Type': 'application/json'})

print('Posting to', API_URL)
try:
    resp = urlopen(req, timeout=10)
    body = resp.read().decode('utf-8')
    print('Response status:', resp.getcode())
    print('Response body:', body)
except HTTPError as e:
    print('HTTPError:', e.code, e.reason)
    try:
        body = e.read().decode('utf-8')
        print('Error body:', body)
    except Exception:
        pass
except URLError as e:
    print('URLError:', e)
except Exception as e:
    print('Request exception:', e)

# Now check DB counts
from users.models import AlumniSurvey, EmploymentRecord, SelfEmployment
print('Counts:', AlumniSurvey.objects.count(), EmploymentRecord.objects.count(), SelfEmployment.objects.count())
# Print last survey
last = AlumniSurvey.objects.order_by('-created_at').first()
if last:
    print('Last survey id:', last.id, 'name:', last.last_name, last.first_name)
else:
    print('No survey found')
