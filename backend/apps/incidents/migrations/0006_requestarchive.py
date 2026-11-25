from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

import apps.incidents.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('accounts', '0003_update_districts'),
        ('incidents', '0005_improvement_areas_numeric'),
    ]

    operations = [
        migrations.CreateModel(
            name='RequestArchive',
            fields=[
                ('id', models.CharField(default=apps.incidents.models.generate_audit_id, editable=False, max_length=64, primary_key=True, serialize=False)),
                ('request_date', models.DateField()),
                ('contractor', models.CharField(blank=True, default='', max_length=512)),
                ('addresses', models.TextField(blank=True, default='')),
                ('file', models.FileField(blank=True, upload_to='request_archives/%Y/%m/')),
                ('file_name', models.CharField(blank=True, default='', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='request_archives', to=settings.AUTH_USER_MODEL)),
                ('district', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='request_archives', to='accounts.district')),
            ],
            options={
                'ordering': ['-request_date', '-created_at'],
            },
        ),
    ]
