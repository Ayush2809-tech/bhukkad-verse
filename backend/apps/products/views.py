from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q
from django.shortcuts import get_object_or_404
from apps.shops.models import Shop
from apps.shops.permissions import IsVendor, IsAdmin
from .models import Category, Product, ProductVariant, AddonGroup, AddonItem
from .serializers import (
    CategoryPublicSerializer,
    ProductPublicSerializer,
    ProductSearchResultSerializer,
    CategoryVendorSerializer,
    ProductVendorSerializer,
    ProductVariantVendorSerializer,
    AddonGroupVendorSerializer,
    AddonItemVendorSerializer,
)

# =============================================================
# 1. PUBLIC STOREFRONT ENDPOINTS
# =============================================================

from apps.shops.utils import get_shop_live_status, calculate_haversine_distance
from apps.shops.serializers import ShopOperatingHourSerializer, ShopMenuCardPublicSerializer

class PublicShopMenuView(APIView):
    """
    GET /api/v1/shops/{slug}/menu/
    Retrieves the complete active menu tree (categories, products, variants, add-ons)
    for an approved, active food kitchen along with live operating hours status.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug):
        shop = get_object_or_404(
            Shop.objects.filter(status=Shop.Status.APPROVED, is_active=True).prefetch_related('operating_hours', 'menu_cards'),
            slug=slug
        )
        active_categories = (
            Category.objects.filter(shop=shop, is_active=True)
            .prefetch_related(
                'products__variants',
                'products__addon_groups__items',
            )
        )

        categories_data = CategoryPublicSerializer(active_categories, many=True).data

        payload = {
            "shop": {
                "id": str(shop.id),
                "name": shop.name,
                "slug": shop.slug,
                "description": shop.description,
                "logo": shop.logo.url if shop.logo else None,
                "banner": shop.banner.url if shop.banner else None,
                "address_line": shop.address_line,
                "city": shop.city,
                "timezone": shop.timezone,
                "opening_time": str(shop.opening_time),
                "closing_time": str(shop.closing_time),
                "delivery_radius_km": str(shop.delivery_radius_km),
                "minimum_order_value": str(shop.minimum_order_value),
                "is_accepting_orders": shop.is_accepting_orders,
                "order_pause_reason": shop.order_pause_reason,
                "live_status": get_shop_live_status(shop),
                "operating_hours": ShopOperatingHourSerializer(shop.operating_hours.all().order_by('weekday'), many=True).data,
                "active_menu_card": ShopMenuCardPublicSerializer(shop.active_menu_card).data if shop.active_menu_card else None,
            },
            "categories": categories_data,
        }
        return Response(payload, status=status.HTTP_200_OK)


class PublicShopCategoryListView(generics.ListAPIView):
    """
    GET /api/v1/shops/{slug}/categories/
    List active categories for an approved shop.
    """
    serializer_class = CategoryPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        shop = get_object_or_404(
            Shop.objects.filter(status=Shop.Status.APPROVED, is_active=True),
            slug=self.kwargs['slug']
        )
        return Category.objects.filter(shop=shop, is_active=True)


class PublicShopProductListView(generics.ListAPIView):
    """
    GET /api/v1/shops/{slug}/products/
    List active products for an approved shop.
    Supports filtering by `?category={slug}`, `?dietary_type={VEG|NON_VEG}`, and `?q={search}`.
    """
    serializer_class = ProductPublicSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        shop = get_object_or_404(
            Shop.objects.filter(status=Shop.Status.APPROVED, is_active=True),
            slug=self.kwargs['slug']
        )
        queryset = Product.objects.filter(
            shop=shop,
            is_active=True,
            category__is_active=True
        )

        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        diet = self.request.query_params.get('dietary_type')
        if diet in Product.DietaryType.values:
            queryset = queryset.filter(dietary_type=diet)

        q = self.request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) | Q(description__icontains=q)
            )

        return queryset.prefetch_related('variants', 'addon_groups__items')


class PublicProductDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/shops/{slug}/products/{product_slug}/
    Retrieve public details for a single product with variants and add-on groups.
    """
    serializer_class = ProductPublicSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    lookup_url_kwarg = 'product_slug'

    def get_queryset(self):
        shop = get_object_or_404(
            Shop.objects.filter(status=Shop.Status.APPROVED, is_active=True),
            slug=self.kwargs['slug']
        )
        return Product.objects.filter(
            shop=shop,
            is_active=True,
            category__is_active=True
        ).prefetch_related('variants', 'addon_groups__items')


