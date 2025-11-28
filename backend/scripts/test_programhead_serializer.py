from django import setup
import os, sys
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_backend.settings')
setup()

from users.serializers import ProgramHeadSerializer

payload = {
    'username': 'ph_test_2',
    'name': 'Test',
    'surname': 'ProgramHead',
    'mi': 'A',
    'gender': 'male',
    'contact': '09123456789',
    'email': 'ph_test2@example.com',
    'faculty': 'FALS',
    'program': 'Bachelor of Science in Agriculture (BSA)',
    'password': 'TestPass123!'
}

s = ProgramHeadSerializer(data=payload)
print('is_valid:', s.is_valid())
print('errors:', s.errors)

if s.is_valid():
    instance = s.save()
    print('Saved ProgramHead id:', instance.id)
else:
    print('Did not save')
