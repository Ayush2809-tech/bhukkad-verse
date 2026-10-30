from django.contrib import admin
from .models import Category, Product, ProductVariant, AddonGroup, AddonItem

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

class AddonItemInline(admin.TabularInline):
    model = AddonItem
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'display_order', 'is_active', 'created_at')
    list_filter = ('is_active', 'shop')
    search_fields = ('name', 'description', 'shop__name')
    readonly_fields = ('slug', 'created_at', 'updated_at')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'shop',
        'category',
        'base_price',
        'dietary_type',
        'has_variants',
        'has_3d_model',
        'is_available',
        'is_active',
    )
    list_filter = ('dietary_type', 'is_available', 'is_active', 'has_variants', 'has_3d_model', 'shop')
    search_fields = ('name', 'description', 'shop__name', 'category__name')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    filter_horizontal = ('addon_groups',)
    inlines = [ProductVariantInline]

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('name', 'product', 'price', 'is_default', 'is_available', 'display_order')
    list_filter = ('is_default', 'is_available')
    search_fields = ('name', 'product__name')

@admin.register(AddonGroup)
class AddonGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'min_selections', 'max_selections', 'is_required', 'is_active')
    list_filter = ('is_required', 'is_active', 'shop')
    search_fields = ('name', 'shop__name')
    inlines = [AddonItemInline]

@admin.register(AddonItem)
class AddonItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'group', 'price', 'is_available', 'display_order')
    list_filter = ('is_available',)
    search_fields = ('name', 'group__name')
