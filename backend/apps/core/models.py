import uuid
from django.db import models
from django.conf import settings

class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    created_at and updated_at fields, alongside a UUID primary key.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class PlatformSettings(TimeStampedModel):
    """
    Dynamic CMS settings for entrance curtain, branding quotes, and support handling.
    Managed live by platform administrators.
    """
    curtain_enabled = models.BooleanField(
        default=True,
        help_text="Master switch to enable or disable the grand entrance curtain."
    )
    curtain_video_url = models.URLField(
        blank=True,
        default="https://assets.mixkit.co/videos/preview/mixkit-top-view-of-a-table-with-plates-of-food-43512-large.mp4",
        help_text="Background looping video or animated graphic URL for the entrance curtain."
    )
    curtain_video_file = models.FileField(
        upload_to='curtain_videos/',
        blank=True,
        null=True,
        help_text="Direct video file uploaded from admin device (MP4 / WebM)."
    )
    curtain_badge = models.CharField(
        max_length=100,
        default="AUTHENTIC NEIGHBORHOOD KITCHENS",
        help_text="Badge text shown at the top of the curtain."
    )
    curtain_headline = models.CharField(
        max_length=150,
        default="BHUKKAD VERSE",
        help_text="Primary curtain headline."
    )
    curtain_tagline = models.CharField(
        max_length=200,
        default="YOUR CRAVINGS. YOUR UNIVERSE.",
        help_text="Brand tagline or motto."
    )
    curtain_quote = models.TextField(
        default="Authentic neighborhood cloud kitchens, artisanal eateries, and gourmet masters cooked fresh to your exact taste.❤️",
        help_text="Dynamic brand quote/story displayed on the grand entrance curtain."
    )

    # Dynamic Front-Page Brand Logo Customization (Admin CMS)
    custom_logo_url = models.URLField(
        blank=True,
        default="",
        help_text="Direct URL to custom front page brand logo."
    )
    custom_logo_file = models.ImageField(
        upload_to='platform_logos/',
        blank=True,
        null=True,
        help_text="Custom brand logo uploaded directly from admin device."
    )

    # Dynamic Front-Page Hero Section CMS
    hero_headline_primary = models.CharField(
        max_length=150,
        default="YOUR CRAVINGS.",
        help_text="Primary bold headline in hero section."
    )
    hero_headline_highlight = models.CharField(
        max_length=150,
        default="YOUR UNIVERSE.",
        help_text="Gradient highlighted text in hero headline."
    )
    hero_subtitle = models.TextField(
        default="Order directly from verified neighborhood cloud kitchens, artisanal eateries, and local culinary masters. Freshly cooked, customized to your taste, delivered hot.",
        help_text="Hero section explanatory subtitle."
    )
    hero_badge_left = models.CharField(
        max_length=80,
        default="Verified Local Kitchens",
        help_text="Left text inside hero pill badge."
    )
    hero_badge_right = models.CharField(
        max_length=80,
        default="Hot & Fresh Direct Delivery",
        help_text="Right text inside hero pill badge."
    )
    hero_mascot_badge_1 = models.CharField(
        max_length=60,
        default="Artisan Kitchens",
        help_text="Top-left mascot badge."
    )
    hero_mascot_badge_2 = models.CharField(
        max_length=60,
        default="Made to Order",
        help_text="Top-right mascot badge."
    )
    hero_mascot_badge_bottom = models.CharField(
        max_length=120,
        default="Crafted Fresh • Artisanal Flavors",
        help_text="Bottom mascot floating banner text."
    )
    hero_mascot_image_file = models.ImageField(
        upload_to='platform_mascots/',
        blank=True,
        null=True,
        help_text="Custom hero mascot/food 3D image uploaded by admin."
    )
    hero_mascot_image_url = models.URLField(
        blank=True,
        default="",
        help_text="URL fallback for custom hero mascot image."
    )

    # Dynamic About Us Page CMS (Admin Managed)
    about_hero_title = models.CharField(
        max_length=200,
        default="One Universe for All Your Cravings",
        help_text="Primary headline on the About Us page."
    )
    about_hero_subtitle = models.TextField(
        default="Born from an unbridled passion for authentic flavors. From the narrow historic alleys of Old Delhi serving legendary street chaat to five-star royal Awadhi palaces and beloved local cloud kitchens.",
        help_text="Subtitle on the About Us page."
    )
    about_street_title = models.CharField(
        max_length=150,
        default="Iconic Street Food & Legendary Carts",
        help_text="Title for the street food pillar on About page."
    )
    about_street_desc = models.TextField(
        default="Deep-rooted recipes from traditional chaat corners, spicy kathi roll makers, and iconic roadside samosa masters who have perfected their craft across decades.",
        help_text="Description for street food pillar."
    )
    about_luxury_title = models.CharField(
        max_length=150,
        default="Luxury Fine Dining & Hotels",
        help_text="Title for luxury pillar on About page."
    )
    about_luxury_desc = models.TextField(
        default="Partnering with royal Mughlai heritage dining rooms and artisanal master chefs to bring earthen handi slow-dum biryanis and truffle delicacies directly to your table with five-star luxury presentation.",
        help_text="Description for luxury pillar."
    )
    about_kitchens_title = models.CharField(
        max_length=150,
        default="Fresh Neighborhood Kitchens",
        help_text="Title for fresh kitchens pillar on About page."
    )
    about_kitchens_desc = models.TextField(
        default="Pure homestyle comfort cooked fresh every single day. Sanitized cloud kitchens preparing wholesome dal makhani, paneer gravies, and hot rotis with authentic whole spices and zero artificial additives.",
        help_text="Description for fresh kitchens pillar."
    )
    about_developer_title = models.CharField(
        max_length=150,
        default="Crafted with Passion by Ayush Saxena",
        help_text="Title for developer / creator section."
    )
    about_developer_desc = models.TextField(
        default="Bhukkad Verse was engineered from ground up as a modern, high-performance food tech universe. Designed with full vendor autonomy, geolocation intelligence, real-time ticket escalation, and theatrical cinematic animations.",
        help_text="Description for developer / creator section."
    )

    # Customer Support Handling Settings
    support_phone = models.CharField(max_length=30, default="+91 98765 43210")
    support_email = models.EmailField(default="support@bhukkadverse.com")
    support_whatsapp = models.CharField(max_length=30, default="+91 9528055151")
    support_hours = models.CharField(max_length=100, default="06:00 AM - 12:00 AM Daily")
    emergency_notice = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        verbose_name = "Platform Setting"
        verbose_name_plural = "Platform Settings"

    def __str__(self):
        return f"Platform Settings ({self.curtain_headline})"

    @property
    def effective_curtain_video_url(self):
        if self.curtain_video_file:
            return self.curtain_video_file.url
        return self.curtain_video_url

    @property
    def effective_logo_url(self):
        if self.custom_logo_file:
            return self.custom_logo_file.url
        if self.custom_logo_url:
            return self.custom_logo_url
        return "/brand/logo-primary.png"

    @property
    def effective_hero_mascot_image_url(self):
        if self.hero_mascot_image_file:
            return self.hero_mascot_image_file.url
        if self.hero_mascot_image_url:
            return self.hero_mascot_image_url
        return "/brand/mascot-hero.jpg"

    @classmethod
    def get_settings(cls):
        fixed_id = uuid.UUID("00000000-0000-0000-0000-000000000001")
        obj, _ = cls.objects.get_or_create(id=fixed_id)
        return obj