class PublicProductSearchView(generics.ListAPIView):
    """
    GET /api/v1/products/search/
    Public food / dish search endpoint across all approved partner kitchens.
    Filters:
      - ?q=keyword (matches product name, description, or category name)
      - ?category=category_slug
      - ?dietary_type=VEG|NON_VEG|VEGAN
      - ?lat=float&lng=float (annotates distance_km and is_deliverable)
      - ?deliverable_only=true (filters only to kitchens that deliver to the customer's coordinates)
    """
    serializer_class = ProductSearchResultSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(
            is_active=True,
            category__is_active=True,
            shop__status=Shop.Status.APPROVED,
            shop__is_active=True
        ).select_related('shop', 'category').prefetch_related('variants')

        q = self.request.query_params.get('q', '').strip()
        if q:
            queryset = queryset.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q) |
                Q(category__name__icontains=q)
            )

        category_slug = self.request.query_params.get('category', '').strip()
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        diet = self.request.query_params.get('dietary_type', '').strip()
        if diet in Product.DietaryType.values:
            queryset = queryset.filter(dietary_type=diet)

        queryset = queryset.distinct()

        # Handle geographic proximity if coordinates are supplied
        lat_param = self.request.query_params.get('lat')
        lng_param = self.request.query_params.get('lng')
        deliverable_only = self.request.query_params.get('deliverable_only', '').lower() in ('true', '1', 'yes')
        max_distance_param = self.request.query_params.get('max_distance_km')

        if lat_param is not None and lng_param is not None:
            try:
                cust_lat = float(lat_param)
                cust_lng = float(lng_param)
                max_dist = float(max_distance_param) if max_distance_param else None

                annotated = []
                for p in queryset:
                    distance = calculate_haversine_distance(
                        cust_lat,
                        cust_lng,
                        float(p.shop.latitude),
                        float(p.shop.longitude)
                    )
                    p.annotated_distance_km = distance
                    p.annotated_is_deliverable = distance <= float(p.shop.delivery_radius_km)

                    if deliverable_only and not p.annotated_is_deliverable:
                        continue

                    if max_dist is not None and distance > max_dist:
                        continue

                    annotated.append(p)

                # Deliverable dishes first, then closest distance, then display order
                annotated.sort(
                    key=lambda p: (
                        not getattr(p, 'annotated_is_deliverable', False),
                        getattr(p, 'annotated_distance_km', 999999),
                        p.display_order,
                        p.name
                    )
                )
                return annotated
            except (ValueError, TypeError):
                pass

        return queryset.order_by('display_order', 'name')


# =============================================================
# 2. VENDOR CATALOG MANAGEMENT ENDPOINTS (Isolated to Vendor)
# =============================================================

def get_vendor_shop_or_400(request):
    """
    Helper to resolve the authenticated vendor's shop or raise a 400 response.
    """
    if not hasattr(request.user, 'shop'):
        return None
    return request.user.shop


