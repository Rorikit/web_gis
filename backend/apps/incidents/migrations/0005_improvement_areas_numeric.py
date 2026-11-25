from django.db import migrations, models

IMPROVEMENT_FIELDS = [
    'improvement_main',
    'improvement_inner_road',
    'improvement_sidewalk',
    'improvement_blind_area',
]


def booleans_to_areas(apps, schema_editor):
    Damage = apps.get_model('incidents', 'Damage')
    for item in Damage.objects.all():
        for field in IMPROVEMENT_FIELDS:
            setattr(item, f'{field}_area', 1 if getattr(item, field) else 0)
        item.save(update_fields=[f'{field}_area' for field in IMPROVEMENT_FIELDS])


def areas_to_booleans(apps, schema_editor):
    Damage = apps.get_model('incidents', 'Damage')
    for item in Damage.objects.all():
        for field in IMPROVEMENT_FIELDS:
            setattr(item, field, bool(getattr(item, f'{field}_area')))
        item.save(update_fields=IMPROVEMENT_FIELDS)


class Migration(migrations.Migration):

    dependencies = [
        ('incidents', '0004_remove_damage_contractor_name'),
    ]

    operations = [
        *[
            migrations.AddField(
                model_name='damage',
                name=f'{field}_area',
                field=models.IntegerField(default=0),
            )
            for field in IMPROVEMENT_FIELDS
        ],
        migrations.RunPython(booleans_to_areas, areas_to_booleans),
        *[
            migrations.RemoveField(model_name='damage', name=field)
            for field in IMPROVEMENT_FIELDS
        ],
        *[
            migrations.RenameField(
                model_name='damage',
                old_name=f'{field}_area',
                new_name=field,
            )
            for field in IMPROVEMENT_FIELDS
        ],
        migrations.RemoveField(model_name='damage', name='asphalt_area'),
        migrations.AlterField(
            model_name='damage',
            name='contractor_type',
            field=models.CharField(blank=True, default='', max_length=512),
        ),
    ]
