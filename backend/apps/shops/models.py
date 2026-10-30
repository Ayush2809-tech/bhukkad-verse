import os
import uuid
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Max
from django.utils.text import slugify
from apps.core.models import TimeStampedModel

class Shop(TimeStampedModel):
    """
    Shop / Restaurant entity representing an independent vendor kitchen in BHUKKAD VERSE.
    Belongs to a single Vendor owner. Enforces vendor data isolation and approval lifecycle.
    """
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Admin Review'
        APPROVED = 'APPROVED', 'Approved & Active'
        REJECTED = 'REJECTED', 'Rejected'
        SUSPENDED = 'SUSPENDED', 'Temporarily Suspended'

    class Tier(models.TextChoices):
        STREET_FOOD = 'STREET_FOOD', 'Street Food & Carts (Budget & Authentic)'
        LUXURY_DINING = 'LUXURY_DINING', 'Luxury Fine Dining & Hotels'
        FRESH_KITCHEN = 'FRESH_KITCHEN', 'Fresh Neighborhood Eatery & Cloud Kitchen'

    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='shop',
        help_text="The vendor user who owns and manages this kitchen."
    )
    name = models.CharField(max_length=150, help_text="Official shop or restaurant name.")
    slug = models.SlugField(max_length=180, unique=True, db_index=True)
    tier = models.CharField(
        max_length=30,
        choices=Tier.choices,
        default=Tier.FRESH_KITCHEN,
        db_index=True,
        help_text="Eatery experience tier: Street Food (budget), Luxury (5-star fine dining), or Fresh Kitchen (cloud kitchen/eatery)."
    )
    description = models.TextField(blank=True, help_text="Brand story, specialties, and description.")
    logo = models.ImageField(upload_to='shops/logos/', blank=True, null=True)
    banner = models.ImageField(upload_to='shops/banners/', blank=True, null=True)

    # Contact & Location
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=100, default='New Delhi')
    postal_code = models.CharField(max_length=20, default='110001')
    latitude = models.DecimalField(max_digits=9, decimal_places=6, default=28.6139)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, default=77.2090)
    timezone = models.CharField(
        max_length=50,
        default='Asia/Kolkata',
        help_text="IANA timezone string, e.g. Asia/Kolkata"
    )

    # Operations & Policies (legacy default times preserved for backward compatibility)
    opening_time = models.TimeField(default='10:00:00')
    closing_time = models.TimeField(default='23:00:00')
    delivery_radius_km = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)
    minimum_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=99.0)
    commission_rate_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.0)

    # Temporary Order Pause State
    is_accepting_orders = models.BooleanField(
        default=True,
        help_text="Vendor-controlled live order acceptance toggle."
    )
    order_pause_reason = models.CharField(
        max_length=255,
        blank=True,
        default='',
        help_text="Optional explanation when vendor temporarily pauses order acceptance."
    )
    order_paused_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp when orders were paused."
    )

    # Platform Moderation Workflow
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True
    )
    admin_review_notes = models.TextField(
        blank=True,
        help_text="Reason for rejection or onboarding notes provided by the platform admin."
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['city']),
        ]

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Shop.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)
        if is_new:
            self.create_default_operating_hours()

    def create_default_operating_hours(self):
        """
        Populate default 7-day schedule (Monday..Sunday) using legacy/configured
        opening_time and closing_time, or default 10:00 to 22:00.
        """
        import datetime
        open_t = self.opening_time or datetime.time(10, 0, 0)
        close_t = self.closing_time or datetime.time(22, 0, 0)
        for day in range(7):
            ShopOperatingHour.objects.get_or_create(
                shop=self,
                weekday=day,
                defaults={
                    'is_closed': False,
                    'opening_time': open_t,
                    'closing_time': close_t,
                }
            )

    @property
    def is_approved(self) -> bool:
        return self.status == self.Status.APPROVED

    @property
    def active_menu_card(self):
        """
        Returns the currently active ShopMenuCard for this shop, or None.
        """
        return self.menu_cards.filter(is_active=True).first()

    def __str__(self):
        return f"{self.name} [{self.get_status_display()}] - {self.owner.username}"