# --- Category Endpoints ---
class VendorCategoryListCreateView(APIView):
    permission_classes = [IsVendor]

    def get(self, request):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)
        categories = Category.objects.filter(shop=shop)
        serializer = CategoryVendorSerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = CategoryVendorSerializer(data=request.data)
        if serializer.is_valid():
            category = serializer.save(shop=shop)
            return Response(CategoryVendorSerializer(category).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorCategoryDetailView(APIView):
    permission_classes = [IsVendor]

    def get_object(self, request, pk):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return None
        return get_object_or_404(Category.objects.filter(shop=shop), pk=pk)

    def get(self, request, pk):
        cat = self.get_object(request, pk)
        if not cat:
            return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(CategoryVendorSerializer(cat).data)

    def patch(self, request, pk):
        cat = self.get_object(request, pk)
        if not cat:
            return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategoryVendorSerializer(cat, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        cat = self.get_object(request, pk)
        if not cat:
            return Response({"detail": "Category not found."}, status=status.HTTP_404_NOT_FOUND)
        # Soft-deactivate to protect historical links
        cat.is_active = False
        cat.save(update_fields=['is_active', 'updated_at'])
        return Response({"message": "Category deactivated successfully."}, status=status.HTTP_200_OK)


# --- Product Endpoints ---
class VendorProductListCreateView(APIView):
    permission_classes = [IsVendor]

    def get(self, request):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)
        products = Product.objects.filter(shop=shop).prefetch_related('variants', 'addon_groups')
        serializer = ProductVendorSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ProductVendorSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            product = serializer.save(shop=shop)
            return Response(ProductVendorSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorProductDetailView(APIView):
    permission_classes = [IsVendor]

    def get_object(self, request, pk):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return None
        return get_object_or_404(Product.objects.filter(shop=shop), pk=pk)

    def get(self, request, pk):
        prod = self.get_object(request, pk)
        if not prod:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductVendorSerializer(prod).data)

    def patch(self, request, pk):
        prod = self.get_object(request, pk)
        if not prod:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductVendorSerializer(prod, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        prod = self.get_object(request, pk)
        if not prod:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        prod.delete()
        return Response({"message": "Product deleted successfully."}, status=status.HTTP_200_OK)


class VendorProductToggleAvailabilityView(APIView):
    """
    PATCH /api/v1/vendor/products/{id}/availability/
    Quick daily toggle for 86ing / sold-out state.
    """
    permission_classes = [IsVendor]

    def patch(self, request, pk):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no shop."}, status=status.HTTP_400_BAD_REQUEST)
        product = get_object_or_404(Product.objects.filter(shop=shop), pk=pk)
        product.is_available = not product.is_available
        product.save(update_fields=['is_available', 'updated_at'])
        return Response({
            "id": str(product.id),
            "name": product.name,
            "is_available": product.is_available,
        })


# --- Variant Endpoints ---
class VendorVariantListCreateView(APIView):
    permission_classes = [IsVendor]

    def get(self, request, product_id):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no shop."}, status=status.HTTP_400_BAD_REQUEST)
        product = get_object_or_404(Product.objects.filter(shop=shop), pk=product_id)
        variants = product.variants.all()
        return Response(ProductVariantVendorSerializer(variants, many=True).data)

    def post(self, request, product_id):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no shop."}, status=status.HTTP_400_BAD_REQUEST)
        product = get_object_or_404(Product.objects.filter(shop=shop), pk=product_id)
        serializer = ProductVariantVendorSerializer(data=request.data)
        if serializer.is_valid():
            variant = serializer.save(product=product)
            # Ensure product.has_variants is set to True
            if not product.has_variants:
                product.has_variants = True
                product.save(update_fields=['has_variants', 'updated_at'])
            return Response(ProductVariantVendorSerializer(variant).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorVariantDetailView(APIView):
    permission_classes = [IsVendor]

    def get_object(self, request, product_id, pk):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return None
        product = get_object_or_404(Product.objects.filter(shop=shop), pk=product_id)
        return get_object_or_404(product.variants.all(), pk=pk)

    def patch(self, request, product_id, pk):
        variant = self.get_object(request, product_id, pk)
        if not variant:
            return Response({"detail": "Variant not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ProductVariantVendorSerializer(variant, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, product_id, pk):
        variant = self.get_object(request, product_id, pk)
        if not variant:
            return Response({"detail": "Variant not found."}, status=status.HTTP_404_NOT_FOUND)
        product = variant.product
        variant.delete()
        if product.variants.count() == 0:
            product.has_variants = False
            product.save(update_fields=['has_variants', 'updated_at'])
        return Response({"message": "Variant deleted successfully."}, status=status.HTTP_200_OK)


# --- Add-on Group & Item Endpoints ---
class VendorAddonGroupListCreateView(APIView):
    permission_classes = [IsVendor]

    def get(self, request):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no shop."}, status=status.HTTP_400_BAD_REQUEST)
        groups = AddonGroup.objects.filter(shop=shop).prefetch_related('items')
        return Response(AddonGroupVendorSerializer(groups, many=True).data)

    def post(self, request):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no shop."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = AddonGroupVendorSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save(shop=shop)
            return Response(AddonGroupVendorSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorAddonGroupDetailView(APIView):
    permission_classes = [IsVendor]

    def get_object(self, request, pk):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return None
        return get_object_or_404(AddonGroup.objects.filter(shop=shop), pk=pk)

    def get(self, request, pk):
        group = self.get_object(request, pk)
        if not group:
            return Response({"detail": "Add-on group not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AddonGroupVendorSerializer(group).data)

    def patch(self, request, pk):
        group = self.get_object(request, pk)
        if not group:
            return Response({"detail": "Add-on group not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AddonGroupVendorSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        group = self.get_object(request, pk)
        if not group:
            return Response({"detail": "Add-on group not found."}, status=status.HTTP_404_NOT_FOUND)
        group.is_active = False
        group.save(update_fields=['is_active', 'updated_at'])
        return Response({"message": "Add-on group deactivated successfully."}, status=status.HTTP_200_OK)


class VendorAddonItemListCreateView(APIView):
    permission_classes = [IsVendor]

    def get(self, request, group_id):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no shop."}, status=status.HTTP_400_BAD_REQUEST)
        group = get_object_or_404(AddonGroup.objects.filter(shop=shop), pk=group_id)
        items = group.items.all()
        return Response(AddonItemVendorSerializer(items, many=True).data)

    def post(self, request, group_id):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({"detail": "Vendor has no shop."}, status=status.HTTP_400_BAD_REQUEST)
        group = get_object_or_404(AddonGroup.objects.filter(shop=shop), pk=group_id)
        serializer = AddonItemVendorSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save(group=group)
            return Response(AddonItemVendorSerializer(item).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VendorAddonItemDetailView(APIView):
    permission_classes = [IsVendor]

    def get_object(self, request, group_id, pk):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return None
        group = get_object_or_404(AddonGroup.objects.filter(shop=shop), pk=group_id)
        return get_object_or_404(group.items.all(), pk=pk)

    def patch(self, request, group_id, pk):
        item = self.get_object(request, group_id, pk)
        if not item:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AddonItemVendorSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, group_id, pk):
        item = self.get_object(request, group_id, pk)
        if not item:
            return Response({"detail": "Item not found."}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response({"message": "Add-on item deleted successfully."}, status=status.HTTP_200_OK)


DEFAULT_CULINARY_IMAGES = {
    'biryani': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    'pizza': 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    'burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
    'paneer': 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&auto=format&fit=crop&q=80',
    'tikka': 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=800&auto=format&fit=crop&q=80',
    'momo': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
    'dimsum': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
    'pasta': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80',
    'shake': 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=800&auto=format&fit=crop&q=80',
    'roll': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    'wrap': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    'dal': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    'naan': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    'roti': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    'noodle': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
    'chowmein': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80',
    'curry': 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
    'chicken': 'https://images.unsplash.com/photo-1606728035253-49e8a23146de?w=800&auto=format&fit=crop&q=80',
    'sandwich': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80',
    'dosa': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
    'samosa': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    'chaat': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    'dessert': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800&auto=format&fit=crop&q=80',
    'cake': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&auto=format&fit=crop&q=80',
    'coffee': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    'tea': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&auto=format&fit=crop&q=80',
}

def resolve_online_food_image(dish_name, category_name=''):
    combined = f'{dish_name} {category_name}'.lower()
    for keyword, url in DEFAULT_CULINARY_IMAGES.items():
        if keyword in combined:
            return url
    return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'


class VendorAutoGenerateDishesView(APIView):
    permission_classes = [IsVendor]

    def post(self, request):
        shop = get_vendor_shop_or_400(request)
        if not shop:
            return Response({'detail': 'Vendor has no registered shop.'}, status=status.HTTP_400_BAD_REQUEST)

        raw_items = request.data.get('items', [])
        if not isinstance(raw_items, list) or len(raw_items) == 0:
            return Response({'detail': 'Please provide a list of dishes to auto-generate.'}, status=status.HTTP_400_BAD_REQUEST)

        created_products = []
        for item in raw_items:
            name = item.get('name', '').strip()
            if not name:
                continue

            price = item.get('price', 199.00)
            category_name = item.get('category', 'Specialties').strip() or 'Specialties'
            dietary_type = item.get('dietary_type', 'VEG').upper()
            if dietary_type not in ['VEG', 'NON_VEG', 'EGG', 'VEGAN']:
                dietary_type = 'VEG'

            img_url = item.get('image_url')
            if not img_url:
                img_url = resolve_online_food_image(name, category_name)

            category, _ = Category.objects.get_or_create(
                shop=shop,
                name=category_name,
                defaults={'is_active': True}
            )

            product = Product.objects.create(
                shop=shop,
                category=category,
                name=name,
                description=item.get('description', f'Authentic chef prepared {name} with fresh spices.'),
                base_price=price,
                compare_at_price=item.get('compare_at_price'),
                image_url=img_url,
                dietary_type=dietary_type,
                preparation_time_minutes=item.get('preparation_time_minutes', 20),
                is_available=True,
                is_active=True,
            )
            created_products.append(product)

        serializer = ProductVendorSerializer(created_products, many=True)
        return Response({
            'message': f'Successfully created {len(created_products)} dish cards with online images!',
            'dishes': serializer.data
        }, status=status.HTTP_201_CREATED)
