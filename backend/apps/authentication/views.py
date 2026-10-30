from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import AdminAuditLog
from .permissions import IsPlatformAdmin
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    VendorRegistrationSerializer,
    CustomTokenObtainPairSerializer,
    AdminUserUpdateSerializer,
    AdminAuditLogSerializer,
)

User = get_user_model()


def record_audit_log(admin_user, action, target_type, target_id, target_repr, details="", request=None):
    """
    Helper to reliably record administrative actions with client IP and timestamps.
    """
    ip = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
    AdminAuditLog.objects.create(
        admin=admin_user if admin_user and admin_user.is_authenticated else None,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        target_repr=str(target_repr)[:255],
        details=details,
        ip_address=ip
    )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Issues access and refresh JWT tokens alongside authenticated user profile.
    Accepts either username or email address as the primary identifier.
    """
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Registers a new Customer or Vendor with full password hashing and returns JWT tokens.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "Registration successful.",
                    "user": UserSerializer(user).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorRegisterView(APIView):
    """
    POST /api/v1/auth/vendor-register/
    Unified atomic onboarding endpoint for restaurant/shop vendors.
    Atomically registers the Vendor User account AND provisions their Shop in PENDING review state.
    Eliminates partial failures and duplicate email issues upon retry.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VendorRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            from apps.shops.serializers import ShopVendorSerializer
            return Response(
                {
                    "message": "Vendor registration and shop application submitted successfully.",
                    "user": UserSerializer(user).data,
                    "shop": ShopVendorSerializer(user.shop).data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Safe token invalidation endpoint. Accepts refresh token for cleanup.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass
        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def auth_status(request):
    """
    GET /api/v1/auth/status/
    Returns whether the client has an active authenticated session.
    """
    if request.user.is_authenticated:
        return Response(
            {"authenticated": True, "user": UserSerializer(request.user).data}
        )
    return Response({"authenticated": False, "user": None})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me_view(request):
    """
    GET/PATCH /api/v1/auth/me/
    Retrieve or update profile details for the authenticated user.
    """
    user = request.user
    if request.method == "PATCH":
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(UserSerializer(user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response(UserSerializer(user).data)


# ---------------------------------------------------------------------
# PLATFORM ADMIN ENDPOINTS (Admin Role Enforced)
# ---------------------------------------------------------------------

class AdminOverviewView(APIView):
    """
    GET /api/v1/admin/overview/
    Returns real database statistics across users and shops.
    Never fabricates metrics.
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        from apps.shops.models import Shop

        users_total = User.objects.count()
        customers_count = User.objects.filter(role=User.Role.CUSTOMER).count()
        vendors_count = User.objects.filter(role=User.Role.VENDOR).count()
        admins_count = User.objects.filter(role=User.Role.ADMIN).count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()

        shops_total = Shop.objects.count()
        pending_shops = Shop.objects.filter(status=Shop.Status.PENDING).count()
        approved_shops = Shop.objects.filter(status=Shop.Status.APPROVED).count()
        rejected_shops = Shop.objects.filter(status=Shop.Status.REJECTED).count()
        suspended_shops = Shop.objects.filter(status=Shop.Status.SUSPENDED).count()

        return Response({
            "users": {
                "total": users_total,
                "customers": customers_count,
                "vendors": vendors_count,
                "admins": admins_count,
                "active": active_users,
                "inactive": inactive_users,
            },
            "shops": {
                "total": shops_total,
                "pending": pending_shops,
                "approved": approved_shops,
                "rejected": rejected_shops,
                "suspended": suspended_shops,
            }
        })


class AdminUsersListView(generics.ListAPIView):
    """
    GET /api/v1/admin/users/
    Lists all platform users with filtering by role and active status, and text search.
    """
    permission_classes = [IsPlatformAdmin]
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')
        role_param = self.request.query_params.get('role', '').strip().upper()
        if role_param in User.Role.values:
            queryset = queryset.filter(role=role_param)

        active_param = self.request.query_params.get('is_active')
        if active_param is not None:
            if active_param.lower() in ('true', '1'):
                queryset = queryset.filter(is_active=True)
            elif active_param.lower() in ('false', '0'):
                queryset = queryset.filter(is_active=False)

        q = self.request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(username__icontains=q) |
                Q(email__icontains=q) |
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(phone__icontains=q)
            )

        return queryset


class AdminUserDetailView(APIView):
    """
    GET /api/v1/admin/users/{id}/
    PATCH /api/v1/admin/users/{id}/
    Retrieves user profile and allows updating user status (is_active) or role.
    Prevents self-deactivation and privilege escalation.
    """
    permission_classes = [IsPlatformAdmin]

    def get_object(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(UserSerializer(user).data)

    def patch(self, request, pk):
        target_user = self.get_object(pk)
        if not target_user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Protection: Prevent admin from deactivating their own active account
        new_active = request.data.get('is_active')
        if new_active is False and str(request.user.id) == str(target_user.id):
            return Response(
                {"detail": "Self-deactivation is prohibited. Another administrator must modify this account."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Protection: Prevent non-superusers from modifying superuser accounts
        if target_user.is_superuser and not request.user.is_superuser:
            return Response(
                {"detail": "Superuser accounts can only be modified by a superuser."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = AdminUserUpdateSerializer(target_user, data=request.data, partial=True)
        if serializer.is_valid():
            updated_user = serializer.save()

            # Record audit log
            changed_fields = list(serializer.validated_data.keys())
            record_audit_log(
                admin_user=request.user,
                action='USER_UPDATED',
                target_type='USER',
                target_id=str(updated_user.id),
                target_repr=f"{updated_user.username} ({updated_user.email})",
                details=f"Modified fields: {', '.join(changed_fields)}. Active: {updated_user.is_active}, Role: {updated_user.role}",
                request=request
            )

            return Response(UserSerializer(updated_user).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminAuditLogsView(generics.ListAPIView):
    """
    GET /api/v1/admin/audit-logs/
    Returns recent administrative actions for transparency and compliance.
    """
    permission_classes = [IsPlatformAdmin]
    serializer_class = AdminAuditLogSerializer

    def get_queryset(self):
        return AdminAuditLog.objects.select_related('admin').all().order_by('-created_at')[:100]
