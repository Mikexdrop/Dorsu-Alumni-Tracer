from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0025_surveychangerequest'),
    ]

    operations = [
        # Use raw SQL DROP TABLE IF EXISTS so the migration is idempotent
        # and won't fail when the legacy table is already absent.
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS users_selfemployment;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
