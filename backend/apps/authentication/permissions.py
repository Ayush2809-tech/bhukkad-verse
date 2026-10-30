from rest_framework.permissions import BasePermission

class IsCustomerUser(BasePermission):
    """
    Allows access only to authenticated users with the CUSTOMER role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_customer
        )

class IsVendorUser(BasePermission):
    """
    Allows access only to authenticated users with the VENDOR role.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_vendor
        )

class IsPlatformAdmin(BasePermission):
    """
    Allows access only to platform administrators (ADMIN role, superuser, or staff).
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            request.user.is_admin_user
        )
