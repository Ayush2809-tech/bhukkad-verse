from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.db import transaction
from django.utils import timezone
from .models import Shop, ShopOperatingHour, ShopMenuCard, ShopReview
from .permissions import IsVendor, IsAdmin, IsShopOwner
from .serializers import (
    ShopPublicSerializer,
    ShopVendorSerializer,
    ShopApplySerializer,
    ShopAdminReviewSerializer,
    ShopOperatingHourSerializer,
    ShopPauseToggleSerializer,
    ShopMenuCardPublicSerializer,
    ShopMenuCardVendorSerializer,
    ShopMenuCardUploadSerializer,
    ShopReviewSerializer,
)
from .utils import calculate_haversine_distance, get_shop_live_status

# -------------------------------------------------------------
# 1. PUBLIC DISCOVERY ENDPOINTS (Customer Facing)
# -------------------------------------------------------------

class PublicShopListView(generics.ListAPIView):
    """
    GET /api/v1/shops/
    Public listing of approved, active shops.
    Supports filtering by search query `q` (name/description), `city`,
    and customer geographic coordinates (`lat`, `lng`).
    When coordinates are provided:
    - Calculates distance_km using Haversine formula
    - Determines is_deliverable status (distance_km <= delivery_radius_km)
    - Supports `deliverable_only=true` filter
    - Sorts deliverable shops first, ordered by proximity
    """
    serializer_class = ShopPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Shop.objects.filter(
            status=Shop.Status.APPROVED,
            is_active=True
        ).prefetch_related('operating_hours', 'menu_cards')

        q = self.request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) | Q(description__icontains=q)
            )
        city = self.request.query_params.get('city', '').strip()
        if city:
            queryset = queryset.filter(city__iexact=city)

        tier = self.request.query_params.get('tier', '').strip().upper()
        if tier:
            queryset = queryset.filter(tier=tier)

        lat_param = self.request.query_params.get('lat')
        lng_param = self.request.query_params.get('lng')
        deliverable_only = self.request.query_params.get('deliverable_only', '').lower() in ('true', '1', 'yes')

        if lat_param is not None and lng_param is not None:
            try:
                cust_lat = float(lat_param)
                cust_lng = float(lng_param)

                annotated_shops = []
                for shop in queryset:
                    distance = calculate_haversine_distance(
                        cust_lat,
                        cust_lng,
                        float(shop.latitude),
                        float(shop.longitude)
                    )
                    shop.annotated_distance_km = distance
                    shop.annotated_is_deliverable = distance <= float(shop.delivery_radius_km)

                    if deliverable_only and not shop.annotated_is_deliverable:
                        continue

                    annotated_shops.append(shop)

                # Sort deliverable shops first, then by ascending distance
                annotated_shops.sort(
                    key=lambda s: (not getattr(s, 'annotated_is_deliverable', False), getattr(s, 'annotated_distance_km', 999999))
                )
                return annotated_shops
            except (ValueError, TypeError):
                pass

        return queryset


class PublicShopDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/shops/{slug}/
    Retrieves public details for a single approved kitchen by its URL slug.
    Prefetches operating hours and menu cards to compute live status without N+1 queries.
    """
    serializer_class = ShopPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Shop.objects.filter(
            status=Shop.Status.APPROVED,
            is_active=True
        ).prefetch_related('operating_hours', 'menu_cards')


# -------------------------------------------------------------
# 2. VENDOR DASHBOARD & APPLICATION ENDPOINTS (Vendor Facing)
# -------------------------------------------------------------

class VendorShopView(APIView):
    """
    GET /api/v1/vendor/shop/
    Retrieve the authenticated vendor's shop application and details.

    POST /api/v1/vendor/shop/
    Submit a new shop application (enters PENDING status).

    PATCH /api/v1/vendor/shop/
    Update shop information. If rejected, setting `resubmit=True` resets status to PENDING.
    """
    permission_classes = [IsVendor]

    def get(self, request):
        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response(
                {"detail": "No shop application found for this vendor account.", "shop": None},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ShopVendorSerializer(shop)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        if hasattr(request.user, 'shop'):
            return Response(
                {"detail": "A shop application already exists for this vendor account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = ShopApplySerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            shop = serializer.save()
            return Response(
                ShopVendorSerializer(shop).data,
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request):
        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response(
                {"detail": "No shop application found to update."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ShopVendorSerializer(shop, data=request.data, partial=True)
        if serializer.is_valid():
            updated_shop = serializer.save()
            # If rejected and requested to resubmit
            if request.data.get('resubmit') is True and shop.status == Shop.Status.REJECTED:
                updated_shop.status = Shop.Status.PENDING
                updated_shop.admin_review_notes = ""
                updated_shop.save(update_fields=['status', 'admin_review_notes'])

            return Response(ShopVendorSerializer(updated_shop).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorOperatingHoursView(APIView):
    """
    GET /api/v1/vendor/operating-hours/
    Retrieve weekly operating hours (Monday through Sunday) for the authenticated vendor's kitchen.

    PUT /api/v1/vendor/operating-hours/
    Bulk update/save weekly operating hours for the authenticated vendor's kitchen.
    Validates boundary conditions, non-duplicate weekdays, and overnight schedules.
    """
    permission_classes = [IsVendor]

    def get_shop(self, request):
        try:
            return request.user.shop
        except Shop.DoesNotExist:
            return None

    def get(self, request):
        shop = self.get_shop(request)
        if not shop:
            return Response(
                {"detail": "No shop found for this vendor account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Guarantee all 7 weekdays exist for the vendor
        existing = {oh.weekday: oh for oh in shop.operating_hours.all()}
        if len(existing) < 7:
            for weekday in range(7):
                if weekday not in existing:
                    ShopOperatingHour.objects.create(
                        shop=shop,
                        weekday=weekday,
                        is_closed=False,
                        opening_time=shop.opening_time,
                        closing_time=shop.closing_time,
                    )

        hours = shop.operating_hours.all().order_by('weekday')
        serializer = ShopOperatingHourSerializer(hours, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        shop = self.get_shop(request)
        if not shop:
            return Response(
                {"detail": "No shop found for this vendor account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        data = request.data
        if not isinstance(data, list):
            return Response(
                {"detail": "Expected a list of operating hour schedules."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if len(data) == 0:
            return Response(
                {"detail": "Schedule list cannot be empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        weekdays_seen = set()
        validated_items = []

        for item in data:
            w = item.get('weekday')
            if w is None or not isinstance(w, int) or w < 0 or w > 6:
                return Response(
                    {"detail": f"Invalid weekday '{w}'. Weekdays must be integers between 0 (Monday) and 6 (Sunday)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if w in weekdays_seen:
                return Response(
                    {"detail": f"Duplicate schedule entry for weekday {w}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            weekdays_seen.add(w)

            ser = ShopOperatingHourSerializer(data=item)
            if not ser.is_valid():
                return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
            validated_items.append((w, ser.validated_data))

        # Atomically update schedule entries
        with transaction.atomic():
            for weekday, valid_data in validated_items:
                is_closed = valid_data.get('is_closed', False)
                ShopOperatingHour.objects.update_or_create(
                    shop=shop,
                    weekday=weekday,
                    defaults={
                        'is_closed': is_closed,
                        'opening_time': valid_data.get('opening_time') if not is_closed else None,
                        'closing_time': valid_data.get('closing_time') if not is_closed else None,
                    }
                )

        updated_hours = shop.operating_hours.all().order_by('weekday')
        return Response(
            ShopOperatingHourSerializer(updated_hours, many=True).data,
            status=status.HTTP_200_OK,
        )


class VendorToggleOrdersView(APIView):
    """
    POST /api/v1/vendor/shop/toggle-orders/
    Enables vendors to pause or resume accepting live customer orders.
    Stores pause reason and records update timestamp.
    """
    permission_classes = [IsVendor]

    def post(self, request):
        try:
            shop = request.user.shop
        except Shop.DoesNotExist:
            return Response(
                {"detail": "No shop found for this vendor account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ShopPauseToggleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        is_accepting = serializer.validated_data['is_accepting_orders']
        pause_reason = (
            serializer.validated_data.get('order_pause_reason', '').strip() or
            serializer.validated_data.get('pause_reason', '').strip()
        )

        shop.is_accepting_orders = is_accepting
        if not is_accepting:
            shop.order_pause_reason = pause_reason or "Kitchen temporarily paused."
            shop.order_paused_at = timezone.now()
        else:
            shop.order_pause_reason = ""
            shop.order_paused_at = None

        shop.save(update_fields=['is_accepting_orders', 'order_pause_reason', 'order_paused_at', 'updated_at'])

        return Response(
            {
                "message": "Order acceptance resumed." if is_accepting else "Orders paused successfully.",
                "is_accepting_orders": shop.is_accepting_orders,
                "order_pause_reason": shop.order_pause_reason,
                "order_paused_at": shop.order_paused_at,
                "shop": ShopVendorSerializer(shop).data,
            },
            status=status.HTTP_200_OK,
        )


# -------------------------------------------------------------
# 3. PLATFORM ADMIN WORKFLOW (Admin Facing)
# -------------------------------------------------------------

class AdminShopListView(generics.ListAPIView):
    """
    GET /api/v1/admin/shops/
    Platform admin endpoint to list all vendor shops across all statuses.
    Filterable by `?status=PENDING` or `?status=APPROVED` or `?status=REJECTED`.
    """
    serializer_class = ShopVendorSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        queryset = Shop.objects.all().select_related('owner').prefetch_related('operating_hours')
        status_param = self.request.query_params.get('status', '').strip().upper()
        if status_param in Shop.Status.values:
            queryset = queryset.filter(status=status_param)

        q = self.request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q) |
                Q(city__icontains=q) |
                Q(owner__username__icontains=q) |
                Q(owner__email__icontains=q)
            )

        return queryset


class AdminShopApproveView(APIView):
    """
    POST /api/v1/admin/shops/{id}/approve/
    Platform administrator approves a pending or rejected shop.
    Records audit log entry for regulatory and operational tracking.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            shop = Shop.objects.get(pk=pk)
        except Shop.DoesNotExist:
            return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ShopAdminReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        shop.status = Shop.Status.APPROVED
        shop.admin_review_notes = serializer.validated_data.get('admin_review_notes', '')
        shop.save(update_fields=['status', 'admin_review_notes', 'updated_at'])

        from apps.authentication.views import record_audit_log
        record_audit_log(
            admin_user=request.user,
            action='SHOP_APPROVED',
            target_type='SHOP',
            target_id=str(shop.id),
            target_repr=shop.name,
            details=f"Approved shop. Review notes: {shop.admin_review_notes}",
            request=request
        )

        return Response(
            {
                "message": f"Shop '{shop.name}' has been successfully approved.",
                "shop": ShopVendorSerializer(shop).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminShopRejectView(APIView):
    """
    POST /api/v1/admin/shops/{id}/reject/
    Platform administrator rejects a vendor application with review notes.
    Records audit log entry.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            shop = Shop.objects.get(pk=pk)
        except Shop.DoesNotExist:
            return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ShopAdminReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        notes = serializer.validated_data.get('admin_review_notes', '').strip()
        if not notes:
            return Response(
                {"admin_review_notes": ["Please provide a reason or constructive feedback for rejection."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shop.status = Shop.Status.REJECTED
        shop.admin_review_notes = notes
        shop.save(update_fields=['status', 'admin_review_notes', 'updated_at'])

        from apps.authentication.views import record_audit_log
        record_audit_log(
            admin_user=request.user,
            action='SHOP_REJECTED',
            target_type='SHOP',
            target_id=str(shop.id),
            target_repr=shop.name,
            details=f"Rejected shop. Feedback: {notes}",
            request=request
        )

        return Response(
            {
                "message": f"Shop '{shop.name}' application has been rejected.",
                "shop": ShopVendorSerializer(shop).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminShopSuspendView(APIView):
    """
    POST /api/v1/admin/shops/{id}/suspend/
    Platform administrator temporarily suspends an approved shop.
    Immediately pauses live customer order intake.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            shop = Shop.objects.get(pk=pk)
        except Shop.DoesNotExist:
            return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        reason = request.data.get('reason', '').strip()
        shop.status = Shop.Status.SUSPENDED
        shop.is_accepting_orders = False
        shop.order_pause_reason = reason or "Kitchen suspended by platform administration."
        shop.order_paused_at = timezone.now()
        if reason:
            shop.admin_review_notes = reason
        shop.save(update_fields=['status', 'is_accepting_orders', 'order_pause_reason', 'order_paused_at', 'admin_review_notes', 'updated_at'])

        from apps.authentication.views import record_audit_log
        record_audit_log(
            admin_user=request.user,
            action='SHOP_SUSPENDED',
            target_type='SHOP',
            target_id=str(shop.id),
            target_repr=shop.name,
            details=f"Suspended shop. Reason: {reason}",
            request=request
        )

        return Response(
            {
                "message": f"Shop '{shop.name}' has been suspended.",
                "shop": ShopVendorSerializer(shop).data,
            },
            status=status.HTTP_200_OK,
        )


class AdminShopReactivateView(APIView):
    """
    POST /api/v1/admin/shops/{id}/reactivate/
    Platform administrator restores a suspended shop back to APPROVED status.
    """
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            shop = Shop.objects.get(pk=pk)
        except Shop.DoesNotExist:
            return Response({"detail": "Shop not found."}, status=status.HTTP_404_NOT_FOUND)

        shop.status = Shop.Status.APPROVED
        shop.is_accepting_orders = True
        shop.order_pause_reason = ""
        shop.order_paused_at = None
        shop.save(update_fields=['status', 'is_accepting_orders', 'order_pause_reason', 'order_paused_at', 'updated_at'])

        from apps.authentication.views import record_audit_log
        record_audit_log(
            admin_user=request.user,
            action='SHOP_REACTIVATED',
            target_type='SHOP',
            target_id=str(shop.id),
            target_repr=shop.name,
            details="Restored suspended shop to approved status.",
            request=request
        )

        return Response(
            {
                "message": f"Shop '{shop.name}' has been reactivated.",
                "shop": ShopVendorSerializer(shop).data,
            },
            status=status.HTTP_200_OK,
        )


# -------------------------------------------------------------
# 5. VENDOR MENU CARD MANAGEMENT ENDPOINTS (Increment 2B)
# -------------------------------------------------------------

class VendorMenuCardListCreateView(APIView):
    """
    GET /api/v1/vendor/menu-cards/
    List all uploaded menu cards for the authenticated vendor's shop.

    POST /api/v1/vendor/menu-cards/
    Upload a new original menu card (PDF, JPEG, PNG) via multipart/form-data.
    """
    permission_classes = [IsVendor]
    parser_classes = [MultiPartParser, FormParser]

    def get_shop(self, request):
        if hasattr(request.user, 'shop'):
            return request.user.shop
        return None

    def get(self, request):
        shop = self.get_shop(request)
        if not shop:
            return Response(
                {"detail": "No shop found for this vendor account."},
                status=status.HTTP_404_NOT_FOUND,
            )
        menu_cards = shop.menu_cards.all().order_by('-version', '-created_at')
        serializer = ShopMenuCardVendorSerializer(menu_cards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        shop = self.get_shop(request)
        if not shop:
            return Response(
                {"detail": "No shop found for this vendor account."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ShopMenuCardUploadSerializer(
            data=request.data,
            context={'shop': shop, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        menu_card = serializer.save()
        return Response(
            ShopMenuCardVendorSerializer(menu_card).data,
            status=status.HTTP_201_CREATED,
        )


class VendorMenuCardDetailView(APIView):
    """
    GET /api/v1/vendor/menu-cards/<uuid:pk>/
    Retrieve metadata for a specific uploaded menu card.

    DELETE /api/v1/vendor/menu-cards/<uuid:pk>/
    Safely delete a menu card and remove its file from storage.
    """
    permission_classes = [IsVendor]

    def get_shop(self, request):
        if hasattr(request.user, 'shop'):
            return request.user.shop
        return None

    def get(self, request, pk):
        shop = self.get_shop(request)
        if not shop:
            return Response({"detail": "No shop found for this vendor account."}, status=status.HTTP_404_NOT_FOUND)
        card = get_object_or_404(ShopMenuCard, pk=pk, shop=shop)
        return Response(ShopMenuCardVendorSerializer(card).data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        shop = self.get_shop(request)
        if not shop:
            return Response({"detail": "No shop found for this vendor account."}, status=status.HTTP_404_NOT_FOUND)
        card = get_object_or_404(ShopMenuCard, pk=pk, shop=shop)
        card.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VendorMenuCardActivateView(APIView):
    """
    POST /api/v1/vendor/menu-cards/<uuid:pk>/activate/
    Activate a menu card as the current published version, atomically deactivating older versions.
    """
    permission_classes = [IsVendor]

    def post(self, request, pk):
        if not hasattr(request.user, 'shop'):
            return Response({"detail": "No shop found for this vendor account."}, status=status.HTTP_404_NOT_FOUND)
        card = get_object_or_404(ShopMenuCard, pk=pk, shop=request.user.shop)
        card.activate()
        return Response(
            {
                "message": f"Menu card v{card.version} is now the active menu.",
                "menu_card": ShopMenuCardVendorSerializer(card).data,
            },
            status=status.HTTP_200_OK,
        )


class VendorMenuCardArchiveView(APIView):
    """
    POST /api/v1/vendor/menu-cards/<uuid:pk>/archive/
    Archive an active menu card version (sets is_active=False).
    """
    permission_classes = [IsVendor]

    def post(self, request, pk):
        if not hasattr(request.user, 'shop'):
            return Response({"detail": "No shop found for this vendor account."}, status=status.HTTP_404_NOT_FOUND)
        card = get_object_or_404(ShopMenuCard, pk=pk, shop=request.user.shop)
        card.archive()
        return Response(
            {
                "message": f"Menu card v{card.version} has been archived.",
                "menu_card": ShopMenuCardVendorSerializer(card).data,
            },
            status=status.HTTP_200_OK,
        )


class PublicShopMenuCardView(APIView):
    """
    GET /api/v1/shops/<slug:slug>/menu-card/
    Public storefront endpoint returning the active original menu card for an approved shop.
    Returns 404 if no menu card is active.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        shop = get_object_or_404(Shop, slug=slug, status=Shop.Status.APPROVED, is_active=True)
        active_card = shop.active_menu_card
        if not active_card:
            return Response(
                {"detail": "No active original menu card available for this restaurant."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(ShopMenuCardPublicSerializer(active_card).data, status=status.HTTP_200_OK)


class PublicShopReviewsView(APIView):
    """
    GET /api/v1/shops/<slug:slug>/reviews/ - List approved reviews for this shop
    POST /api/v1/shops/<slug:slug>/reviews/ - Submit review for this shop
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        shop = get_object_or_404(Shop, slug=slug, status=Shop.Status.APPROVED)
        reviews = shop.reviews.filter(is_approved=True).order_by('-created_at')[:30]
        serializer = ShopReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug):
        shop = get_object_or_404(Shop, slug=slug, status=Shop.Status.APPROVED)
        customer_name = request.data.get('customer_name', '').strip() or 'Food Lover'
        product_name = request.data.get('product_name', '').strip()
        comment = request.data.get('comment', '').strip()
        if not comment:
            return Response({'detail': 'Review comment is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = max(1, min(5, int(request.data.get('rating', 5))))
        except (ValueError, TypeError):
            rating = 5

        customer_user = request.user if request.user.is_authenticated else None

        review = ShopReview.objects.create(
            shop=shop,
            product_name=product_name,
            customer=customer_user,
            customer_name=customer_name,
            rating=rating,
            comment=comment,
            is_approved=True
        )
        return Response(ShopReviewSerializer(review).data, status=status.HTTP_201_CREATED)


class VendorShopReviewsView(APIView):
    """
    GET /api/v1/vendor/reviews/ - Vendor views all reviews for their shop
    """
    permission_classes = [IsVendor]

    def get(self, request):
        if not hasattr(request.user, 'shop'):
            return Response({'detail': 'No shop registered.'}, status=status.HTTP_400_BAD_REQUEST)
        reviews = request.user.shop.reviews.all().order_by('-created_at')
        return Response(ShopReviewSerializer(reviews, many=True).data, status=status.HTTP_200_OK)


