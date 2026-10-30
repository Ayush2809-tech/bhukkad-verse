import os
from rest_framework import serializers
from .models import Shop, ShopOperatingHour, ShopMenuCard, ShopReview
from .utils import get_shop_live_status


class ShopMenuCardPublicSerializer(serializers.ModelSerializer):
    """
    Public representation of an active original menu card.
    Excludes internal storage paths and uploader information.
    """
    file_url = serializers.CharField(read_only=True)

    class Meta:
        model = ShopMenuCard
        fields = (
            'id',
            'title',
            'file_url',
            'file_type',
            'file_size_bytes',
            'version',
            'updated_at',
        )


class ShopMenuCardVendorSerializer(serializers.ModelSerializer):
    """
    Vendor-facing serializer for listing, viewing, and managing uploaded menu cards.
    """
    file_url = serializers.CharField(read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)

    class Meta:
        model = ShopMenuCard
        fields = (
            'id',
            'title',
            'original_filename',
            'file_url',
            'file_type',
            'file_size_bytes',
            'version',
            'is_active',
            'uploaded_by_username',
            'created_at',
            'updated_at',
        )


class ShopMenuCardUploadSerializer(serializers.ModelSerializer):
    """
    Serializer for uploading a new original menu card with strict binary and integrity validation.
    """
    file = serializers.FileField(write_only=True, required=True)
    title = serializers.CharField(required=False, allow_blank=True, default="", max_length=150)
    is_active = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = ShopMenuCard
        fields = (
            'file',
            'title',
            'is_active',
        )

    def validate_file(self, value):
        from .validators import validate_menu_card_file
        self._validated_file_meta = validate_menu_card_file(value)
        return value

    def create(self, validated_data):
        shop = self.context['shop']
        user = self.context['request'].user
        meta = self._validated_file_meta

        title = validated_data.get('title', '').strip()
        if not title:
            title = os.path.splitext(meta['original_filename'])[0]

        menu_card = ShopMenuCard.objects.create(
            shop=shop,
            file=validated_data['file'],
            original_filename=meta['original_filename'],
            file_type=meta['file_type'],
            file_size_bytes=meta['file_size_bytes'],
            title=title,
            is_active=validated_data.get('is_active', True),
            uploaded_by=user,
        )
        return menu_card

class ShopOperatingHourSerializer(serializers.ModelSerializer):
    """
    Serializer for weekly operating hours with validation for open/closed and time boundaries.
    """
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)
    weekday_name = serializers.CharField(source='get_weekday_display', read_only=True)
    is_overnight = serializers.BooleanField(read_only=True)

    class Meta:
        model = ShopOperatingHour
        fields = (
            'id',
            'weekday',
            'weekday_display',
            'weekday_name',
            'is_closed',
            'opening_time',
            'closing_time',
            'is_overnight',
        )

    def validate(self, attrs):
        is_closed = attrs.get('is_closed', getattr(self.instance, 'is_closed', False))
        opening_time = attrs.get('opening_time', getattr(self.instance, 'opening_time', None))
        closing_time = attrs.get('closing_time', getattr(self.instance, 'closing_time', None))

        if not is_closed:
            if opening_time is None or closing_time is None:
                raise serializers.ValidationError(
                    "Both opening time and closing time must be provided when the shop is not closed."
                )
            if opening_time == closing_time:
                raise serializers.ValidationError(
                    "Opening time and closing time cannot be identical."
                )
        return attrs


class ShopPauseToggleSerializer(serializers.Serializer):
    """
    Serializer for vendors temporarily pausing or resuming live order intake.
    """
    is_accepting_orders = serializers.BooleanField(required=True)
    order_pause_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=255,
        help_text="Optional reason for kitchen order pause (e.g. rush hour, ingredients restocking)."
    )
    pause_reason = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        max_length=255,
        help_text="Alias for order_pause_reason."
    )


