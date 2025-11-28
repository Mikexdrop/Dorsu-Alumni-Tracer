import os
import sys

# Ensure we're running from project base
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

os.chdir(BASE_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'alumni_backend.settings')
import django
django.setup()

from django.db import connection
from django.db import OperationalError

print('DATABASE ENGINE:', connection.settings_dict.get('ENGINE'))
print('DATABASE NAME:', connection.settings_dict.get('NAME'))

print('\nListing tables (first 200 chars):')
try:
    tables = connection.introspection.table_names()
    print(tables[:200])
except OperationalError as e:
    print('OperationalError listing tables:', e)

try:
    from users.models import ProgramHead
    print('\nProgramHead model db_table:', ProgramHead._meta.db_table)
    tb = ProgramHead._meta.db_table
    exists = tb in connection.introspection.table_names()
    print('Table exists according to Django introspection:', exists)
except Exception as e:
    print('Error importing ProgramHead:', e)

# Raw check via simple SELECT (safe check)
try:
    with connection.cursor() as cursor:
        cursor.execute("SHOW TABLES")
        all_tables = [row[0] for row in cursor.fetchall()]
        print('\nTables from SHOW TABLES (first 200 chars):')
        print(all_tables[:200])
        print('\nusers_programhead in tables?:', 'users_programhead' in all_tables)
except Exception as e:
    print('Raw SHOW TABLES failed:', e)

print('\nDone')
