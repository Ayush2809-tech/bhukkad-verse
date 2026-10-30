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


class RiderWallet(TimeStampedModel):
    """
    Rider Cash Float & Delivery Earnings Wallet.
    Tracks physical cash collected from COD orders vs allowable cash limit.
    Enforces anti-theft cash locking when cash_in_hand >= cash_limit.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rider_wallet'
    )
    rider_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=25)
    vehicle_type = models.CharField(max_length=50, default='Electric Bike')
    vehicle_number = models.CharField(max_length=50, blank=True, default='')

    # COD Cash in hand vs platform limits
    cash_in_hand = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total physical cash held by rider from COD collections"
    )
    cash_limit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('1500.00'),
        help_text="Maximum cash allowed before rider is blocked from taking more COD orders"
    )
    lifetime_delivery_earnings = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Cumulative delivery wages earned"
    )
    withdrawable_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Net salary/payout available for bank transfer"
    )
    is_active = models.BooleanField(default=True)
    is_blocked_from_cod = models.BooleanField(
        default=False,
        help_text="True if rider exceeded cash limit and must deposit cash to continue"
    )

    def check_limit_and_update(self):
        """Update is_blocked_from_cod status based on current cash float."""
        self.is_blocked_from_cod = self.cash_in_hand >= self.cash_limit
        self.save(update_fields=['is_blocked_from_cod'])

    def __str__(self):
        return f"Rider {self.rider_name} - Cash: ₹{self.cash_in_hand} / Limit: ₹{self.cash_limit}"


class RiderCashLedger(TimeStampedModel):
    """
    Immutable double-entry transaction record for every cash collection,
    delivery wage credit, and deposit back to platform.
    """
    class EntryType(models.TextChoices):
        COD_COLLECTED = 'COD_COLLECTED', 'Cash Collected from Customer (+Cash in Hand)'
        DELIVERY_WAGE = 'DELIVERY_WAGE', 'Delivery Partner Wage (+Earnings)'
        CASH_DEPOSIT = 'CASH_DEPOSIT', 'Cash Deposited to Platform via UPI (-Cash in Hand)'
        SALARY_PAYOUT = 'SALARY_PAYOUT', 'Salary Payout Disbursed to Bank (-Balance)'
        ADJUSTMENT = 'ADJUSTMENT', 'Audit Adjustment / Penalty'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(
        RiderWallet,
        on_delete=models.CASCADE,
        related_name='ledger_entries'
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rider_ledger_entries'
    )
    entry_type = models.CharField(max_length=30, choices=EntryType.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    cash_in_hand_after = models.DecimalField(max_digits=10, decimal_places=2)
    reference_utr = models.CharField(max_length=100, blank=True, default='')
    note = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.entry_type}] ₹{self.amount} - {self.wallet.rider_name}"


class VendorSettlementLedger(TimeStampedModel):
    """
    Tracks the 90% net sales entitlement for each partner kitchen.
    Enforces automated T+1 reconciliation.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Delivery Confirmation'
        APPROVED = 'APPROVED', 'Approved for T+1 Batch Payout'
        SETTLED = 'SETTLED', 'Transferred to Vendor Bank Account'
        DISPUTED = 'DISPUTED', 'On Hold (Customer Ticket Raised)'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        related_name='settlement_entries'
    )
    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name='vendor_settlement'
    )
    gross_food_amount = models.DecimalField(max_digits=10, decimal_places=2)
    platform_commission_amount = models.DecimalField(max_digits=10, decimal_places=2)
    net_vendor_payout = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    settled_at = models.DateTimeField(null=True, blank=True)
    bank_utr = models.CharField(max_length=100, blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Settlement #{self.order.order_number} ({self.shop.name}) - ₹{self.net_vendor_payout} [{self.status}]"


