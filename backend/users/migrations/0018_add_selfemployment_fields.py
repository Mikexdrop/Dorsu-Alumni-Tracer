from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0017_ensure_users_program_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='selfemployment',
            name='business_name',
            field=models.CharField(default='', max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name='selfemployment',
            name='nature_of_business',
            field=models.CharField(default='', max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name='selfemployment',
            name='role_in_business',
            field=models.CharField(default='', max_length=255, blank=True),
        ),
        migrations.AddField(
            model_name='selfemployment',
            name='monthly_profit',
            field=models.CharField(default='', max_length=64, blank=True),
        ),
        migrations.AddField(
            model_name='selfemployment',
            name='business_address',
            field=models.TextField(default='', blank=True),
        ),
        migrations.AddField(
            model_name='selfemployment',
            name='business_phone',
            field=models.CharField(default='', max_length=50, blank=True),
        ),
    ]
