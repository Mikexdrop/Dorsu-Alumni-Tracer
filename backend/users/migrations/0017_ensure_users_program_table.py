from django.db import migrations


class Migration(migrations.Migration):
	"""No-op migration placeholder.

	This migration file was empty which caused Django to raise
	BadMigrationError: 'has no Migration class'. Replace with this
	minimal no-op migration so migration loading succeeds. If you
	intended a real operation here (create/ensure table), convert
	this into a proper migration that modifies the database.
	"""

	dependencies = [
		('users', '0016_remove_program_business_address_and_more'),
	]

	operations = []
