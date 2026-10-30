import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from apps.core.models import TimeStampedModel

class Order(TimeStampedModel):
    """
    Marketplace Order Entity.
    Calculates transparent pricing, 5% GST, admin platform fees,
    dynamic commission splitting, and net vendor payout.
    """
    class Status(models.TextChoices):
        PLACED = 'PLACED', 'Order Placed'
        CONFIRMED = 'CONFIRMED', 'Kitchen Accepted'
        PREPARING = 'PREPARING', 'Chef Cooking Fresh'
        OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', 'Rider Out for Delivery'
        DELIVERED = 'DELIVERED', 'Delivered Successfully'
        CANCELLED = 'CANCELLED', 'Cancelled'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Payment Pending'
        PAID = 'PAID', 'Payment Succeeded'
        FAILED = 'FAILED', 'Payment Failed'
        REFUNDED = 'REFUNDED', 'Refunded'

    class PaymentMethod(models.TextChoices):
        ONLINE_RAZORPAY = 'ONLINE_RAZORPAY', 'Razorpay (UPI / Card / Netbanking)'
        COD = 'COD', 'Cash On Delivery'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order_number = models.CharField(max_length=32, unique=True, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='orders'
    )
    status = models.CharField(
        max_length=25,
        choices=Status.choices,
        default=Status.PLACED,
        db_index=True
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        db_index=True
    )
    payment_method = models.CharField(
        max_length=25,
        choices=PaymentMethod.choices,
        default=PaymentMethod.ONLINE_RAZORPAY
    )

    # Financial breakdown
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total sum of items")
    platform_fee = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('5.00'), help_text="Nominal admin platform fee")
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('0.00'), help_text="Delivery fee (Free on orders >= ₹99)")
    tax_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'), help_text="5% GST")
    coupon_code = models.CharField(max_length=40, blank=True)
    discount_amount = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Grand total charged to customer")

    # Marketplace Revenue Split
    admin_commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('10.00'),
        help_text="Platform commission rate in % (e.g. 10.00%)"
    )
    admin_commission_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Calculated admin commission on item sales"
    )
    admin_total_earnings = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total admin revenue: admin_commission_amount + platform_fee"
    )
    vendor_payout_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Net payable amount to vendor bank account: subtotal - admin_commission_amount"
    )

    # Customer & Delivery details
    customer_name = models.CharField(max_length=120)
    customer_phone = models.CharField(max_length=25)
    customer_email = models.EmailField(blank=True)
    delivery_address_line = models.TextField()
    delivery_city = models.CharField(max_length=100, default='New Delhi')
    delivery_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    cooking_instructions = models.TextField(blank=True)

    # Fulfillment tracking
    estimated_delivery_minutes = models.PositiveIntegerField(default=25)
    delivery_partner_name = models.CharField(max_length=100, default='Rahul Kumar (Electric Partner)')
    delivery_partner_phone = models.CharField(max_length=25, default='+91 98765 43210')

    # Payment Gateway metadata
    razorpay_order_id = models.CharField(max_length=100, blank=True, db_index=True)
    razorpay_payment_id = models.CharField(max_length=100, blank=True)
    razorpay_signature = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shop', 'status']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Order #{self.order_number} ({self.shop.name}) - ₹{self.total_amount} [{self.status}]"


class OrderItem(TimeStampedModel):
    """
    Individual dish items contained within an order.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    dish_name = models.CharField(max_length=200)
    dish_id = models.UUIDField(null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)
    dietary_type = models.CharField(max_length=20, default='VEG')
    variant_name = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.quantity}x {self.dish_name} (₹{self.total_price})"


class PaymentTransaction(TimeStampedModel):
    """
    Audit log of all online payment attempts and gateway callbacks.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='transactions')
    transaction_id = models.CharField(max_length=100, unique=True, db_index=True)
    payment_gateway = models.CharField(max_length=50, default='RAZORPAY')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, default='INITIATED')
    raw_response = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"Txn #{self.transaction_id} for Order #{self.order.order_number} (₹{self.amount})"