class ShopOperatingHour(TimeStampedModel):
    """
    Weekly operating hours schedule for a vendor kitchen.
    Provides Monday-through-Sunday open/closed times with overnight schedule support.
    """
    class Weekday(models.IntegerChoices):
        MONDAY = 0, 'Monday'
        TUESDAY = 1, 'Tuesday'
        WEDNESDAY = 2, 'Wednesday'
        THURSDAY = 3, 'Thursday'
        FRIDAY = 4, 'Friday'
        SATURDAY = 5, 'Saturday'
        SUNDAY = 6, 'Sunday'

    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='operating_hours',
        help_text="The shop to which this operating schedule belongs."
    )
    weekday = models.IntegerField(
        choices=Weekday.choices,
        help_text="0 for Monday through 6 for Sunday."
    )
    is_closed = models.BooleanField(
        default=False,
        help_text="True if the kitchen is closed the entire day."
    )
    opening_time = models.TimeField(null=True, blank=True)
    closing_time = models.TimeField(null=True, blank=True)

    class Meta:
        ordering = ['weekday']
        unique_together = ('shop', 'weekday')
        verbose_name = 'Shop Operating Hour'
        verbose_name_plural = 'Shop Operating Hours'

    def clean(self):
        super().clean()
        if not self.is_closed:
            if self.opening_time is None or self.closing_time is None:
                raise ValidationError("Both opening time and closing time must be provided when the shop is open.")
            if self.opening_time == self.closing_time:
                raise ValidationError("Opening time and closing time cannot be identical.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    @property
    def is_overnight(self) -> bool:
        """
        True if the operating schedule spans midnight into the following calendar day
        (e.g., 18:00 to 02:00).
        """
        if self.is_closed or not self.opening_time or not self.closing_time:
            return False
        return self.closing_time < self.opening_time

    def __str__(self):
        day_name = self.get_weekday_display()
        if self.is_closed:
            return f"{self.shop.name} - {day_name}: CLOSED"
        overnight = " (overnight)" if self.is_overnight else ""
        return f"{self.shop.name} - {day_name}: {self.opening_time.strftime('%H:%M')} - {self.closing_time.strftime('%H:%M')}{overnight}"


def menu_card_upload_path(instance, filename):
    """
    Generate a safe, collision-resistant storage path for vendor menu cards:
    menu_cards/<shop_id>/<uuid>.<ext>
    """
    ext = os.path.splitext(filename)[1].lower()
    return f"menu_cards/{instance.shop_id}/{uuid.uuid4().hex}{ext}"


class ShopMenuCard(TimeStampedModel):
    """
    Uploaded original vendor menu card (PDF, JPEG, or PNG).
    Enables version tracking, activation/archiving, and customer viewing.
    """
    class FileType(models.TextChoices):
        PDF = 'PDF', 'PDF Document'
        JPEG = 'JPEG', 'JPEG Image'
        PNG = 'PNG', 'PNG Image'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='menu_cards',
        help_text="The shop to which this menu card belongs."
    )
    file = models.FileField(
        upload_to=menu_card_upload_path,
        help_text="The uploaded original menu card file (PDF, JPEG, or PNG)."
    )
    original_filename = models.CharField(
        max_length=255,
        help_text="Original client-side filename for vendor reference."
    )
    file_type = models.CharField(
        max_length=20,
        choices=FileType.choices,
        help_text="Validated file format (PDF, JPEG, or PNG)."
    )
    file_size_bytes = models.PositiveIntegerField(
        help_text="File size in bytes."
    )
    version = models.PositiveIntegerField(
        default=1,
        help_text="Sequential version number for this shop's menu card."
    )
    title = models.CharField(
        max_length=150,
        blank=True,
        default="",
        help_text="Optional descriptive title (e.g. 'Dine-In Menu 2026')."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="True if this is the currently active menu card visible to customers."
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_menu_cards',
        help_text="The user (vendor or admin) who uploaded this menu card."
    )

    class Meta:
        ordering = ['-version', '-created_at']
        verbose_name = 'Shop Menu Card'
        verbose_name_plural = 'Shop Menu Cards'
        constraints = [
            # Ensure at most one active menu card per shop
            models.UniqueConstraint(
                fields=['shop'],
                condition=models.Q(is_active=True),
                name='unique_active_menu_card_per_shop'
            ),
            # Ensure unique version number per shop
            models.UniqueConstraint(
                fields=['shop', 'version'],
                name='unique_menu_card_version_per_shop'
            )
        ]
        indexes = [
            models.Index(fields=['shop', 'is_active']),
            models.Index(fields=['shop', 'version']),
        ]

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        if is_new and (not self.version or self.version == 1):
            max_v = ShopMenuCard.objects.filter(shop=self.shop).aggregate(Max('version'))['version__max'] or 0
            self.version = max_v + 1

        if self.is_active:
            # Atomically deactivate any other active menu card for this shop
            with transaction.atomic():
                ShopMenuCard.objects.filter(
                    shop=self.shop,
                    is_active=True
                ).exclude(pk=self.pk).update(is_active=False)
                super().save(*args, **kwargs)
        else:
            super().save(*args, **kwargs)

    def activate(self):
        """
        Mark this menu card as the single active card for the shop atomically.
        """
        with transaction.atomic():
            ShopMenuCard.objects.filter(shop=self.shop, is_active=True).exclude(pk=self.pk).update(is_active=False)
            self.is_active = True
            self.save(update_fields=['is_active', 'updated_at'])

    def archive(self):
        """
        Archive this menu card by deactivating it.
        """
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])

    def delete(self, *args, **kwargs):
        """
        Delete the database record first, then safely clean up the file from storage.
        """
        storage = self.file.storage if self.file else None
        path = self.file.name if self.file else None
        super().delete(*args, **kwargs)
        if storage and path:
            try:
                storage.delete(path)
            except Exception:
                pass

    @property
    def file_url(self) -> str:
        if self.file:
            return self.file.url
        return ""

    def __str__(self):
        active_str = " [ACTIVE]" if self.is_active else ""
        return f"{self.shop.name} Menu v{self.version} ({self.file_type}){active_str}"


class ShopReview(TimeStampedModel):
    """
    Customer review and rating for a specific kitchen / food item.
    """
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    product_name = models.CharField(max_length=150, blank=True, default='', help_text="Optional dish name being reviewed.")
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shop_reviews'
    )
    customer_name = models.CharField(max_length=120, default='Food Enthusiast')
    rating = models.PositiveSmallIntegerField(default=5, help_text="Rating 1 to 5 stars.")
    comment = models.TextField(help_text="Customer food experience and review.")
    is_approved = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['shop', 'is_approved']),
        ]

    def __str__(self):
        return f"{self.customer_name} -> {self.shop.name} ({self.rating}★)"


