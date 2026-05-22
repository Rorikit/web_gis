from django.contrib import admin

from .models import District, UserProfile


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('id', 'name')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'district')
    list_filter = ('role', 'district')
    search_fields = ('user__username', 'full_name')
