from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_add_alumni_program_course'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS `users_programhead` (
                `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `username` varchar(150) NOT NULL UNIQUE,
                `name` varchar(255) NOT NULL,
                `surname` varchar(255) NOT NULL,
                `mi` varchar(1) DEFAULT NULL,
                `gender` varchar(10) NOT NULL,
                `contact` varchar(20) NOT NULL,
                `email` varchar(254) NOT NULL UNIQUE,
                `faculty` varchar(100) NOT NULL,
                `program` varchar(100) NOT NULL,
                `status` varchar(20) NOT NULL DEFAULT 'pending',
                `password` varchar(128) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """,
            reverse_sql="DROP TABLE IF EXISTS `users_programhead`;",
        ),
    ]
