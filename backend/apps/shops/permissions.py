from rest_framework.permissions import BasePermission

class IsShopOwner(BasePermission):
    """
    Object-level permission to only allow the owner of the shop to view or edit it.
    """
    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and obj.owner == request.user)

class IsVendor(BasePermission):
    """
    Allows access only to authenticated users with role='VENDOR'.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_vendor)

class IsAdmin(BasePermission):
    """
    Allows access only to platform administrators (role='ADMIN', is_staff, or is_superuser).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_user)

class IsRider(BasePermission):
    """
    Allows access to authenticated delivery fleet partners (role='RIDER') or administrators.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'RIDER' or request.user.is_admin_user)
        )
