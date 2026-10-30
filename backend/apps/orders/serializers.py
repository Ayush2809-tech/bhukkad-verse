from rest_framework import serializers
from decimal import Decimal
from .models import (
    Order,
    OrderItem,
    PaymentTransaction,
    RiderWallet,
    RiderCashLedger,
    VendorSettlementLedger,
)
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


class RiderCashLedgerSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = RiderCashLedger
        fields = [
            'id',
            'entry_type',
            'amount',
            'cash_in_hand_after',
            'order_number',
            'reference_utr',
            'note',
            'created_at',
        ]


class RiderWalletSerializer(serializers.ModelSerializer):
    ledger_entries = serializers.SerializerMethodField()

    class Meta:
        model = RiderWallet
        fields = [
            'id',
            'rider_name',
            'phone',
            'vehicle_type',
            'vehicle_number',
            'cash_in_hand',
            'cash_limit',
            'lifetime_delivery_earnings',
            'withdrawable_balance',
            'is_active',
            'is_blocked_from_cod',
            'ledger_entries',
            'created_at',
            'updated_at',
        ]

    def get_ledger_entries(self, obj):
        entries = obj.ledger_entries.all()[:20]
        return RiderCashLedgerSerializer(entries, many=True).data


class VendorSettlementLedgerSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(source='shop.name', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)

    class Meta:
        model = VendorSettlementLedger
        fields = [
            'id',
            'shop',
            'shop_name',
            'order_number',
            'gross_food_amount',
            'platform_commission_amount',
            'net_vendor_payout',
            'status',
            'settled_at',
            'bank_utr',
            'created_at',
        ]


class RiderCashCollectInputSerializer(serializers.Serializer):
    order_number = serializers.CharField()
    cash_collected = serializers.DecimalField(max_digits=10, decimal_places=2)


class RiderDepositCashInputSerializer(serializers.Serializer):
    deposit_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    reference_utr = serializers.CharField(max_length=100)
    note = serializers.CharField(required=False, allow_blank=True, default='')


