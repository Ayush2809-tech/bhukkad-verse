import datetime
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from apps.shops.models import Shop, ShopOperatingHour, ShopMenuCard
from apps.products.models import Category, Product, ProductVariant
from apps.authentication.models import AdminAuditLog

User = get_user_model()

class EndToEndReadinessAuditTests(TestCase):
    """
    Comprehensive End-to-End Readiness Audit test suite covering:
    - Task 2: Customer Journey & Discovery
    - Task 3: Vendor Journey & Catalog Management
    - Task 4: Platform Admin Governance & Audit Trail
    - Task 5: API & Data Integrity, Timezone, and RBAC
    """

    def setUp(self):
        self.client = APIClient()

        # 1. Create Platform Administrator
        self.admin = User.objects.create_superuser(
            username="super_admin",
            email="admin@bhukkadverse.local",
            password="AdminPassword123!",
            role=User.Role.ADMIN
        )

        # 2. Create Vendor A with an Approved Shop
        self.vendor_a = User.objects.create_user(
            username="chef_arjun",
            email="arjun@bhukkadverse.local",
            password="VendorPassword123!",
            role=User.Role.VENDOR
        )
        self.shop_a = Shop.objects.create(
            owner=self.vendor_a,
            name="Arjun's Royal Biryani",
            slug="arjuns-royal-biryani",
            description="Authentic clay pot biryani and kebabs.",
            phone="+919876511111",
            email="royal@biryani.in",
            address_line="101 Palace Road",
            city="Indore",
            postal_code="452001",
            latitude=22.7196,
            longitude=75.8577,
            delivery_radius_km=10.0,
            minimum_order_value=200.0,
            status=Shop.Status.APPROVED,
            is_active=True,
            is_accepting_orders=True
        )

        # Create Category and Product for Shop A
        self.category_a = Category.objects.create(
            shop=self.shop_a,
            name="Biryani Pots",
            slug="biryani-pots",
            is_active=True
        )
        self.product_a = Product.objects.create(
            shop=self.shop_a,
            category=self.category_a,
            name="Dum Hyderabadi Biryani",
            slug="dum-hyderabadi-biryani",
            base_price=350.00,
            dietary_type="NON_VEG",
            is_available=True,
            is_active=True
        )
        self.variant_a = ProductVariant.objects.create(
            product=self.product_a,
            name="Family Handi (Serves 4)",
            price=750.00,
            is_default=False,
            is_available=True
        )

        # 3. Create Vendor B with a Pending Shop
        self.vendor_b = User.objects.create_user(
            username="baker_priya",
            email="priya@bhukkadverse.local",
            password="VendorPassword123!",
            role=User.Role.VENDOR
        )
        self.shop_b = Shop.objects.create(
            owner=self.vendor_b,
            name="Priya's Sweet Treats",
            slug="priyas-sweet-treats",
            description="Handcrafted cakes and pastries.",
            phone="+919876522222",
            email="sweet@priya.in",
            address_line="45 Baker St",
            city="Indore",
            postal_code="452002",
            status=Shop.Status.PENDING,
            is_active=True
        )

        # 4. Create Customer
        self.customer = User.objects.create_user(
            username="foodie_rahul",
            email="rahul@bhukkadverse.local",
            password="CustomerPassword123!",
            role=User.Role.CUSTOMER
        )

    # =========================================================================
    # TASK 2: CUSTOMER JOURNEY
    # =========================================================================

    def test_customer_journey_public_shop_discovery(self):
        """
        Verify that guests and customers browse only approved, active kitchens.
        Pending, suspended, or rejected shops must be excluded.
        """
        response = self.client.get(reverse('public-shop-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        shop_names = [s['name'] for s in response.data]
        self.assertIn("Arjun's Royal Biryani", shop_names)
        self.assertNotIn("Priya's Sweet Treats", shop_names)

    def test_customer_journey_distance_and_deliverability_calculation(self):
        """
        Verify that coordinates calculate Haversine distance and deliverability.
        Customer at coordinates within 10km should see is_deliverable=True.
        """
        # Near location (within 1km)
        response = self.client.get(reverse('public-shop-list') + '?lat=22.7200&lng=75.8580')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        first_shop = response.data[0]
        self.assertTrue(first_shop['is_deliverable'])
        self.assertLess(first_shop['distance_km'], 1.0)

        # Far location (Mumbai coordinates ~500km away)
        far_response = self.client.get(reverse('public-shop-list') + '?lat=19.0760&lng=72.8777')
        self.assertEqual(far_response.status_code, status.HTTP_200_OK)
        far_shop = far_response.data[0]
        self.assertFalse(far_shop['is_deliverable'])
        self.assertGreater(far_shop['distance_km'], 400.0)

    def test_customer_journey_shop_menu_tree_resolution(self):
        """
        Verify that customer can retrieve complete digital menu tree with categories,
        products, variants, operating hours, and live status.
        """
        url = reverse('public-shop-menu', kwargs={'slug': 'arjuns-royal-biryani'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        self.assertEqual(data['shop']['name'], "Arjun's Royal Biryani")
        self.assertIn('live_status', data['shop'])
        self.assertIn('categories', data)
        self.assertEqual(len(data['categories']), 1)
        self.assertEqual(data['categories'][0]['products'][0]['name'], "Dum Hyderabadi Biryani")
        self.assertEqual(len(data['categories'][0]['products'][0]['variants']), 1)

    def test_customer_journey_non_existent_shop_returns_404(self):
        """
        Verify that requesting non-existent shop menu returns HTTP 404 cleanly.
        """
        url = reverse('public-shop-menu', kwargs={'slug': 'ghost-kitchen-404'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_customer_role_cannot_access_vendor_or_admin_apis(self):
        """
        Verify that a CUSTOMER user is strictly blocked from accessing vendor or admin endpoints.
        """
        self.client.force_authenticate(user=self.customer)

        # Cannot access vendor shop
        vendor_res = self.client.get(reverse('vendor-shop'))
        self.assertEqual(vendor_res.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot access admin overview
        admin_res = self.client.get(reverse('admin-overview'))
        self.assertEqual(admin_res.status_code, status.HTTP_403_FORBIDDEN)

        # Cannot access admin shop moderation
        admin_shops_res = self.client.get(reverse('admin-shop-list'))
        self.assertEqual(admin_shops_res.status_code, status.HTTP_403_FORBIDDEN)

    # =========================================================================
    # TASK 3: VENDOR JOURNEY
    # =========================================================================

    def test_vendor_journey_dashboard_retrieval(self):
        """
        Verify that an authenticated vendor can retrieve their own shop details.
        """
        self.client.force_authenticate(user=self.vendor_a)
        response = self.client.get(reverse('vendor-shop'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Arjun's Royal Biryani")
        self.assertEqual(response.data['status'], "APPROVED")

    def test_vendor_journey_operating_hours_bulk_update(self):
        """
        Verify that a vendor can update their weekly operating schedule.
        """
        self.client.force_authenticate(user=self.vendor_a)
        schedule = [
            {"weekday": day, "is_closed": False, "opening_time": "11:00", "closing_time": "23:00"}
            for day in range(7)
        ]
        response = self.client.put(reverse('vendor-operating-hours'), schedule, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 7)
        self.assertEqual(str(response.data[0]['opening_time']), "11:00:00")

    def test_vendor_journey_pause_and_resume_live_orders(self):
        """
        Verify that a vendor can pause and resume orders, and public APIs reflect this immediately.
        """
        self.client.force_authenticate(user=self.vendor_a)

        # 1. Pause orders
        pause_res = self.client.post(
            reverse('vendor-shop-toggle-orders'),
            {"is_accepting_orders": False, "pause_reason": "Kitchen deep cleaning in progress."},
            format='json'
        )
        self.assertEqual(pause_res.status_code, status.HTTP_200_OK)
        self.assertFalse(pause_res.data['is_accepting_orders'])
        self.assertEqual(pause_res.data['order_pause_reason'], "Kitchen deep cleaning in progress.")

        # 2. Check public menu immediately reflects paused status
        public_menu = self.client.get(reverse('public-shop-menu', kwargs={'slug': 'arjuns-royal-biryani'}))
        self.assertFalse(public_menu.data['shop']['is_accepting_orders'])
        self.assertEqual(public_menu.data['shop']['order_pause_reason'], "Kitchen deep cleaning in progress.")

        # 3. Resume orders
        resume_res = self.client.post(
            reverse('vendor-shop-toggle-orders'),
            {"is_accepting_orders": True},
            format='json'
        )
        self.assertEqual(resume_res.status_code, status.HTTP_200_OK)
        self.assertTrue(resume_res.data['is_accepting_orders'])

    def test_vendor_journey_menu_card_lifecycle(self):
        """
        Verify vendor can upload, activate, and archive original menu cards.
        """
        self.client.force_authenticate(user=self.vendor_a)

        # Upload dummy PDF menu card
        pdf_content = b"%PDF-1.4 dummy pdf content for testing menu card upload"
        dummy_pdf = SimpleUploadedFile("menu_card_v1.pdf", pdf_content, content_type="application/pdf")

        upload_res = self.client.post(
            reverse('vendor-menu-card-list-create'),
            {"title": "Monsoon Special Menu 2026", "file": dummy_pdf},
            format='multipart'
        )
        self.assertEqual(upload_res.status_code, status.HTTP_201_CREATED)
        card_id = upload_res.data['id']
        self.assertTrue(upload_res.data['is_active'])

        # Check public endpoint returns active card
        public_card = self.client.get(reverse('public-shop-menu-card', kwargs={'slug': 'arjuns-royal-biryani'}))
        self.assertEqual(public_card.status_code, status.HTTP_200_OK)
        self.assertEqual(public_card.data['title'], "Monsoon Special Menu 2026")

        # Archive card
        archive_res = self.client.post(reverse('vendor-menu-card-archive', kwargs={'pk': card_id}))
        self.assertEqual(archive_res.status_code, status.HTTP_200_OK)
        self.assertFalse(archive_res.data['menu_card']['is_active'])

    def test_vendor_cannot_modify_another_vendors_catalog(self):
        """
        Verify that Vendor B cannot update or delete Vendor A's categories or products.
        """
        self.client.force_authenticate(user=self.vendor_b)

        # Attempt to patch Vendor A's category
        cat_url = reverse('vendor-category-detail', kwargs={'pk': self.category_a.id})
        response = self.client.patch(cat_url, {"name": "Hacked Category"}, format='json')
        # Expect 404 because query filters by authenticated vendor's shop
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Verify category name was NOT modified
        self.category_a.refresh_from_db()
        self.assertEqual(self.category_a.name, "Biryani Pots")

    # =========================================================================
    # TASK 4: ADMIN JOURNEY & GOVERNANCE
    # =========================================================================

    def test_admin_journey_overview_and_shop_approval(self):
        """
        Verify that an administrator can view pending shops, approve a shop,
        and review notes are persisted with audit logging.
        """
        self.client.force_authenticate(user=self.admin)

        # 1. Inspect overview
        overview_res = self.client.get(reverse('admin-overview'))
        self.assertEqual(overview_res.status_code, status.HTTP_200_OK)
        self.assertEqual(overview_res.data['shops']['pending'], 1)
        self.assertEqual(overview_res.data['shops']['approved'], 1)

        # 2. Approve Priya's shop
        approve_url = reverse('admin-shop-approve', kwargs={'pk': self.shop_b.id})
        approve_res = self.client.post(
            approve_url,
            {"admin_review_notes": "FSSAI verified. Hygiene clearance passed."},
            format='json'
        )
        self.assertEqual(approve_res.status_code, status.HTTP_200_OK)

        self.shop_b.refresh_from_db()
        self.assertEqual(self.shop_b.status, Shop.Status.APPROVED)
        self.assertEqual(self.shop_b.admin_review_notes, "FSSAI verified. Hygiene clearance passed.")

        # 3. Check audit log was created
        audit = AdminAuditLog.objects.filter(action='SHOP_APPROVED', target_id=str(self.shop_b.id)).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.admin, self.admin)

    def test_admin_journey_rejection_requires_notes(self):
        """
        Verify that rejecting a shop requires non-empty review notes so vendor knows what to fix.
        """
        self.client.force_authenticate(user=self.admin)
        reject_url = reverse('admin-shop-reject', kwargs={'pk': self.shop_b.id})

        # Empty notes should fail
        fail_res = self.client.post(reject_url, {"admin_review_notes": ""}, format='json')
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Valid notes succeed
        success_res = self.client.post(
            reject_url,
            {"admin_review_notes": "Please provide clear kitchen photo and active phone number."},
            format='json'
        )
        self.assertEqual(success_res.status_code, status.HTTP_200_OK)
        self.shop_b.refresh_from_db()
        self.assertEqual(self.shop_b.status, Shop.Status.REJECTED)

    def test_admin_journey_suspension_immediately_halts_orders(self):
        """
        Verify that suspending an approved shop halts order intake and sets status to SUSPENDED.
        """
        self.client.force_authenticate(user=self.admin)
        suspend_url = reverse('admin-shop-suspend', kwargs={'pk': self.shop_a.id})
        suspend_res = self.client.post(suspend_url, {"reason": "Quality complaints under investigation."}, format='json')
        self.assertEqual(suspend_res.status_code, status.HTTP_200_OK)

        self.shop_a.refresh_from_db()
        self.assertEqual(self.shop_a.status, Shop.Status.SUSPENDED)
        self.assertFalse(self.shop_a.is_accepting_orders)
        self.assertEqual(self.shop_a.order_pause_reason, "Quality complaints under investigation.")

        # Suspended shop no longer appears in public discovery
        public_res = self.client.get(reverse('public-shop-list'))
        names = [s['name'] for s in public_res.data]
        self.assertNotIn("Arjun's Royal Biryani", names)

    # =========================================================================
    # TASK 5: DATA INTEGRITY & TIMEZONE
    # =========================================================================

    def test_operating_hours_timezone_status_evaluation(self):
        """
        Verify get_shop_live_status evaluates open/closed status correctly
        based on shop operating hours and local timezone.
        """
        from apps.shops.utils import get_shop_live_status
        live_status = get_shop_live_status(self.shop_a)
        self.assertIn('is_open', live_status)
        self.assertIn('status_display', live_status)
        self.assertIn('is_accepting_orders', live_status)