class ShowcaseVideo(TimeStampedModel):
    """
    Homepage Video Showcase / Kitchen Reels Slider.
    Vendors and Admin can upload, manage, and delete culinary preview videos.
    """
    shop = models.ForeignKey(
        'shops.Shop',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='showcase_videos',
        help_text="Shop featured in this reel (null if platform-wide promo)."
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='showcase_videos',
        help_text="Optional specific dish highlighted in this video."
    )
    title = models.CharField(max_length=150)
    caption = models.TextField(blank=True, default='')
    video_url = models.URLField(max_length=500, blank=True, default='')
    video_file = models.FileField(upload_to='showcase_videos/', blank=True, null=True)
    thumbnail_url = models.URLField(max_length=500, blank=True, default='')
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_showcase_videos'
    )
    is_featured = models.BooleanField(default=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    display_order = models.PositiveIntegerField(default=0)
    views_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = "Showcase Video"
        verbose_name_plural = "Showcase Videos"

    def __str__(self):
        return f"{self.title} ({self.shop.name if self.shop else 'Platform'})"

    @property
    def resolved_video_url(self):
        if self.video_file:
            return self.video_file.url
        return self.video_url


class PlatformReview(TimeStampedModel):
    """
    Customer testimonial / platform-wide review for BHUKKAD VERSE.
    """
    author_name = models.CharField(max_length=120)
    author_role = models.CharField(max_length=80, default="Verified Foodie")
    city = models.CharField(max_length=80, default="Delhi NCR")
    rating = models.PositiveSmallIntegerField(default=5)
    headline = models.CharField(max_length=150)
    comment = models.TextField()
    is_featured = models.BooleanField(default=True, db_index=True)
    is_approved = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Platform Review"
        verbose_name_plural = "Platform Reviews"

    def __str__(self):
        return f"{self.author_name} ({self.rating}★) - {self.headline}"


class Coupon(TimeStampedModel):
    """
    Promotional discount voucher managed exclusively by platform administrators.
    """
    class DiscountType(models.TextChoices):
        FLAT = 'FLAT', 'Flat Amount (₹)'
        PERCENTAGE = 'PERCENTAGE', 'Percentage Discount (%)'

    code = models.CharField(max_length=30, unique=True, db_index=True)
    description = models.CharField(max_length=200, blank=True, default='')
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices, default=DiscountType.FLAT)
    discount_value = models.DecimalField(max_digits=8, decimal_places=2, help_text="Flat ₹ discount or percentage off")
    min_order_value = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    max_discount_amount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Max ₹ discount for percentage coupons")
    is_active = models.BooleanField(default=True, db_index=True)
    usage_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Coupon Voucher"
        verbose_name_plural = "Coupon Vouchers"

    def __str__(self):
        return f"{self.code} - {self.get_discount_type_display()} {self.discount_value} ({'Active' if self.is_active else 'Inactive'})"

