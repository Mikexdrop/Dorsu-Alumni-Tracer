from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0004_admin_consent'),
    ]

    operations = [
        migrations.AddField(
            model_name='programhead',
            name='status',
            field=models.CharField(default='pending', max_length=20),
        ),
    ]
