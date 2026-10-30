import uuid
from django.contrib.auth.models import AbstractUser, UserManager as BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """
    Custom manager for User with normalized lowercased email addresses.
    Enforces email presence and case-insensitive consistency.
    """
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not email:
            raise ValueError('An email address is required for all user accounts.')
        email = self.normalize_email(email).strip().lower()
        extra_fields.setdefault('role', User.Role.CUSTOMER)
        return super().create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        if extra_fields.get('role') != User.Role.ADMIN:
            raise ValueError('Superuser must have role=ADMIN.')
        return super().create_superuser(username, email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for BHUKKAD VERSE.
    Supports role-based isolation (Customer, Vendor, Admin).
    Enforces normalized case-insensitive email uniqueness at the database level.
    """
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        VENDOR = 'VENDOR', 'Vendor / Shop Owner'
        ADMIN = 'ADMIN', 'Platform Administrator'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField('email address', unique=True, db_index=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CUSTOMER,
        db_index=True,
        help_text="Platform role determining dashboard and permission access."
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    objects = UserManager()

    @property
    def is_vendor(self) -> bool:
        return self.role == self.Role.VENDOR

    @property
    def is_customer(self) -> bool:
        return self.role == self.Role.CUSTOMER

    @property
    def is_admin_user(self) -> bool:
        return self.role == self.Role.ADMIN or self.is_superuser or self.is_staff

    def clean(self):
        super().clean()
        if self.email:
            self.email = self.email.strip().lower()

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        if self.username:
            self.username = self.username.strip()
        # Ensure superusers automatically have ADMIN role
        if self.is_superuser and self.role != self.Role.ADMIN:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} [{self.get_role_display()}]"


class AdminAuditLog(models.Model):
    """
    Audit trail recording significant administrative and moderation actions
    (e.g., vendor approval, rejection, suspension, reactivation, role alterations).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    admin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs_conducted'
    )
    action = models.CharField(max_length=50, db_index=True)
    target_type = models.CharField(max_length=50)
    target_id = models.CharField(max_length=100)
    target_repr = models.CharField(max_length=255)
    details = models.TextField(blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        admin_name = self.admin.username if self.admin else "System"
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {admin_name}: {self.action} on {self.target_repr}"
