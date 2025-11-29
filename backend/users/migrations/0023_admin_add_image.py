from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0022_programhead_image_alter_selfemployment_survey'),
    ]

    operations = [
        migrations.AddField(
            model_name='admin',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='admin_images/'),
        ),
    ]
