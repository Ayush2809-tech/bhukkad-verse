import random
from rest_framework import serializers
from .models import CustomerAddress, SupportTicket

class CustomerAddressSerializer(serializers.ModelSerializer):
    """
    Serializer for customer delivery addresses.
    Restricts access strictly to the authenticated owner.
    """
    label_display = serializers.CharField(source='get_label_display', read_only=True)

    class Meta:
        model = CustomerAddress
        fields = (
            'id',
            'label',
            'label_display',
            'custom_label',
            'recipient_name',
            'recipient_phone',
            'address_line1',
            'address_line2',
            'landmark',
            'city',
            'state',
            'postal_code',
            'latitude',
            'longitude',
            'delivery_instructions',
            'is_default',
            'is_active',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'is_active', 'created_at', 'updated_at')

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        # If user has no existing addresses, make the first one default automatically
        if not CustomerAddress.objects.filter(user=user, is_active=True).exists():
            validated_data['is_default'] = True
        return super().create(validated_data)


class SupportTicketSerializer(serializers.ModelSerializer):
    """
    Serializer for customer support tickets and shop-specific complaints.
    """
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_slug = serializers.CharField(source='shop.slug', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = SupportTicket
        fields = (
            'id',
            'ticket_number',
            'customer',
            'shop',
            'shop_name',
            'shop_slug',
            'customer_name',
            'customer_email',
            'customer_phone',
            'order_id',
            'category',
            'category_display',
            'subject',
            'message',
            'status',
            'status_display',
            'resolution_notes',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'ticket_number', 'customer', 'created_at', 'updated_at')

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            validated_data['customer'] = request.user
            if not validated_data.get('customer_name'):
                name = f"{request.user.first_name} {request.user.last_name}".strip()
                validated_data['customer_name'] = name or request.user.username
            if not validated_data.get('customer_email'):
                validated_data['customer_email'] = request.user.email

        validated_data['ticket_number'] = f"BV-SUPP-{random.randint(10000, 99999)}"
        return super().create(validated_data)

