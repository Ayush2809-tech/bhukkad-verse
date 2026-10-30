from django.urls import path
from . import views

urlpatterns = [
    path('addresses/', views.CustomerAddressListCreateView.as_view(), name='customer-address-list'),
    path('addresses/<uuid:pk>/', views.CustomerAddressDetailView.as_view(), name='customer-address-detail'),
    path('addresses/<uuid:pk>/set-default/', views.CustomerAddressSetDefaultView.as_view(), name='customer-address-set-default'),
    # Customer Support & Complaints
    path('support/tickets/', views.SupportTicketCreateView.as_view(), name='customer-support-create'),
    path('support/my-tickets/', views.CustomerSupportTicketListView.as_view(), name='customer-support-my-tickets'),
]
