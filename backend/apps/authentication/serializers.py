import uuid
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import AdminAuditLog

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Public and internal profile representation of the User.
    Enriched with shop onboarding and moderation status for vendors.
    """
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    has_shop = serializers.SerializerMethodField()
    shop_status = serializers.SerializerMethodField()
    shop_slug = serializers.SerializerMethodField()
    shop_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'role_display',
            'phone',
            'is_email_verified',
            'is_active',
            'bio',
            'date_joined',
            'has_shop',
            'shop_status',
            'shop_slug',
            'shop_id',
        )
        read_only_fields = (
            'id',
            'role',
            'role_display',
            'is_email_verified',
            'is_active',
            'date_joined',
            'has_shop',
            'shop_status',
            'shop_slug',
            'shop_id',
        )

    def get_has_shop(self, obj) -> bool:
        return bool(obj.is_vendor and hasattr(obj, 'shop'))

    def get_shop_status(self, obj):
        if obj.is_vendor and hasattr(obj, 'shop'):
            return obj.shop.status
        return None

    def get_shop_slug(self, obj):
        if obj.is_vendor and hasattr(obj, 'shop'):
            return obj.shop.slug
        return None

    def get_shop_id(self, obj):
        if obj.is_vendor and hasattr(obj, 'shop'):
            return str(obj.shop.id)
        return None


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for public customer and basic vendor registration.
    Enforces password hashing, email uniqueness, and prevents privilege escalation.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'phone',
            'role',
        )

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate_username(self, value):
        cleaned = value.strip()
        if User.objects.filter(username__iexact=cleaned).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return cleaned

    def validate_role(self, value):
        allowed_roles = [User.Role.CUSTOMER, User.Role.VENDOR]
        if value not in allowed_roles:
            raise serializers.ValidationError(
                f"Invalid role. Public registration only permits: {', '.join(allowed_roles)}."
            )
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class VendorRegistrationSerializer(serializers.Serializer):
    """
    Unified Atomic Vendor Registration Serializer.
    Creates BOTH the Vendor User account and the associated Shop in a single
    atomic database transaction. Prevents partial failures, orphaned vendor accounts,
    and duplicate-email lockouts on retried submissions.
    """
    # Vendor Account Fields
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')

    # Shop Profile Fields
    shop_name = serializers.CharField(max_length=150)
    shop_tier = serializers.CharField(required=False, default='FRESH_KITCHEN')
    shop_description = serializers.CharField(required=False, allow_blank=True, default='')
    shop_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')
    shop_email = serializers.EmailField(required=False, allow_blank=True, default='')
    shop_address_line = serializers.CharField(max_length=255)
    shop_city = serializers.CharField(max_length=100, default='New Delhi')
    shop_postal_code = serializers.CharField(max_length=20, default='110001')
    opening_time = serializers.TimeField(required=False, default='10:00:00')
    closing_time = serializers.TimeField(required=False, default='23:00:00')
    delivery_radius_km = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=8.0)
    minimum_order_value = serializers.DecimalField(max_digits=8, decimal_places=2, required=False, default=99.0)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return normalized

    def validate_username(self, value):
        cleaned = value.strip()
        if User.objects.filter(username__iexact=cleaned).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return cleaned

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate_shop_name(self, value):
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Shop name must be at least 2 characters long.")
        return cleaned

    def create(self, validated_data):
        from apps.shops.models import Shop, ShopOperatingHour

        username = validated_data['username'].strip()
        email = validated_data['email'].strip().lower()
        password = validated_data['password']
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()
        phone = validated_data.get('phone', '').strip()

        shop_name = validated_data['shop_name'].strip()
        shop_tier = validated_data.get('shop_tier', 'FRESH_KITCHEN')
        if shop_tier not in ['STREET_FOOD', 'LUXURY_DINING', 'FRESH_KITCHEN']:
            shop_tier = 'FRESH_KITCHEN'
        shop_description = validated_data.get('shop_description', '').strip()
        shop_phone = validated_data.get('shop_phone', '').strip() or phone
        shop_email = validated_data.get('shop_email', '').strip() or email
        shop_address_line = validated_data['shop_address_line'].strip()
        shop_city = validated_data.get('shop_city', 'New Delhi').strip()
        shop_postal_code = validated_data.get('shop_postal_code', '110001').strip()
        opening_time = validated_data.get('opening_time', '10:00:00')
        closing_time = validated_data.get('closing_time', '23:00:00')
        delivery_radius_km = validated_data.get('delivery_radius_km', 8.0)
        minimum_order_value = validated_data.get('minimum_order_value', 99.0)

        with transaction.atomic():
            # 1. Create the Vendor User
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                role=User.Role.VENDOR
            )

            # 2. Generate a unique slug for the shop
            base_slug = slugify(shop_name) or f"shop-{uuid.uuid4().hex[:6]}"
            slug = base_slug
            counter = 1
            while Shop.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            # 3. Create the Shop record (enters PENDING status)
            shop = Shop.objects.create(
                owner=user,
                name=shop_name,
                slug=slug,
                tier=shop_tier,
                description=shop_description,
                phone=shop_phone,
                email=shop_email,
                address_line=shop_address_line,
                city=shop_city,
                postal_code=shop_postal_code,
                opening_time=opening_time,
                closing_time=closing_time,
                delivery_radius_km=delivery_radius_km,
                minimum_order_value=minimum_order_value,
                status=Shop.Status.PENDING,
                is_accepting_orders=True,
                is_active=True
            )

        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token obtain serializer.
    Supports authenticating with EITHER username OR email address (case-insensitively).
    Returns rich user profile details alongside access and refresh tokens.
    Provides clear inactive account messaging.
    """
    def validate(self, attrs):
        raw_identifier = attrs.get(self.username_field, '').strip()

        # Check if the user passed an email or username
        user_candidate = None
        if '@' in raw_identifier:
            try:
                user_candidate = User.objects.get(email__iexact=raw_identifier)
                attrs[self.username_field] = user_candidate.username
            except User.DoesNotExist:
                try:
                    user_candidate = User.objects.get(username__iexact=raw_identifier)
                    attrs[self.username_field] = user_candidate.username
                except User.DoesNotExist:
                    pass
        else:
            try:
                user_candidate = User.objects.get(username__iexact=raw_identifier)
                attrs[self.username_field] = user_candidate.username
            except User.DoesNotExist:
                try:
                    user_candidate = User.objects.get(email__iexact=raw_identifier)
                    attrs[self.username_field] = user_candidate.username
                except User.DoesNotExist:
                    pass

        if user_candidate and not user_candidate.is_active:
            raise AuthenticationFailed(
                "This account is inactive or has been suspended. Please contact platform support."
            )

        data = super().validate(attrs)
        data['user'] = UserSerializer(self.user).data
        return data


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for platform administrators to update user status or role.
    """
    class Meta:
        model = User
        fields = ('role', 'is_active', 'phone', 'first_name', 'last_name', 'bio')


class AdminAuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for platform audit trail entries.
    """
    admin_username = serializers.CharField(source='admin.username', read_only=True)

    class Meta:
        model = AdminAuditLog
        fields = (
            'id',
            'admin',
            'admin_username',
            'action',
            'target_type',
            'target_id',
            'target_repr',
            'details',
            'ip_address',
            'created_at',
        )
        read_only_fields = fields
