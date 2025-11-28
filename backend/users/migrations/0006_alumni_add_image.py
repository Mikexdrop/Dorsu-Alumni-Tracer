# Generated migration to add image field to Alumni
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_add_programhead_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='alumni',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='alumni_images/'),
        ),
    ]