class ShopPublicSerializer(serializers.ModelSerializer):
    """
    Public representation of approved shops visible to customers and search engines.
    Excludes sensitive financial commissions and internal admin review notes.
    Supports location-aware distance, deliverability calculation, live status, and operating schedule.
    """
    distance_km = serializers.SerializerMethodField()
    is_deliverable = serializers.SerializerMethodField()
    live_status = serializers.SerializerMethodField()
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    operating_hours = ShopOperatingHourSerializer(many=True, read_only=True)
    active_menu_card = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            'id',
            'name',
            'slug',
            'tier',
            'tier_display',
            'description',
            'logo',
            'banner',
            'phone',
            'address_line',
            'city',
            'postal_code',
            'latitude',
            'longitude',
            'timezone',
            'opening_time',
            'closing_time',
            'delivery_radius_km',
            'minimum_order_value',
            'is_accepting_orders',
            'distance_km',
            'is_deliverable',
            'live_status',
            'operating_hours',
            'active_menu_card',
            'created_at',
        )
        read_only_fields = fields

    def get_distance_km(self, obj):
        if hasattr(obj, 'annotated_distance_km'):
            return obj.annotated_distance_km
        return None

    def get_is_deliverable(self, obj):
        if hasattr(obj, 'annotated_is_deliverable'):
            return obj.annotated_is_deliverable
        return None

    def get_live_status(self, obj):
        return get_shop_live_status(obj)

    def get_active_menu_card(self, obj):
        card = obj.active_menu_card
        if card:
            return ShopMenuCardPublicSerializer(card).data
        return None


class ShopVendorSerializer(serializers.ModelSerializer):
    """
    Vendor representation of their own shop profile and application status.
    Guarantees that vendors cannot change their own approval status or commission rate.
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    live_status = serializers.SerializerMethodField()
    operating_hours = ShopOperatingHourSerializer(many=True, read_only=True)
    active_menu_card = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = (
            'id',
            'name',
            'slug',
            'tier',
            'tier_display',
            'description',
            'logo',
            'banner',
            'phone',
            'email',
            'address_line',
            'city',
            'postal_code',
            'latitude',
            'longitude',
            'timezone',
            'opening_time',
            'closing_time',
            'delivery_radius_km',
            'minimum_order_value',
            'commission_rate_percentage',
            'status',
            'status_display',
            'admin_review_notes',
            'is_accepting_orders',
            'order_pause_reason',
            'order_paused_at',
            'is_active',
            'owner_username',
            'live_status',
            'operating_hours',
            'active_menu_card',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'slug',
            'status',
            'status_display',
            'tier_display',
            'commission_rate_percentage',
            'admin_review_notes',
            'owner_username',
            'live_status',
            'operating_hours',
            'active_menu_card',
            'order_paused_at',
            'created_at',
            'updated_at',
        )

    def get_live_status(self, obj):
        return get_shop_live_status(obj)

    def get_active_menu_card(self, obj):
        card = obj.active_menu_card
        if card:
            return ShopMenuCardVendorSerializer(card).data
        return None


class ShopApplySerializer(serializers.ModelSerializer):
    """
    Application serializer for onboarding vendors submitting their kitchen for review.
    """
    class Meta:
        model = Shop
        fields = (
            'name',
            'tier',
            'description',
            'phone',
            'email',
            'address_line',
            'city',
            'postal_code',
            'opening_time',
            'closing_time',
            'delivery_radius_km',
            'minimum_order_value',
        )

    def create(self, validated_data):
        user = self.context['request'].user
        if hasattr(user, 'shop'):
            raise serializers.ValidationError("You have already submitted a shop application.")
        return Shop.objects.create(
            owner=user,
            status=Shop.Status.PENDING,
            **validated_data
        )


class ShopAdminReviewSerializer(serializers.Serializer):
    """
    Serializer for platform admins approving or rejecting vendor shop applications.
    """
    admin_review_notes = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Feedback or instructions from the administrator."
    )


class ShopReviewSerializer(serializers.ModelSerializer):
    """
    Customer review for a specific shop and its dishes.
    """
    shop_name = serializers.CharField(source='shop.name', read_only=True)

    class Meta:
        model = ShopReview
        fields = (
            'id',
            'shop',
            'shop_name',
            'product_name',
            'customer_name',
            'rating',
            'comment',
            'is_approved',
            'created_at',
        )
        read_only_fields = ('id', 'is_approved', 'created_at')

