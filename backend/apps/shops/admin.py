from django.contrib import admin
from .models import Shop, ShopOperatingHour, ShopMenuCard

class ShopOperatingHourInline(admin.TabularInline):
    model = ShopOperatingHour
    extra = 0
    fields = ('weekday', 'is_closed', 'opening_time', 'closing_time')
    ordering = ('weekday',)

class ShopMenuCardInline(admin.TabularInline):
    model = ShopMenuCard
    extra = 0
    fields = ('version', 'title', 'file_type', 'file_size_bytes', 'is_active', 'created_at')
    readonly_fields = ('version', 'file_type', 'file_size_bytes', 'created_at')
    ordering = ('-version',)

@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'owner',
        'city',
        'status',
        'is_accepting_orders',
        'is_active',
        'created_at',
    )
    list_filter = ('status', 'city', 'is_accepting_orders', 'is_active')
    search_fields = ('name', 'description', 'owner__username', 'owner__email', 'city', 'address_line')
    readonly_fields = ('created_at', 'updated_at', 'slug', 'order_paused_at')
    inlines = [ShopOperatingHourInline, ShopMenuCardInline]
    fieldsets = (
        ('Shop Identity', {
            'fields': ('name', 'slug', 'owner', 'description', 'logo', 'banner'),
        }),
        ('Location & Contact', {
            'fields': ('phone', 'email', 'address_line', 'city', 'postal_code', 'latitude', 'longitude', 'timezone'),
        }),
        ('Operations & Hours', {
            'fields': (
                'opening_time',
                'closing_time',
                'delivery_radius_km',
                'minimum_order_value',
                'commission_rate_percentage',
                'is_accepting_orders',
                'order_pause_reason',
                'order_paused_at',
                'is_active',
            ),
        }),
        ('Approval & Review', {
            'fields': ('status', 'admin_review_notes'),
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at'),
        }),
    )

@admin.register(ShopOperatingHour)
class ShopOperatingHourAdmin(admin.ModelAdmin):
    list_display = ('shop', 'weekday', 'is_closed', 'opening_time', 'closing_time', 'is_overnight')
    list_filter = ('weekday', 'is_closed')
    search_fields = ('shop__name',)

@admin.register(ShopMenuCard)
class ShopMenuCardAdmin(admin.ModelAdmin):
    list_display = ('shop', 'version', 'title', 'file_type', 'file_size_bytes', 'is_active', 'created_at')
    list_filter = ('file_type', 'is_active')
    search_fields = ('shop__name', 'title', 'original_filename')
    readonly_fields = ('created_at', 'updated_at', 'version', 'file_size_bytes', 'file_type')
