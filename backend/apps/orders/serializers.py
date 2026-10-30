from rest_framework import serializers
from decimal import Decimal
from .models import Order, OrderItem, PaymentTransaction
from apps.shops.models import Shop

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id',
            'dish_name',
            'dish_id',
            'quantity',
            'unit_price',
            'total_price',
            'dietary_type',
            'variant_name',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    shop_slug = serializers.CharField(source='shop.slug', read_only=True)
    shop_tier = serializers.CharField(source='shop.tier', read_only=True)
    shop_phone = serializers.CharField(source='shop.phone', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'shop',
            'shop_name',
            'shop_slug',
            'shop_tier',
            'shop_phone',
            'status',
            'payment_status',
            'payment_method',
            'subtotal',
            'platform_fee',
            'delivery_fee',
            'tax_amount',
            'coupon_code',
            'discount_amount',
            'total_amount',
            'admin_commission_rate',
            'admin_commission_amount',
            'admin_total_earnings',
            'vendor_payout_amount',
            'customer_name',
            'customer_phone',
            'customer_email',
            'delivery_address_line',
            'delivery_city',
            'delivery_latitude',
            'delivery_longitude',
            'cooking_instructions',
            'estimated_delivery_minutes',
            'delivery_partner_name',
            'delivery_partner_phone',
            'razorpay_order_id',
            'items',
            'created_at',
            'updated_at',
        ]


class CheckoutItemInputSerializer(serializers.Serializer):
    dish_id = serializers.UUIDField(required=False, allow_null=True)
    name = serializers.CharField(max_length=200)
    quantity = serializers.IntegerField(min_value=1, default=1)
    price = serializers.DecimalField(max_digits=8, decimal_places=2)
    dietary_type = serializers.CharField(default='VEG')
    variant_name = serializers.CharField(required=False, allow_blank=True, default='')


class CreateCheckoutOrderSerializer(serializers.Serializer):
    shop_id = serializers.UUIDField()
    items = CheckoutItemInputSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.ONLINE_RAZORPAY)
    coupon_code = serializers.CharField(required=False, allow_blank=True, default='')
    customer_name = serializers.CharField(max_length=120)
    customer_phone = serializers.CharField(max_length=25)
    customer_email = serializers.EmailField(required=False, allow_blank=True, default='')
    delivery_address = serializers.CharField()
    delivery_city = serializers.CharField(max_length=100, default='New Delhi')
    delivery_latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    delivery_longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    cooking_instructions = serializers.CharField(required=False, allow_blank=True, default='')


class VerifyPaymentSerializer(serializers.Serializer):
    order_number = serializers.CharField()
    razorpay_order_id = serializers.CharField(required=False, allow_blank=True)
    razorpay_payment_id = serializers.CharField()
    razorpay_signature = serializers.CharField(required=False, allow_blank=True)


class UpdateOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)

