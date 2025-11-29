from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_create_users_programhead_table'),
        ('users', '0012_remove_selfemployment_business_address_and_more'),
    ]

    operations = [
        # This is an empty merge migration to resolve two 0012 leaf nodes
    ]
