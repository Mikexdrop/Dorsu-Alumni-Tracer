import os
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_backend.settings')
import django
django.setup()

from users.serializers import AlumniSurveySerializer

payload = {
    'last_name': 'X',
    'first_name': 'Y',
    'email': 'x@y.com',
    'age': 30,
    'job_difficulties': [],
    # employment_records omitted to mirror the frontend logic when empty
    # serializer expects a list of self_employment records
    'self_employment': [
        {
            'business_name': '',
            'nature_of_business': '',
            'role_in_business': '',
            'monthly_profit': '',
            'business_address': '',
            'business_phone': ''
        }
    ]
}

print('Testing serializer with payload:')
print(payload)

try:
    serializer = AlumniSurveySerializer(data=payload)
    if serializer.is_valid():
        obj = serializer.save()
        print('Created survey id:', obj.id)
    else:
        print('Serializer is not valid. Errors:')
        print(serializer.errors)
except Exception:
    print('Exception during serializer save:')
    traceback.print_exc()
