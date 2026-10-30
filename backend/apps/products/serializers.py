from rest_framework import serializers
from .models import Category, Product, ProductVariant, AddonGroup, AddonItem

# =============================================================
# 1. PUBLIC STOREFRONT SERIALIZERS
# =============================================================

class AddonItemPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddonItem
        fields = ('id', 'name', 'price', 'is_available')


class AddonGroupPublicSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = AddonGroup
        fields = (
            'id',
            'name',
            'min_selections',
            'max_selections',
            'is_required',
            'items',
        )

    def get_items(self, obj):
        # Only return items for active groups
        active_items = obj.items.filter(is_available=True)
        return AddonItemPublicSerializer(active_items, many=True).data


class ProductVariantPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            'id',
            'name',
            'price',
            'is_default',
            'is_available',
        )


class ProductPublicSerializer(serializers.ModelSerializer):
    variants = serializers.SerializerMethodField()
    addon_groups = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'base_price',
            'compare_at_price',
            'image',
            'image_url',
            'dietary_type',
            'preparation_time_minutes',
            'is_available',
            'has_variants',
            'has_3d_model',
            'model_3d_url',
            'category_name',
            'category_slug',
            'variants',
            'addon_groups',
        )

    def get_variants(self, obj):
        active_variants = obj.variants.filter(is_available=True)
        return ProductVariantPublicSerializer(active_variants, many=True).data

    def get_addon_groups(self, obj):
        active_groups = obj.addon_groups.filter(is_active=True)
        return AddonGroupPublicSerializer(active_groups, many=True).data


class ProductSearchResultSerializer(serializers.ModelSerializer):
    """
    Public dish/product search result representation.
    Enriches the product with its owning kitchen details, live status, and proximity.
    """
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    shop_id = serializers.UUIDField(source='shop.id', read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_slug = serializers.CharField(source='shop.slug', read_only=True)
    shop_city = serializers.CharField(source='shop.city', read_only=True)
    shop_address = serializers.CharField(source='shop.address_line', read_only=True)
    shop_logo = serializers.SerializerMethodField()
    is_shop_accepting_orders = serializers.BooleanField(source='shop.is_accepting_orders', read_only=True)
    distance_km = serializers.SerializerMethodField()
    is_deliverable = serializers.SerializerMethodField()
    variants = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'base_price',
            'compare_at_price',
            'image',
            'image_url',
            'dietary_type',
            'preparation_time_minutes',
            'is_available',
            'has_variants',
            'category_name',
            'category_slug',
            'variants',
            'shop_id',
            'shop_name',
            'shop_slug',
            'shop_city',
            'shop_address',
            'shop_logo',
            'is_shop_accepting_orders',
            'distance_km',
            'is_deliverable',
        )

    def get_shop_logo(self, obj):
        if obj.shop and obj.shop.logo:
            try:
                return obj.shop.logo.url
            except Exception:
                return None
        return None

    def get_distance_km(self, obj):
        return getattr(obj, 'annotated_distance_km', None)

    def get_is_deliverable(self, obj):
        return getattr(obj, 'annotated_is_deliverable', None)

    def get_variants(self, obj):
        active_variants = obj.variants.filter(is_available=True)
        return ProductVariantPublicSerializer(active_variants, many=True).data


class CategoryPublicSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'display_order',
            'products',
        )

    def get_products(self, obj):
        # Only show active products for this category
        active_products = obj.products.filter(is_active=True)
        return ProductPublicSerializer(active_products, many=True).data


# =============================================================
# 2. VENDOR CATALOG MANAGEMENT SERIALIZERS
# =============================================================

class CategoryVendorSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'display_order',
            'is_active',
            'product_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'slug', 'created_at', 'updated_at', 'product_count')


class AddonItemVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddonItem
        fields = (
            'id',
            'group',
            'name',
            'price',
            'is_available',
            'display_order',
            'created_at',
        )
        read_only_fields = ('id', 'group', 'created_at')


class AddonGroupVendorSerializer(serializers.ModelSerializer):
    items = AddonItemVendorSerializer(many=True, read_only=True)

    class Meta:
        model = AddonGroup
        fields = (
            'id',
            'name',
            'min_selections',
            'max_selections',
            'is_required',
            'display_order',
            'is_active',
            'items',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'items')

    def validate(self, attrs):
        min_sel = attrs.get('min_selections', getattr(self.instance, 'min_selections', 0))
        max_sel = attrs.get('max_selections', getattr(self.instance, 'max_selections', 1))
        if min_sel > max_sel:
            raise serializers.ValidationError({
                "min_selections": "Minimum selections cannot exceed maximum selections."
            })
        return attrs


class ProductVariantVendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = (
            'id',
            'product',
            'name',
            'price',
            'is_default',
            'is_available',
            'display_order',
            'created_at',
        )
        read_only_fields = ('id', 'product', 'created_at')

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Variant price cannot be negative.")
        return value


class ProductVendorSerializer(serializers.ModelSerializer):
    variants = ProductVariantVendorSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = (
            'id',
            'category',
            'category_name',
            'name',
            'slug',
            'description',
            'base_price',
            'compare_at_price',
            'image',
            'image_url',
            'dietary_type',
            'preparation_time_minutes',
            'is_available',
            'is_active',
            'display_order',
            'has_variants',
            'has_3d_model',
            'model_3d_url',
            'addon_groups',
            'variants',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'slug', 'category_name', 'variants', 'created_at', 'updated_at')

    def validate_category(self, value):
        # Enforce that category belongs to the authenticated vendor's shop
        request = self.context.get('request')
        if request and hasattr(request.user, 'shop'):
            if value.shop_id != request.user.shop.id:
                raise serializers.ValidationError("This category does not belong to your shop.")
        return value

    def validate_base_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Base price cannot be negative.")
        return value

    def validate_addon_groups(self, value):
        request = self.context.get('request')
        if request and hasattr(request.user, 'shop'):
            vendor_shop_id = request.user.shop.id
            for group in value:
                if group.shop_id != vendor_shop_id:
                    raise serializers.ValidationError(
                        f"Add-on group '{group.name}' does not belong to your shop."
                    )
        return value
