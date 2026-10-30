from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.shops.models import Shop, ShopOperatingHour
from apps.authentication.models import AdminAuditLog

User = get_user_model()

class AuthenticationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth-register')
        self.vendor_register_url = reverse('auth-vendor-register')
        self.login_url = reverse('auth-login')
        self.me_url = reverse('auth-me')
        self.logout_url = reverse('auth-logout')

        self.customer_data = {
            "username": "tasty_foodie",
            "email": "foodie@bhukkadverse.local",
            "password": "StrongPassword123!",
            "first_name": "Aarav",
            "last_name": "Sharma",
            "phone": "+919876543210",
            "role": "CUSTOMER",
        }

    def test_customer_registration_success(self):
        """
        Verify that a new customer can register successfully and receives JWT tokens.
        """
        response = self.client.post(self.register_url, self.customer_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['user']['role'], 'CUSTOMER')
        self.assertEqual(response.data['user']['email'], 'foodie@bhukkadverse.local')

    def test_vendor_registration_success(self):
        """
        Verify that a new vendor can register with the VENDOR role via the base auth route.
        """
        vendor_data = {
            "username": "chef_singh",
            "email": "singh@bhukkadverse.local",
            "password": "StrongPassword123!",
            "role": "VENDOR",
        }
        response = self.client.post(self.register_url, vendor_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'VENDOR')

    def test_admin_registration_prevented(self):
        """
        Verify that attempting to register with ADMIN role is rejected to prevent privilege escalation.
        """
        admin_data = {
            "username": "hacker_admin",
            "email": "hacker@bhukkadverse.local",
            "password": "StrongPassword123!",
            "role": "ADMIN",
        }
        response = self.client.post(self.register_url, admin_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('role', response.data)

    def test_duplicate_email_rejected(self):
        """
        Verify that registering with an already existing email returns HTTP 400.
        """
        self.client.post(self.register_url, self.customer_data, format='json')
        duplicate_data = self.customer_data.copy()
        duplicate_data['username'] = "different_user"
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_case_insensitive_duplicate_email_rejected(self):
        """
        Verify that registering with uppercase/mixed case email is caught by case-insensitive check.
        """
        self.client.post(self.register_url, self.customer_data, format='json')
        duplicate_data = self.customer_data.copy()
        duplicate_data['username'] = "another_foodie"
        duplicate_data['email'] = "FOODIE@BHUKKADVERSE.LOCAL"
        response = self.client.post(self.register_url, duplicate_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_weak_password_rejected(self):
        """
        Verify that passwords shorter than 8 characters fail validation.
        """
        weak_data = self.customer_data.copy()
        weak_data['password'] = "short"
        response = self.client.post(self.register_url, weak_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success_with_username(self):
        """
        Verify that a registered user can log in with username and receive JWT tokens.
        """
        User.objects.create_user(
            username='login_tester',
            email='tester@bhukkadverse.local',
            password='TestPassword123!',
            role=User.Role.CUSTOMER
        )
        login_payload = {
            "username": "login_tester",
            "password": "TestPassword123!"
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'login_tester')

    def test_login_success_with_email(self):
        """
        Verify that a registered user can log in using their email address in the username field.
        """
        User.objects.create_user(
            username='email_login_user',
            email='emailuser@bhukkadverse.local',
            password='TestPassword123!',
            role=User.Role.CUSTOMER
        )
        login_payload = {
            "username": "emailuser@bhukkadverse.local",
            "password": "TestPassword123!"
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'email_login_user')

    def test_login_success_with_mixed_case_email(self):
        """
        Verify that email login is case-insensitive.
        """
        User.objects.create_user(
            username='case_user',
            email='caseuser@bhukkadverse.local',
            password='TestPassword123!',
            role=User.Role.CUSTOMER
        )
        login_payload = {
            "username": "CASEUSER@BhukkadVerse.Local",
            "password": "TestPassword123!"
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'case_user')

    def test_login_inactive_user_rejected(self):
        """
        Verify that deactivated accounts cannot log in and receive an informative error.
        """
        user = User.objects.create_user(
            username='deactivated_user',
            email='deactivated@bhukkadverse.local',
            password='TestPassword123!',
            role=User.Role.CUSTOMER
        )
        user.is_active = False
        user.save()

        login_payload = {
            "username": "deactivated_user",
            "password": "TestPassword123!"
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('inactive', str(response.data.get('detail', '')).lower())

    def test_login_invalid_credentials(self):
        """
        Verify that invalid credentials return HTTP 401 Unauthorized.
        """
        login_payload = {
            "username": "non_existent_user",
            "password": "WrongPassword123!"
        }
        response = self.client.post(self.login_url, login_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_jwt_protected_me_endpoint(self):
        """
        Verify that /api/v1/auth/me/ requires a valid Bearer token.
        """
        # Unauthenticated request
        unauth_response = self.client.get(self.me_url)
        self.assertEqual(unauth_response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Authenticated with Bearer token
        User.objects.create_user(
            username='me_tester',
            email='me@bhukkadverse.local',
            password='TestPassword123!'
        )
        login_res = self.client.post(
            self.login_url,
            {"username": "me_tester", "password": "TestPassword123!"},
            format='json'
        )
        token = login_res.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        auth_response = self.client.get(self.me_url)
        self.assertEqual(auth_response.status_code, status.HTTP_200_OK)
        self.assertEqual(auth_response.data['username'], 'me_tester')


class VendorAtomicRegistrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.vendor_register_url = reverse('auth-vendor-register')

        self.valid_vendor_payload = {
            "username": "spicy_grill_owner",
            "email": "owner@spicygrill.in",
            "password": "SecretPassword123!",
            "first_name": "Rohan",
            "last_name": "Mehta",
            "phone": "+919876500000",
            "shop_name": "The Spicy Grill Hub",
            "shop_description": "Finest charcoal grilled delights and biryanis.",
            "shop_phone": "+919876500001",
            "shop_email": "kitchen@spicygrill.in",
            "shop_address_line": "Shop 12, Market Square",
            "shop_city": "Indore",
            "shop_postal_code": "452001",
            "shop_latitude": 22.7196,
            "shop_longitude": 75.8577,
            "shop_delivery_radius_km": 8.0,
            "shop_minimum_order_value": 150.0,
        }

    def test_atomic_vendor_registration_success(self):
        """
        Verify that atomic vendor registration provisions both User and Shop in one transaction.
        Also verifies default 7-day operating hours creation.
        """
        response = self.client.post(self.vendor_register_url, self.valid_vendor_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('shop', response.data)

        # Verify User created with VENDOR role
        user = User.objects.get(username="spicy_grill_owner")
        self.assertEqual(user.role, User.Role.VENDOR)
        self.assertEqual(user.email, "owner@spicygrill.in")

        # Verify Shop created with PENDING status linked to user
        shop = Shop.objects.get(owner=user)
        self.assertEqual(shop.name, "The Spicy Grill Hub")
        self.assertEqual(shop.status, Shop.Status.PENDING)
        self.assertEqual(shop.city, "Indore")

        # Verify default 7 days operating hours generated
        self.assertEqual(shop.operating_hours.count(), 7)

    def test_atomic_vendor_registration_rollback_on_shop_failure(self):
        """
        Verify that if shop fields fail validation, the entire transaction rolls back
        and NO user record is created in the database.
        """
        invalid_payload = self.valid_vendor_payload.copy()
        invalid_payload['username'] = "rollback_user"
        invalid_payload['email'] = "rollback@spicygrill.in"
        # Omit required shop_address_line to trigger validation failure
        invalid_payload['shop_address_line'] = ""

        response = self.client.post(self.vendor_register_url, invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # Assert User was NOT created due to rollback
        self.assertFalse(User.objects.filter(username="rollback_user").exists())
        self.assertFalse(User.objects.filter(email="rollback@spicygrill.in").exists())


class PlatformAdminGovernanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser(
            username='head_admin',
            email='admin@bhukkadverse.local',
            password='AdminPassword123!',
            role=User.Role.ADMIN
        )
        self.customer_user = User.objects.create_user(
            username='regular_customer',
            email='cust@bhukkadverse.local',
            password='CustomerPassword123!',
            role=User.Role.CUSTOMER
        )
        self.vendor_user = User.objects.create_user(
            username='regular_vendor',
            email='vend@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )
        self.test_shop = Shop.objects.create(
            owner=self.vendor_user,
            name='Test Cafe',
            slug='test-cafe',
            description='A cozy cafe',
            phone='+919999999999',
            email='cafe@bhukkadverse.local',
            address_line='123 Main St',
            city='Indore',
            postal_code='452001',
            latitude=22.7196,
            longitude=75.8577,
            status=Shop.Status.PENDING
        )

        self.overview_url = reverse('admin-overview')
        self.users_url = reverse('admin-users-list')
        self.audit_url = reverse('admin-audit-logs')

    def test_customer_cannot_access_admin_overview(self):
        """
        Verify that CUSTOMER role receives 403 Forbidden on admin overview.
        """
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_vendor_cannot_access_admin_overview(self):
        """
        Verify that VENDOR role receives 403 Forbidden on admin overview.
        """
        self.client.force_authenticate(user=self.vendor_user)
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_overview_and_gets_real_counts(self):
        """
        Verify that ADMIN role receives real database counts.
        """
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.overview_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['users']['total'], 3)
        self.assertEqual(response.data['users']['admins'], 1)
        self.assertEqual(response.data['users']['customers'], 1)
        self.assertEqual(response.data['users']['vendors'], 1)
        self.assertEqual(response.data['shops']['total'], 1)
        self.assertEqual(response.data['shops']['pending'], 1)

    def test_admin_can_list_and_search_users(self):
        """
        Verify that admin can list users and filter by role or search term.
        """
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(f"{self.users_url}?role=VENDOR")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['username'], 'regular_vendor')

    def test_admin_self_deactivation_is_prevented(self):
        """
        Verify that an administrator cannot deactivate their own account.
        """
        self.client.force_authenticate(user=self.admin_user)
        user_detail_url = reverse('admin-user-detail', kwargs={'pk': self.admin_user.id})
        response = self.client.patch(user_detail_url, {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Self-deactivation is prohibited', response.data['detail'])

        self.admin_user.refresh_from_db()
        self.assertTrue(self.admin_user.is_active)

    def test_admin_can_deactivate_other_user_and_audit_is_recorded(self):
        """
        Verify that an admin can deactivate another user, and an audit log is created.
        """
        self.client.force_authenticate(user=self.admin_user)
        user_detail_url = reverse('admin-user-detail', kwargs={'pk': self.customer_user.id})
        response = self.client.patch(user_detail_url, {'is_active': False}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])

        self.customer_user.refresh_from_db()
        self.assertFalse(self.customer_user.is_active)

        # Check audit log
        audit = AdminAuditLog.objects.filter(action='USER_UPDATED', target_id=str(self.customer_user.id)).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.admin, self.admin_user)

    def test_admin_can_suspend_and_reactivate_shop(self):
        """
        Verify that an admin can suspend an approved shop and then reactivate it,
        with proper status transitions and audit log generation.
        """
        self.test_shop.status = Shop.Status.APPROVED
        self.test_shop.is_accepting_orders = True
        self.test_shop.save()

        self.client.force_authenticate(user=self.admin_user)
        suspend_url = reverse('admin-shop-suspend', kwargs={'pk': self.test_shop.id})
        suspend_res = self.client.post(suspend_url, {'reason': 'Routine hygiene audit'}, format='json')
        self.assertEqual(suspend_res.status_code, status.HTTP_200_OK)

        self.test_shop.refresh_from_db()
        self.assertEqual(self.test_shop.status, Shop.Status.SUSPENDED)
        self.assertFalse(self.test_shop.is_accepting_orders)
        self.assertEqual(self.test_shop.order_pause_reason, 'Routine hygiene audit')

        # Reactivate
        reactivate_url = reverse('admin-shop-reactivate', kwargs={'pk': self.test_shop.id})
        reactivate_res = self.client.post(reactivate_url, {}, format='json')
        self.assertEqual(reactivate_res.status_code, status.HTTP_200_OK)

        self.test_shop.refresh_from_db()
        self.assertEqual(self.test_shop.status, Shop.Status.APPROVED)
        self.assertTrue(self.test_shop.is_accepting_orders)
        self.assertEqual(self.test_shop.order_pause_reason, '')
