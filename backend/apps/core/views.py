from decimal import Decimal
from django.db import connection
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.authentication.permissions import IsPlatformAdmin
from apps.shops.permissions import IsVendor
from apps.shops.models import Shop
from apps.products.models import Product
from apps.products.serializers import ProductVendorSerializer
from .models import PlatformSettings, ShowcaseVideo, PlatformReview, Coupon
from .serializers import (
    PlatformSettingsSerializer,
    ShowcaseVideoPublicSerializer,
    ShowcaseVideoManageSerializer,
    PlatformReviewSerializer,
    CouponSerializer,
)


def get_vendor_shop_or_none(request):
    if not hasattr(request.user, 'shop'):
        return None
    return request.user.shop


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Foundational health check endpoint.
    Verifies that the API service is alive and can query the database.
    """
    db_ok = True
    db_error = None
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
    except Exception as exc:
        db_ok = False
        db_error = str(exc)

    payload = {
        "status": "healthy" if db_ok else "unhealthy",
        "brand": "BHUKKAD VERSE",
        "tagline": "YOUR CRAVINGS. YOUR UNIVERSE.",
        "timestamp": timezone.now().isoformat(),
        "database": {
            "connected": db_ok,
            "engine": connection.settings_dict.get('ENGINE', '').split('.')[-1],
            "error": db_error,
        },
        "version": "1.0.0-foundation",
    }

    status_code = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(payload, status=status_code)


class PlatformSettingsPublicView(APIView):
    """
    Public endpoint to fetch current entrance curtain configuration,
    brand quotes, and live customer support contacts.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        settings_obj = PlatformSettings.get_settings()
        serializer = PlatformSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminPlatformSettingsView(APIView):
    """
    Admin-only endpoint to update entrance curtain video URL, headline,
    tagline, quote, and customer support desk channels in real-time.
    Supports direct video file uploads from device.
    """
    permission_classes = [IsPlatformAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        settings_obj = PlatformSettings.get_settings()
        serializer = PlatformSettingsSerializer(settings_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        settings_obj = PlatformSettings.get_settings()
        serializer = PlatformSettingsSerializer(settings_obj, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PublicShowcaseVideosView(APIView):
    """
    GET /api/v1/core/showcase-videos/
    Returns active featured videos for the front-page video showcase slider.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        videos = (
            ShowcaseVideo.objects.filter(is_active=True, is_featured=True)
            .select_related('shop', 'product')
            .order_by('display_order', '-created_at')
        )
        serializer = ShowcaseVideoPublicSerializer(videos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class VendorShowcaseVideoListCreateView(APIView):
    """
    GET /api/v1/vendor/showcase-videos/ - List authenticated vendor's videos
    POST /api/v1/vendor/showcase-videos/ - Upload/create video for their shop
    """
    permission_classes = [IsVendor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        shop = get_vendor_shop_or_none(request)
        if not shop:
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)
        videos = ShowcaseVideo.objects.filter(shop=shop).select_related('shop', 'product')
        serializer = ShowcaseVideoManageSerializer(videos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        shop = get_vendor_shop_or_none(request)
        if not shop:
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ShowcaseVideoManageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            video = serializer.save(shop=shop, uploaded_by=request.user)
            return Response(ShowcaseVideoManageSerializer(video, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorShowcaseVideoDetailView(APIView):
    """
    PATCH /api/v1/vendor/showcase-videos/<pk>/ - Edit video
    DELETE /api/v1/vendor/showcase-videos/<pk>/ - Delete video
    """
    permission_classes = [IsVendor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, request, pk):
        shop = get_vendor_shop_or_none(request)
        if not shop:
            return None
        return get_object_or_404(ShowcaseVideo.objects.filter(shop=shop), pk=pk)

    def patch(self, request, pk):
        video = self.get_object(request, pk)
        if not video:
            return Response({"detail": "Showcase video not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ShowcaseVideoManageSerializer(video, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        video = self.get_object(request, pk)
        if not video:
            return Response({"detail": "Showcase video not found."}, status=status.HTTP_404_NOT_FOUND)
        video.delete()
        return Response({"message": "Showcase video deleted successfully."}, status=status.HTTP_200_OK)


class AdminShowcaseVideoListCreateView(APIView):
    """
    GET /api/v1/admin/showcase-videos/ - List all showcase videos
    POST /api/v1/admin/showcase-videos/ - Admin creates video
    """
    permission_classes = [IsPlatformAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        videos = ShowcaseVideo.objects.all().select_related('shop', 'product')
        serializer = ShowcaseVideoManageSerializer(videos, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ShowcaseVideoManageSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            video = serializer.save(uploaded_by=request.user)
            return Response(ShowcaseVideoManageSerializer(video, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminShowcaseVideoDetailView(APIView):
    """
    PATCH /api/v1/admin/showcase-videos/<pk>/ - Admin edits/toggles
    DELETE /api/v1/admin/showcase-videos/<pk>/ - Admin deletes
    """
    permission_classes = [IsPlatformAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, request, pk):
        return get_object_or_404(ShowcaseVideo, pk=pk)

    def patch(self, request, pk):
        video = self.get_object(request, pk)
        serializer = ShowcaseVideoManageSerializer(video, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        video = self.get_object(request, pk)
        video.delete()
        return Response({"message": "Showcase video deleted by administrator."}, status=status.HTTP_200_OK)


class AdminProductListView(APIView):
    """
    GET /api/v1/admin/products/ - List all dishes with shop info
    POST /api/v1/admin/products/ - Admin directly adds dish to any kitchen
    """
    permission_classes = [IsPlatformAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        products = Product.objects.all().select_related('shop', 'category').prefetch_related('variants')
        shop_id = request.query_params.get('shop')
        if shop_id:
            products = products.filter(shop_id=shop_id)
        serializer = ProductVendorSerializer(products, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        shop_id = request.data.get('shop_id')
        if not shop_id:
            return Response({"shop_id": ["Please specify the target kitchen for this dish."]}, status=status.HTTP_400_BAD_REQUEST)
        shop = get_object_or_404(Shop, pk=shop_id)

        category_id = request.data.get('category')
        category_name = request.data.get('category_name')
        
        category = None
        if category_id:
            category = Category.objects.filter(shop=shop, pk=category_id).first()
        if not category and category_name:
            category, _ = Category.objects.get_or_create(shop=shop, name=category_name)
        if not category:
            category = Category.objects.filter(shop=shop).first()
            if not category:
                category = Category.objects.create(shop=shop, name="Chef Specials")

        data = request.data.copy()
        data['category'] = str(category.id)
        serializer = ProductVendorSerializer(data=data)
        if serializer.is_valid():
            prod = serializer.save(shop=shop)
            return Response(ProductVendorSerializer(prod).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminProductDetailView(APIView):
    """
    DELETE /api/v1/admin/products/<pk>/ - Admin deletes dish
    PATCH /api/v1/admin/products/<pk>/ - Admin updates dish
    """
    permission_classes = [IsPlatformAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, request, pk):
        return get_object_or_404(Product, pk=pk)

    def delete(self, request, pk):
        prod = self.get_object(request, pk)
        prod.delete()
        return Response({"message": "Product deleted successfully by administrator."}, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        prod = self.get_object(request, pk)
        serializer = ProductVendorSerializer(prod, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================
# PLATFORM COMMUNITY REVIEWS (Public & Admin)
# =============================================================

class PlatformReviewListCreateView(APIView):
    """
    GET /api/v1/core/reviews/ - Public list of approved foodie reviews
    POST /api/v1/core/reviews/ - Submit a platform review
    """
    permission_classes = [AllowAny]

    def get(self, request):
        reviews = PlatformReview.objects.filter(is_approved=True).order_by('-is_featured', '-created_at')[:30]
        serializer = PlatformReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        author_name = request.data.get('author_name', '').strip() or 'Food Enthusiast'
        headline = request.data.get('headline', '').strip() or 'Exceptional Food Experience'
        comment = request.data.get('comment', '').strip()
        if not comment:
            return Response({'detail': 'Review comment cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            rating = max(1, min(5, int(request.data.get('rating', 5))))
        except (ValueError, TypeError):
            rating = 5

        city = request.data.get('city', 'Delhi NCR').strip() or 'Delhi NCR'
        author_role = request.data.get('author_role', 'Verified Foodie').strip() or 'Verified Foodie'

        review = PlatformReview.objects.create(
            author_name=author_name,
            author_role=author_role,
            city=city,
            rating=rating,
            headline=headline,
            comment=comment,
            is_approved=True,
            is_featured=False
        )
        serializer = PlatformReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminPlatformReviewManageView(APIView):
    """
    GET /api/v1/admin/reviews/ - Admin lists all reviews
    PATCH /api/v1/admin/reviews/<pk>/ - Admin updates approval or feature status
    DELETE /api/v1/admin/reviews/<pk>/ - Admin deletes review
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        reviews = PlatformReview.objects.all().order_by('-created_at')
        serializer = PlatformReviewSerializer(reviews, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        review = get_object_or_404(PlatformReview, pk=pk)
        serializer = PlatformReviewSerializer(review, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        review = get_object_or_404(PlatformReview, pk=pk)
        review.delete()
        return Response({'message': 'Review deleted successfully.'}, status=status.HTTP_200_OK)


# =============================================================
# DYNAMIC COUPONS & VOUCHERS ENGINE (Admin CMS & Public Validation)
# =============================================================

class AdminCouponListCreateView(APIView):
    """
    GET /api/v1/admin/coupons/ - List all coupons
    POST /api/v1/admin/coupons/ - Create new promo coupon
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        coupons = Coupon.objects.all().order_by('-created_at')
        serializer = CouponSerializer(coupons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        if not code:
            return Response({'detail': 'Coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if Coupon.objects.filter(code=code).exists():
            return Response({'detail': f'Coupon code {code} already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = CouponSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminCouponDetailView(APIView):
    """
    PATCH /api/v1/admin/coupons/<pk>/ - Update coupon (e.g. toggle active/inactive)
    DELETE /api/v1/admin/coupons/<pk>/ - Delete coupon
    """
    permission_classes = [IsPlatformAdmin]

    def patch(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        serializer = CouponSerializer(coupon, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        coupon.delete()
        return Response({'message': 'Coupon voucher deleted successfully.'}, status=status.HTTP_200_OK)


class ValidateCouponView(APIView):
    """
    POST /api/v1/coupons/validate/
    Public endpoint to validate promo coupon before checkout against real database.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        raw_code = request.data.get('code', '').strip().upper()
        if not raw_code:
            return Response({'valid': False, 'message': 'Please enter a coupon code.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order_amount = Decimal(str(request.data.get('order_amount', 0)))
        except (ValueError, TypeError):
            order_amount = Decimal('0.00')

        coupon = Coupon.objects.filter(code=raw_code, is_active=True).first()
        if not coupon:
            return Response({
                'valid': False,
                'message': f'Coupon "{raw_code}" is either invalid, expired, or deactivated by admin.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if order_amount < coupon.min_order_value:
            return Response({
                'valid': False,
                'message': f'Minimum cart subtotal of ₹{coupon.min_order_value} required for coupon {coupon.code}.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if coupon.discount_type == Coupon.DiscountType.FLAT:
            discount = min(order_amount, coupon.discount_value)
        else:
            discount = (order_amount * coupon.discount_value) / Decimal('100.0')
            if coupon.max_discount_amount:
                discount = min(discount, coupon.max_discount_amount)

        return Response({
            'valid': True,
            'code': coupon.code,
            'discount_type': coupon.discount_type,
            'discount_amount': float(round(discount, 2)),
            'description': coupon.description,
            'message': f'🎉 Coupon {coupon.code} applied! Saved ₹{discount:.2f} on your order.'
        }, status=status.HTTP_200_OK)

