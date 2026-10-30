from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Public Authentication & Session
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('vendor-register/', views.VendorRegisterView.as_view(), name='auth-vendor-register'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('status/', views.auth_status, name='auth-status'),
    path('me/', views.me_view, name='auth-me'),

    # Platform Administrator Management Endpoints
    path('admin/overview/', views.AdminOverviewView.as_view(), name='admin-overview'),
    path('admin/users/', views.AdminUsersListView.as_view(), name='admin-users-list'),
    path('admin/users/<uuid:pk>/', views.AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/audit-logs/', views.AdminAuditLogsView.as_view(), name='admin-audit-logs'),
]
