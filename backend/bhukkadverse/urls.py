from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core import views as core_views
from apps.authentication import views as auth_views
from apps.customers import views as customer_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', core_views.health_check, name='health-check'),

    # Dynamic Platform & Entrance Curtain Settings
    path('api/v1/core/settings/', core_views.PlatformSettingsPublicView.as_view(), name='platform-settings-public'),
    path('api/v1/admin/settings/', core_views.AdminPlatformSettingsView.as_view(), name='admin-platform-settings'),

    # Community & Platform Reviews (Public, Admin)
    path('api/v1/core/reviews/', core_views.PlatformReviewListCreateView.as_view(), name='platform-reviews'),
    path('api/v1/admin/reviews/', core_views.AdminPlatformReviewManageView.as_view(), name='admin-platform-reviews'),
    path('api/v1/admin/reviews/<uuid:pk>/', core_views.AdminPlatformReviewManageView.as_view(), name='admin-platform-review-detail'),

    # Dynamic Coupon Vouchers (Admin CMS & Public Validation)
    path('api/v1/admin/coupons/', core_views.AdminCouponListCreateView.as_view(), name='admin-coupons'),
    path('api/v1/admin/coupons/<uuid:pk>/', core_views.AdminCouponDetailView.as_view(), name='admin-coupon-detail'),
    path('api/v1/coupons/validate/', core_views.ValidateCouponView.as_view(), name='validate-coupon'),

    # Front-page Video Showcase Reels (Public, Vendor, Admin)
    path('api/v1/core/showcase-videos/', core_views.PublicShowcaseVideosView.as_view(), name='public-showcase-videos'),
    path('api/v1/vendor/showcase-videos/', core_views.VendorShowcaseVideoListCreateView.as_view(), name='vendor-showcase-videos'),
    path('api/v1/vendor/showcase-videos/<uuid:pk>/', core_views.VendorShowcaseVideoDetailView.as_view(), name='vendor-showcase-video-detail'),
    path('api/v1/admin/showcase-videos/', core_views.AdminShowcaseVideoListCreateView.as_view(), name='admin-showcase-videos'),
    path('api/v1/admin/showcase-videos/<uuid:pk>/', core_views.AdminShowcaseVideoDetailView.as_view(), name='admin-showcase-video-detail'),

    # Direct admin routes
    path('api/v1/admin/overview/', auth_views.AdminOverviewView.as_view(), name='admin-overview-direct'),
    path('api/v1/admin/users/', auth_views.AdminUsersListView.as_view(), name='admin-users-list-direct'),
    path('api/v1/admin/users/<uuid:pk>/', auth_views.AdminUserDetailView.as_view(), name='admin-user-detail-direct'),
    path('api/v1/admin/audit-logs/', auth_views.AdminAuditLogsView.as_view(), name='admin-audit-logs-direct'),
    path('api/v1/admin/products/', core_views.AdminProductListView.as_view(), name='admin-products-list'),
    path('api/v1/admin/products/<uuid:pk>/', core_views.AdminProductDetailView.as_view(), name='admin-product-detail'),

    # Support & Complaint handling routes (Shop-wise & Admin-wide)
    path('api/v1/vendor/support/tickets/', customer_views.VendorShopComplaintsView.as_view(), name='vendor-shop-complaints'),
    path('api/v1/vendor/support/tickets/<uuid:pk>/', customer_views.VendorResolveComplaintView.as_view(), name='vendor-resolve-complaint'),
    path('api/v1/admin/support/tickets/', customer_views.AdminSupportTicketsView.as_view(), name='admin-support-tickets'),
    path('api/v1/admin/support/tickets/<uuid:pk>/', customer_views.AdminResolveTicketView.as_view(), name='admin-resolve-ticket'),

    path('api/v1/auth/', include('apps.authentication.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/', include('apps.orders.urls')),
    path('api/v1/', include('apps.shops.urls')),
    path('api/v1/', include('apps.products.urls')),
    path('api/v1/customer/', include('apps.customers.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
