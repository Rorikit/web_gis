from django.contrib import admin

from .models import AuditEvent, Damage, GisPoint, Photo


@admin.register(Damage)
class DamageAdmin(admin.ModelAdmin):
    list_display = ('id', 'district', 'address', 'order_number', 'area_state', 'archived')
    list_filter = ('district', 'network_type', 'damage_type', 'order_kind', 'area_state', 'archived')
    search_fields = ('id', 'address', 'order_number')


@admin.register(GisPoint)
class GisPointAdmin(admin.ModelAdmin):
    list_display = ('id', 'damage', 'latitude', 'longitude', 'gis_object_id')
    search_fields = ('id', 'damage__id', 'damage__address', 'gis_object_id')


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('id', 'damage', 'file_name', 'uploaded_at')
    search_fields = ('id', 'damage__id', 'file_name')


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'entity_type', 'entity_id', 'field_name', 'user_name', 'created_at')
    list_filter = ('entity_type', 'field_name')
    search_fields = ('id', 'entity_id', 'user_name', 'field_name')
