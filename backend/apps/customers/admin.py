from django.contrib import admin
from .models import CustomerAddress

@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ('recipient_name', 'user', 'label', 'city', 'latitude', 'longitude', 'is_default', 'is_active', 'created_at')
    list_filter = ('label', 'is_default', 'is_active', 'city')
    search_fields = ('recipient_name', 'recipient_phone', 'address_line1', 'city', 'user__username')
