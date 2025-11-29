from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_remove_admin_consent'),
    ]

    operations = [
        migrations.AddField(
            model_name='alumni',
            name='verification_image',
            field=models.ImageField(blank=True, null=True, upload_to='alumni_verification/'),
        ),
        migrations.AddField(
            model_name='alumni',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
    ]
