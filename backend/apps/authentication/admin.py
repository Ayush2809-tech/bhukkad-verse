from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'first_name', 'last_name', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active', 'is_email_verified')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('BHUKKAD VERSE Profile', {
            'fields': ('role', 'phone', 'is_email_verified', 'avatar', 'bio'),
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('BHUKKAD VERSE Profile', {
            'fields': ('role', 'phone', 'email'),
        }),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)
