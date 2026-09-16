from django.db import migrations

NEW_DISTRICTS = [
    ('district_1', '1-й район'),
    ('district_2', '2-й район'),
]
REMOVED_DISTRICTS = [
    ('solotcha', 'Солотча'),
]


def update_districts(apps, schema_editor):
    District = apps.get_model('accounts', 'District')
    Damage = apps.get_model('incidents', 'Damage')

    for district_id, name in NEW_DISTRICTS:
        District.objects.update_or_create(id=district_id, defaults={'name': name})

    # Район удаляем только если на него не ссылаются повреждения (FK с PROTECT);
    # пользователи этого района остаются без района (FK с SET_NULL).
    for district_id, _ in REMOVED_DISTRICTS:
        if not Damage.objects.filter(district_id=district_id).exists():
            District.objects.filter(id=district_id).delete()


def restore_districts(apps, schema_editor):
    District = apps.get_model('accounts', 'District')
    Damage = apps.get_model('incidents', 'Damage')

    for district_id, name in REMOVED_DISTRICTS:
        District.objects.update_or_create(id=district_id, defaults={'name': name})

    for district_id, _ in NEW_DISTRICTS:
        if not Damage.objects.filter(district_id=district_id).exists():
            District.objects.filter(id=district_id).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0002_seed_districts'),
        ('incidents', '0004_remove_damage_contractor_name'),
    ]

    operations = [
        migrations.RunPython(update_districts, restore_districts),
    ]
