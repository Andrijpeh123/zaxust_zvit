# Generated by Django 5.0.4 on 2025-03-23 11:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0005_userprofile_unique_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='qr_code',
            field=models.ImageField(blank=True, null=True, upload_to='qr_codes/'),
        ),
    ]
