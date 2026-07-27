from django.db import migrations

DISTRICTS = [
    ('sovetsky', 'Советский район'),
    ('moskovsky', 'Московский район'),
    ('oktyabrsky', 'Октябрьский район'),
    ('zheleznodorozhny', 'Железнодорожный район'),
    ('solotcha', 'Солотча'),
]


def seed_districts(apps, schema_editor):
    District = apps.get_model('accounts', 'District')
    for district_id, name in DISTRICTS:
        District.objects.update_or_create(id=district_id, defaults={'name': name})


def remove_districts(apps, schema_editor):
    District = apps.get_model('accounts', 'District')
    District.objects.filter(id__in=[district_id for district_id, _ in DISTRICTS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_districts, remove_districts),
    ]
