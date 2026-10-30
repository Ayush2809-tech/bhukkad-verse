from rest_framework import serializers
from .models import PlatformSettings, ShowcaseVideo, PlatformReview, Coupon

class PlatformSettingsSerializer(serializers.ModelSerializer):
    effective_curtain_video_url = serializers.SerializerMethodField()
    effective_logo_url = serializers.SerializerMethodField()
    effective_hero_mascot_image_url = serializers.SerializerMethodField()

    class Meta:
        model = PlatformSettings
        fields = (
            'id',
            'curtain_enabled',
            'curtain_video_url',
            'curtain_video_file',
            'effective_curtain_video_url',
            'curtain_badge',
            'curtain_headline',
            'curtain_tagline',
            'curtain_quote',
            'custom_logo_url',
            'custom_logo_file',
            'effective_logo_url',
            'hero_headline_primary',
            'hero_headline_highlight',
            'hero_subtitle',
            'hero_badge_left',
            'hero_badge_right',
            'hero_mascot_badge_1',
            'hero_mascot_badge_2',
            'hero_mascot_badge_bottom',
            'hero_mascot_image_file',
            'hero_mascot_image_url',
            'effective_hero_mascot_image_url',
            'about_hero_title',
            'about_hero_subtitle',
            'about_street_title',
            'about_street_desc',
            'about_luxury_title',
            'about_luxury_desc',
            'about_kitchens_title',
            'about_kitchens_desc',
            'about_developer_title',
            'about_developer_desc',
            'support_phone',
            'support_email',
            'support_whatsapp',
            'support_hours',
            'emergency_notice',
            'updated_at',
        )
        read_only_fields = ('id', 'updated_at')

    def get_effective_curtain_video_url(self, obj):
        if obj.curtain_video_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.curtain_video_file.url)
            return obj.curtain_video_file.url
        return obj.curtain_video_url or ''

    def get_effective_logo_url(self, obj):
        if obj.custom_logo_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.custom_logo_file.url)
            return obj.custom_logo_file.url
        if obj.custom_logo_url:
            return obj.custom_logo_url
        return "/brand/logo-primary.png"

    def get_effective_hero_mascot_image_url(self, obj):
        if obj.hero_mascot_image_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.hero_mascot_image_file.url)
            return obj.hero_mascot_image_file.url
        if obj.hero_mascot_image_url:
            return obj.hero_mascot_image_url
        return "/brand/mascot-hero.jpg"


class PlatformReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformReview
        fields = (
            'id',
            'author_name',
            'author_role',
            'city',
            'rating',
            'headline',
            'comment',
            'is_featured',
            'is_approved',
            'created_at',
        )
        read_only_fields = ('id', 'created_at')


class CouponSerializer(serializers.ModelSerializer):
    discount_type_display = serializers.CharField(source='get_discount_type_display', read_only=True)

    class Meta:
        model = Coupon
        fields = (
            'id',
            'code',
            'description',
            'discount_type',
            'discount_type_display',
            'discount_value',
            'min_order_value',
            'max_discount_amount',
            'is_active',
            'usage_count',
            'created_at',
        )
        read_only_fields = ('id', 'usage_count', 'created_at')



class ShowcaseVideoPublicSerializer(serializers.ModelSerializer):
    shop_id = serializers.SerializerMethodField()
    shop_name = serializers.SerializerMethodField()
    shop_slug = serializers.SerializerMethodField()
    shop_logo = serializers.SerializerMethodField()
    product_id = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    product_image = serializers.SerializerMethodField()
    effective_video_url = serializers.SerializerMethodField()

    class Meta:
        model = ShowcaseVideo
        fields = (
            'id',
            'title',
            'caption',
            'video_url',
            'video_file',
            'effective_video_url',
            'thumbnail_url',
            'shop_id',
            'shop_name',
            'shop_slug',
            'shop_logo',
            'product_id',
            'product_name',
            'product_price',
            'product_image',
            'is_featured',
            'views_count',
            'created_at',
        )

    def get_shop_id(self, obj):
        return str(obj.shop.id) if obj.shop else None

    def get_shop_name(self, obj):
        return obj.shop.name if obj.shop else None

    def get_shop_slug(self, obj):
        return obj.shop.slug if obj.shop else None

    def get_shop_logo(self, obj):
        if obj.shop and getattr(obj.shop, 'logo', None):
            try:
                return obj.shop.logo.url
            except ValueError:
                return ''
        return ''

    def get_product_id(self, obj):
        return str(obj.product.id) if obj.product else None

    def get_product_name(self, obj):
        return obj.product.name if obj.product else None

    def get_product_price(self, obj):
        return str(obj.product.base_price) if obj.product else None

    def get_product_image(self, obj):
        if obj.product:
            if getattr(obj.product, 'image', None):
                try:
                    return obj.product.image.url
                except ValueError:
                    pass
            return obj.product.image_url or ''
        return ''

    def get_effective_video_url(self, obj):
        if obj.video_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        return obj.video_url or ''


class ShowcaseVideoManageSerializer(serializers.ModelSerializer):
    effective_video_url = serializers.SerializerMethodField()
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = ShowcaseVideo
        fields = (
            'id',
            'shop',
            'shop_name',
            'product',
            'product_name',
            'title',
            'caption',
            'video_url',
            'video_file',
            'effective_video_url',
            'thumbnail_url',
            'is_featured',
            'is_active',
            'display_order',
            'views_count',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'views_count')

    def get_effective_video_url(self, obj):
        if obj.video_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        return obj.video_url or ''
