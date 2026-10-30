import uuid
from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from apps.core.models import TimeStampedModel

class CustomerAddress(TimeStampedModel):
    """
    Customer delivery address entity.
    Stores verified coordinates, landmarks, and delivery instructions.
    Enforces that customers can only view, edit, and select their own saved addresses.
    """
    class Label(models.TextChoices):
        HOME = 'HOME', 'Home'
        WORK = 'WORK', 'Work'
        OTHER = 'OTHER', 'Other'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='addresses',
        help_text="The customer account owning this delivery address."
    )
    label = models.CharField(
        max_length=20,
        choices=Label.choices,
        default=Label.HOME,
        db_index=True
    )
    custom_label = models.CharField(
        max_length=50,
        blank=True,
        help_text="Custom name if label is OTHER (e.g. 'Gym', 'Parents Home')."
    )

    # Recipient details
    recipient_name = models.CharField(max_length=120)
    recipient_phone = models.CharField(max_length=20)

    # Physical Address lines
    address_line1 = models.CharField(
        max_length=255,
        help_text="Flat, House no., Floor, Building, Apartment name"
    )
    address_line2 = models.CharField(
        max_length=255,
        blank=True,
        help_text="Street, Sector, Area, Locality"
    )
    landmark = models.CharField(
        max_length=150,
        blank=True,
        help_text="Nearby landmark to assist the delivery partner."
    )
    city = models.CharField(max_length=100, default='New Delhi')
    state = models.CharField(max_length=100, blank=True, default='Delhi')
    postal_code = models.CharField(max_length=20)

    # Precise Geolocation coordinates
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Latitude coordinate obtained via GPS, map pin, or geocoding."
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Longitude coordinate obtained via GPS, map pin, or geocoding."
    )

    # Delivery specifics
    delivery_instructions = models.TextField(
        blank=True,
        help_text="Special instructions (e.g. 'Leave with guard', 'Do not ring bell')."
    )

    # Operational status
    is_default = models.BooleanField(
        default=False,
        help_text="Default address selected automatically at checkout."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Soft deletion flag to maintain order history integrity."
    )

    class Meta:
        ordering = ['-is_default', '-created_at']
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def clean(self):
        super().clean()
        if self.latitude is not None:
            lat = Decimal(str(self.latitude))
            if lat < Decimal('-90.0') or lat > Decimal('90.0'):
                raise ValidationError({"latitude": "Latitude must be between -90 and 90 degrees."})
        if self.longitude is not None:
            lng = Decimal(str(self.longitude))
            if lng < Decimal('-180.0') or lng > Decimal('180.0'):
                raise ValidationError({"longitude": "Longitude must be between -180 and 180 degrees."})

    def save(self, *args, **kwargs):
        self.clean()
        # If this address is set as default, unset default on other addresses of the same user
        if self.is_default and self.user_id:
            CustomerAddress.objects.filter(
                user_id=self.user_id,
                is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.recipient_name} ({self.get_label_display()}) - {self.address_line1}, {self.city}"


class SupportTicket(TimeStampedModel):
    """
    Customer support query or complaint record.
    Supports linking directly to the specific kitchen/shop so vendors can handle their
    own complaints, and platform admins can monitor shop-wise dispute distribution.
    """
    class Category(models.TextChoices):
        ORDER_INQUIRY = 'ORDER_INQUIRY', 'Order Inquiry & Status'
        FOOD_QUALITY = 'FOOD_QUALITY', 'Food Taste & Quality Issue'
        DELIVERY_DELAY = 'DELIVERY_DELAY', 'Delivery Delay'
        MISSING_ITEM = 'MISSING_ITEM', 'Missing or Incorrect Item'
        REFUND_REQUEST = 'REFUND_REQUEST', 'Payment & Refund Request'
        HYGIENE_CONCERN = 'HYGIENE_CONCERN', 'Hygiene & Packaging Concern'
        PARTNER_INQUIRY = 'PARTNER_INQUIRY', 'Kitchen Onboarding & Partnership'
        OTHER = 'OTHER', 'General Inquiry'

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        RESOLVED = 'RESOLVED', 'Resolved'
        CLOSED = 'CLOSED', 'Closed'

    ticket_number = models.CharField(max_length=30, unique=True, db_index=True)
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='support_tickets'
    )
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_complaints',
        help_text="The specific restaurant/kitchen partner this complaint or query is about."
    )
    customer_name = models.CharField(max_length=120)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=25)
    order_id = models.CharField(max_length=50, blank=True, help_text="Optional order ID if inquiry is about an order.")
    category = models.CharField(max_length=40, choices=Category.choices, default=Category.ORDER_INQUIRY)
    subject = models.CharField(max_length=200)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True)
    resolution_notes = models.TextField(blank=True, help_text="Notes added by the vendor or platform admin upon resolution.")
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_tickets'
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shop', 'status']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        shop_name = self.shop.name if self.shop else "General Support"
        return f"[{self.ticket_number}] {self.category} - {shop_name} ({self.status})"

