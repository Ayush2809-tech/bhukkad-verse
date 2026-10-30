from django.urls import path
from . import views

urlpatterns = [
    # Public Storefront Discovery
    path('shops/', views.PublicShopListView.as_view(), name='public-shop-list'),
    path('shops/<slug:slug>/', views.PublicShopDetailView.as_view(), name='public-shop-detail'),
    path('shops/<slug:slug>/menu-card/', views.PublicShopMenuCardView.as_view(), name='public-shop-menu-card'),
    path('shops/<slug:slug>/reviews/', views.PublicShopReviewsView.as_view(), name='public-shop-reviews'),

    # Vendor Self-Service Application & Profile
    path('vendor/shop/', views.VendorShopView.as_view(), name='vendor-shop'),
    path('vendor/shop/toggle-orders/', views.VendorToggleOrdersView.as_view(), name='vendor-shop-toggle-orders'),
    path('vendor/operating-hours/', views.VendorOperatingHoursView.as_view(), name='vendor-operating-hours'),
    path('vendor/reviews/', views.VendorShopReviewsView.as_view(), name='vendor-shop-reviews'),

    # Vendor Original Menu Card Management (Increment 2B)
    path('vendor/menu-cards/', views.VendorMenuCardListCreateView.as_view(), name='vendor-menu-card-list-create'),
    path('vendor/menu-cards/<uuid:pk>/', views.VendorMenuCardDetailView.as_view(), name='vendor-menu-card-detail'),
    path('vendor/menu-cards/<uuid:pk>/activate/', views.VendorMenuCardActivateView.as_view(), name='vendor-menu-card-activate'),
    path('vendor/menu-cards/<uuid:pk>/archive/', views.VendorMenuCardArchiveView.as_view(), name='vendor-menu-card-archive'),

    # Platform Admin Moderation & Approval
    path('admin/shops/', views.AdminShopListView.as_view(), name='admin-shop-list'),
    path('admin/shops/<uuid:pk>/approve/', views.AdminShopApproveView.as_view(), name='admin-shop-approve'),
    path('admin/shops/<uuid:pk>/reject/', views.AdminShopRejectView.as_view(), name='admin-shop-reject'),
    path('admin/shops/<uuid:pk>/suspend/', views.AdminShopSuspendView.as_view(), name='admin-shop-suspend'),
    path('admin/shops/<uuid:pk>/reactivate/', views.AdminShopReactivateView.as_view(), name='admin-shop-reactivate'),
]
