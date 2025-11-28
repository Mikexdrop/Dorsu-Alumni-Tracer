from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0010_alumnisurvey_employmentrecord_selfemployment'),
    ]

    operations = [
        migrations.AddField(
            model_name='alumni',
            name='program_course',
            field=models.CharField(max_length=255, blank=True),
        ),
    ]
