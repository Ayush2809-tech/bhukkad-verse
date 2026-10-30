from decimal import Decimal
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.text import slugify
from apps.core.models import TimeStampedModel
from apps.shops.models import Shop

class Category(TimeStampedModel):
    """
    Vendor-specific menu category (e.g. Veg Pizzas, Burgers, Shakes, Pasta).
    Belongs strictly to an individual shop.
    """
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='categories',
        help_text="The kitchen to which this menu category belongs."
    )
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120)
    description = models.TextField(blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['display_order', 'name']
        unique_together = ('shop', 'slug')
        indexes = [
            models.Index(fields=['shop', 'is_active', 'display_order']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Category.objects.filter(shop=self.shop, slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.shop.name})"


class AddonGroup(TimeStampedModel):
    """
    Customization group defined by a shop (e.g. 'Crust Customization', 'Extra Toppings').
    Attached to products to allow add-on selections with selection limits.
    """
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='addon_groups'
    )
    name = models.CharField(max_length=100)
    min_selections = models.PositiveIntegerField(default=0, help_text="0 means selection is optional.")
    max_selections = models.PositiveIntegerField(default=1, help_text="1 for single choice, >1 for multiple.")
    is_required = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['display_order', 'name']
        indexes = [
            models.Index(fields=['shop', 'is_active', 'display_order']),
        ]

    def clean(self):
        if self.min_selections > self.max_selections:
            raise ValidationError("Minimum selections cannot exceed maximum selections.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} [{self.shop.name}]"


class AddonItem(TimeStampedModel):
    """
    Individual add-on choice within an AddonGroup (e.g. 'Cheese Burst' ₹60, 'Jalapenos' ₹35).
    """
    group = models.ForeignKey(
        AddonGroup,
        on_delete=models.CASCADE,
        related_name='items'
    )
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    is_available = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']

    def clean(self):
        if self.price is not None and Decimal(str(self.price)) < 0:
            raise ValidationError("Add-on price cannot be negative.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} (+₹{self.price})"


class Product(TimeStampedModel):
    """
    Food item offered by a shop under a specific category.
    Supports direct pricing or configurable size variants, plus optional add-on groups.
    """
    class DietaryType(models.TextChoices):
        VEG = 'VEG', 'Vegetarian'
        NON_VEG = 'NON_VEG', 'Non-Vegetarian'
        VEGAN = 'VEGAN', 'Vegan'

    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='products'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='products'
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180)
    description = models.TextField(blank=True)
    base_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0.00,
        help_text="Standard price or starting price if variants exist."
    )
    compare_at_price = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional crossed-out original price for discount display."
    )
    image = models.ImageField(upload_to='products/images/', null=True, blank=True)
    image_url = models.URLField(blank=True, help_text="Direct URL fallback or CDN image.")
    dietary_type = models.CharField(
        max_length=20,
        choices=DietaryType.choices,
        default=DietaryType.VEG,
        db_index=True
    )
    preparation_time_minutes = models.PositiveIntegerField(default=20)
    is_available = models.BooleanField(
        default=True,
        help_text="In-stock vs sold-out daily toggle."
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Soft archival toggle. Inactive products are hidden from public."
    )
    display_order = models.PositiveIntegerField(default=0)

    # Variant and 3D Flags
    has_variants = models.BooleanField(
        default=False,
        help_text="True if this product offers multiple sizes (Regular, Medium, Large)."
    )
    has_3d_model = models.BooleanField(
        default=False,
        help_text="True if this flagship item offers a selective 3D presentation."
    )
    model_3d_url = models.URLField(blank=True, help_text="Path to optimized GLB 3D model asset.")

    addon_groups = models.ManyToManyField(
        AddonGroup,
        related_name='products',
        blank=True,
        help_text="Customization groups applicable to this product."
    )

    class Meta:
        ordering = ['display_order', 'name']
        unique_together = ('shop', 'slug')
        indexes = [
            models.Index(fields=['shop', 'category', 'is_active', 'is_available']),
            models.Index(fields=['dietary_type']),
        ]

    def clean(self):
        if self.base_price is not None and Decimal(str(self.base_price)) < 0:
            raise ValidationError("Product price cannot be negative.")
        # Ensure category belongs to the same shop
        if self.category_id and self.category.shop_id != self.shop_id:
            raise ValidationError("The selected category does not belong to this shop.")

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1
            while Product.objects.filter(shop=self.shop, slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - ₹{self.base_price} ({self.shop.name})"


class ProductVariant(TimeStampedModel):
    """
    Configurable variant for a product (e.g. Regular ₹99, Medium ₹179, Large ₹299).
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )
    name = models.CharField(max_length=100, help_text="Size or variant name (e.g. Regular, Medium, Large).")
    price = models.DecimalField(max_digits=8, decimal_places=2)
    is_default = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'price']
        unique_together = ('product', 'name')

    def clean(self):
        if self.price is not None and Decimal(str(self.price)) < 0:
            raise ValidationError("Variant price cannot be negative.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        if not self.product.has_variants:
            self.product.has_variants = True
            self.product.save(update_fields=['has_variants', 'updated_at'])

    def __str__(self):
        return f"{self.product.name} - {self.name} (₹{self.price})"
