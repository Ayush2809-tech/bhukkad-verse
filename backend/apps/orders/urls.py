from django.urls import path
from . import views

urlpatterns = [
    # Customer Checkout & Payments
    path('checkout/', views.CreateCheckoutOrderView.as_view(), name='order-checkout'),
    path('verify-payment/', views.VerifyPaymentView.as_view(), name='order-verify-payment'),
    path('track/<str:order_number>/', views.TrackOrderView.as_view(), name='order-track'),
    path('my-orders/', views.CustomerMyOrdersView.as_view(), name='customer-my-orders'),

    # Vendor Order Management
    path('vendor/orders/', views.VendorOrdersView.as_view(), name='vendor-orders'),
    path('vendor/orders/<str:order_number>/status/', views.VendorOrdersView.as_view(), name='vendor-order-status-update'),

    # Admin Marketplace Financials
    path('admin/financials/', views.AdminFinancialOverviewView.as_view(), name='admin-financials'),
    path('admin/cod-ledger/', views.AdminCodLedgerView.as_view(), name='admin-cod-ledger'),
    path('admin/settle-vendor/<uuid:settlement_id>/', views.AdminSettleVendorView.as_view(), name='admin-settle-vendor'),

    # Delivery Fleet & Cash-on-Delivery Ledger
    path('rider/wallet/', views.RiderWalletView.as_view(), name='rider-wallet'),
    path('rider/collect-cash/', views.RiderCollectCashView.as_view(), name='rider-collect-cash'),
    path('rider/deposit-cash/', views.RiderDepositCashView.as_view(), name='rider-deposit-cash'),
]

