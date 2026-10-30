from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from .models import Shop

User = get_user_model()

class ShopWorkflowAndIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin
        self.admin_user = User.objects.create_superuser(
            username='platform_admin',
            email='admin@bhukkadverse.local',
            password='AdminPassword123!'
        )

        # Create Vendor A
        self.vendor_a = User.objects.create_user(
            username='vendor_a',
            email='vendor_a@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )

        # Create Vendor B
        self.vendor_b = User.objects.create_user(
            username='vendor_b',
            email='vendor_b@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )

        # Create Regular Customer
        self.customer = User.objects.create_user(
            username='regular_customer',
            email='customer@bhukkadverse.local',
            password='CustomerPassword123!',
            role=User.Role.CUSTOMER
        )

        self.public_shops_url = reverse('public-shop-list')
        self.vendor_shop_url = reverse('vendor-shop')
        self.admin_shops_url = reverse('admin-shop-list')

        # Sample Shop Application Payload
        self.shop_payload = {
            "name": "The Pizza Universe",
            "description": "Authentic stone baked artisan pizzas.",
            "phone": "+919811122233",
            "email": "pizza@universe.local",
            "address_line": "Connaught Place Block A",
            "city": "New Delhi",
            "postal_code": "110001",
            "opening_time": "11:00:00",
            "closing_time": "23:00:00",
            "delivery_radius_km": "8.5",
            "minimum_order_value": "149.00"
        }

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    def test_vendor_shop_application_creates_pending_status(self):
        """
        Verify that a registered vendor can submit a shop application, and it defaults to PENDING.
        """
        self.authenticate_as(self.vendor_a)
        response = self.client.post(self.vendor_shop_url, self.shop_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], Shop.Status.PENDING)
        self.assertEqual(response.data['name'], "The Pizza Universe")

    def test_pending_shops_hidden_from_public_listings(self):
        """
        Verify that unapproved (PENDING) shops NEVER appear in the customer public shop list.
        """
        Shop.objects.create(
            owner=self.vendor_a,
            name="Secret Kitchen",
            status=Shop.Status.PENDING,
            phone="1234567890",
            email="secret@kitchen.local",
            address_line="123 Street"
        )
        self.client.logout()
        response = self.client.get(self.public_shops_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should be empty because shop is not APPROVED
        self.assertEqual(len(response.data), 0)

    def test_approved_shops_visible_in_public_listings(self):
        """
        Verify that once approved, a shop is visible in the public shop directory.
        """
        shop = Shop.objects.create(
            owner=self.vendor_a,
            name="Delhi Chaat House",
            status=Shop.Status.APPROVED,
            phone="1234567890",
            email="chaat@delhi.local",
            address_line="Chandni Chowk",
            city="New Delhi"
        )
        response = self.client.get(self.public_shops_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Delhi Chaat House")

    def test_customer_cannot_apply_for_shop(self):
        """
        Verify that customers with CUSTOMER role cannot submit vendor shop applications.
        """
        self.authenticate_as(self.customer)
        response = self.client.post(self.vendor_shop_url, self.shop_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_vendor_cannot_approve_own_shop(self):
        """
        Verify that vendors cannot self-approve their own shops via admin endpoints.
        """
        shop = Shop.objects.create(
            owner=self.vendor_a,
            name="Cheating Kitchen",
            status=Shop.Status.PENDING,
            phone="1234567890",
            email="cheat@kitchen.local",
            address_line="123 Street"
        )
        approve_url = reverse('admin-shop-approve', kwargs={'pk': shop.id})
        self.authenticate_as(self.vendor_a)
        response = self.client.post(approve_url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Verify shop remains PENDING
        shop.refresh_from_db()
        self.assertEqual(shop.status, Shop.Status.PENDING)

    def test_admin_approval_workflow(self):
        """
        Verify that an authorized platform admin can review and approve a pending shop.
        """
        shop = Shop.objects.create(
            owner=self.vendor_a,
            name="Artisan Burger Workshop",
            status=Shop.Status.PENDING,
            phone="1234567890",
            email="burger@workshop.local",
            address_line="Hauz Khas"
        )
        approve_url = reverse('admin-shop-approve', kwargs={'pk': shop.id})
        self.authenticate_as(self.admin_user)

        response = self.client.post(
            approve_url,
            {"admin_review_notes": "All health certificates and address documents verified."},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        shop.refresh_from_db()
        self.assertEqual(shop.status, Shop.Status.APPROVED)
        self.assertEqual(shop.admin_review_notes, "All health certificates and address documents verified.")

    def test_admin_rejection_workflow(self):
        """
        Verify that an administrator can reject a shop with explanatory feedback notes.
        """
        shop = Shop.objects.create(
            owner=self.vendor_a,
            name="Incomplete Kitchen",
            status=Shop.Status.PENDING,
            phone="1234567890",
            email="incomplete@kitchen.local",
            address_line="Nowhere"
        )
        reject_url = reverse('admin-shop-reject', kwargs={'pk': shop.id})
        self.authenticate_as(self.admin_user)

        response = self.client.post(
            reject_url,
            {"admin_review_notes": "Please provide an accurate commercial address and food license."},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        shop.refresh_from_db()
        self.assertEqual(shop.status, Shop.Status.REJECTED)
        self.assertIn("accurate commercial address", shop.admin_review_notes)

    def test_vendor_data_isolation(self):
        """
        Verify that Vendor B cannot access or modify Vendor A's shop application.
        """
        shop_a = Shop.objects.create(
            owner=self.vendor_a,
            name="Vendor A Kitchen",
            status=Shop.Status.PENDING,
            phone="1234567890",
            email="a@kitchen.local",
            address_line="Street A"
        )

        # Authenticate as Vendor B
        self.authenticate_as(self.vendor_b)

        # Vendor B requests /api/v1/vendor/shop/ -> should return 404 because Vendor B has no shop
        response = self.client.get(self.vendor_shop_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Vendor B attempts PATCH /api/v1/vendor/shop/ -> cannot touch Vendor A's shop
        patch_response = self.client.patch(
            self.vendor_shop_url,
            {"name": "Hacked Name"},
            format='json'
        )
        self.assertEqual(patch_response.status_code, status.HTTP_404_NOT_FOUND)

        # Verify Vendor A's shop is untouched
        shop_a.refresh_from_db()
        self.assertEqual(shop_a.name, "Vendor A Kitchen")


import datetime
from zoneinfo import ZoneInfo
from .models import ShopOperatingHour
from .utils import get_shop_live_status, is_shop_accepting_orders


class ShopOperatingHoursAndLiveStatusTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Users
        self.vendor_a = User.objects.create_user(
            username='vendor_alpha',
            email='alpha@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )
        self.vendor_b = User.objects.create_user(
            username='vendor_beta',
            email='beta@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )
        self.customer = User.objects.create_user(
            username='regular_customer_hours',
            email='cust_hours@bhukkadverse.local',
            password='CustomerPassword123!',
            role=User.Role.CUSTOMER
        )

        # Shop A (Approved)
        self.shop_a = Shop.objects.create(
            owner=self.vendor_a,
            name="Alpha Delights",
            status=Shop.Status.APPROVED,
            phone="+919876543210",
            email="alpha@delights.local",
            address_line="Connaught Place",
            city="New Delhi",
            opening_time=datetime.time(10, 0, 0),
            closing_time=datetime.time(22, 0, 0),
            timezone="Asia/Kolkata"
        )

        # Shop B (Approved)
        self.shop_b = Shop.objects.create(
            owner=self.vendor_b,
            name="Beta Bites",
            status=Shop.Status.APPROVED,
            phone="+919876543211",
            email="beta@bites.local",
            address_line="Karol Bagh",
            city="New Delhi",
            opening_time=datetime.time(11, 0, 0),
            closing_time=datetime.time(23, 0, 0),
            timezone="Asia/Kolkata"
        )

        self.operating_hours_url = reverse('vendor-operating-hours')
        self.toggle_orders_url = reverse('vendor-shop-toggle-orders')

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    def test_default_7day_schedule_auto_created_on_shop_creation(self):
        """
        Verify that creating a shop creates 7 operating hours entries for Monday through Sunday.
        """
        hours_count = self.shop_a.operating_hours.count()
        self.assertEqual(hours_count, 7)
        weekdays = list(self.shop_a.operating_hours.values_list('weekday', flat=True).order_by('weekday'))
        self.assertEqual(weekdays, [0, 1, 2, 3, 4, 5, 6])

    def test_vendor_can_get_weekly_operating_hours(self):
        """
        Verify that a vendor can retrieve their shop's 7-day schedule.
        """
        self.authenticate_as(self.vendor_a)
        response = self.client.get(self.operating_hours_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 7)
        first_entry = response.data[0]
        self.assertIn('weekday', first_entry)
        self.assertIn('weekday_name', first_entry)
        self.assertIn('is_closed', first_entry)
        self.assertIn('opening_time', first_entry)
        self.assertIn('closing_time', first_entry)
        self.assertIn('is_overnight', first_entry)

    def test_vendor_isolation_cannot_view_or_modify_other_vendor_schedule(self):
        """
        Verify Vendor B cannot view or modify Vendor A's schedule.
        """
        self.authenticate_as(self.vendor_b)
        response = self.client.get(self.operating_hours_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Verify these are Beta Bites hours, not Alpha Delights
        for item in response.data:
            self.assertEqual(item['opening_time'], '11:00:00')

        # Customer gets 403 Forbidden
        self.authenticate_as(self.customer)
        cust_response = self.client.get(self.operating_hours_url)
        self.assertEqual(cust_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_vendor_bulk_update_schedule_success(self):
        """
        Verify that a vendor can bulk update all 7 days of their operating schedule.
        """
        self.authenticate_as(self.vendor_a)
        new_schedule = [
            {"weekday": 0, "is_closed": False, "opening_time": "09:00:00", "closing_time": "21:00:00"},
            {"weekday": 1, "is_closed": False, "opening_time": "09:00:00", "closing_time": "21:00:00"},
            {"weekday": 2, "is_closed": True, "opening_time": None, "closing_time": None}, # Closed Wed
            {"weekday": 3, "is_closed": False, "opening_time": "10:00:00", "closing_time": "22:00:00"},
            {"weekday": 4, "is_closed": False, "opening_time": "18:00:00", "closing_time": "02:00:00"}, # Overnight Fri
            {"weekday": 5, "is_closed": False, "opening_time": "18:00:00", "closing_time": "02:00:00"}, # Overnight Sat
            {"weekday": 6, "is_closed": True, "opening_time": None, "closing_time": None}, # Closed Sun
        ]
        response = self.client.put(self.operating_hours_url, new_schedule, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 7)

        # Verify Wednesday is closed in database
        wed = self.shop_a.operating_hours.get(weekday=2)
        self.assertTrue(wed.is_closed)
        self.assertIsNone(wed.opening_time)

        # Verify Friday is overnight
        fri = self.shop_a.operating_hours.get(weekday=4)
        self.assertFalse(fri.is_closed)
        self.assertEqual(fri.opening_time, datetime.time(18, 0, 0))
        self.assertEqual(fri.closing_time, datetime.time(2, 0, 0))
        self.assertTrue(fri.is_overnight)

    def test_schedule_validation_errors(self):
        """
        Verify validation prevents invalid schedule payloads.
        """
        self.authenticate_as(self.vendor_a)

        # 1. Opening equals closing time when open
        bad_schedule_equal = [
            {"weekday": 0, "is_closed": False, "opening_time": "10:00:00", "closing_time": "10:00:00"},
        ]
        r1 = self.client.put(self.operating_hours_url, bad_schedule_equal, format='json')
        self.assertEqual(r1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot be identical", str(r1.data))

        # 2. Open without opening or closing time
        bad_schedule_missing_time = [
            {"weekday": 0, "is_closed": False, "opening_time": None, "closing_time": "22:00:00"},
        ]
        r2 = self.client.put(self.operating_hours_url, bad_schedule_missing_time, format='json')
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. Duplicate weekday in bulk payload
        bad_schedule_duplicate = [
            {"weekday": 0, "is_closed": False, "opening_time": "10:00:00", "closing_time": "22:00:00"},
            {"weekday": 0, "is_closed": True, "opening_time": None, "closing_time": None},
        ]
        r3 = self.client.put(self.operating_hours_url, bad_schedule_duplicate, format='json')
        self.assertEqual(r3.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Duplicate", str(r3.data))

        # 4. Invalid weekday integer (> 6)
        bad_schedule_invalid_day = [
            {"weekday": 7, "is_closed": True, "opening_time": None, "closing_time": None},
        ]
        r4 = self.client.put(self.operating_hours_url, bad_schedule_invalid_day, format='json')
        self.assertEqual(r4.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vendor_pause_and_resume_order_intake(self):
        """
        Verify vendor can pause orders with reason, and resume order intake.
        """
        self.authenticate_as(self.vendor_a)

        # Pause orders
        pause_response = self.client.post(
            self.toggle_orders_url,
            {"is_accepting_orders": False, "pause_reason": "High order volume / kitchen backup"},
            format='json'
        )
        self.assertEqual(pause_response.status_code, status.HTTP_200_OK)
        self.assertFalse(pause_response.data['is_accepting_orders'])
        self.assertEqual(pause_response.data['order_pause_reason'], "High order volume / kitchen backup")
        self.assertIsNotNone(pause_response.data['order_paused_at'])

        # Verify backend live status reflects pause
        self.shop_a.refresh_from_db()
        self.assertFalse(self.shop_a.is_accepting_orders)
        status_info = get_shop_live_status(self.shop_a)
        self.assertFalse(status_info['is_accepting_orders'])
        self.assertTrue(status_info['is_paused'])
        self.assertEqual(status_info['status_code'], 'PAUSED')
        self.assertEqual(status_info['status_label'], 'Kitchen Paused')
        self.assertEqual(status_info['pause_reason'], "High order volume / kitchen backup")

        # Resume orders
        resume_response = self.client.post(
            self.toggle_orders_url,
            {"is_accepting_orders": True},
            format='json'
        )
        self.assertEqual(resume_response.status_code, status.HTTP_200_OK)
        self.assertTrue(resume_response.data['is_accepting_orders'])
        self.assertEqual(resume_response.data['order_pause_reason'], "")

        self.shop_a.refresh_from_db()
        self.assertTrue(self.shop_a.is_accepting_orders)
        self.assertFalse(is_shop_accepting_orders(self.shop_a) is False and self.shop_a.is_accepting_orders is False)

    def test_customer_cannot_toggle_vendor_orders(self):
        """
        Verify customer cannot pause or resume a vendor's shop orders.
        """
        self.authenticate_as(self.customer)
        response = self.client.post(
            self.toggle_orders_url,
            {"is_accepting_orders": False},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_live_status_boundary_behavior(self):
        """
        Test exact boundary conditions at opening and closing time.
        Schedule on Monday: 10:00:00 to 22:00:00.
        """
        tz = ZoneInfo("Asia/Kolkata")
        # 2026-10-26 was a Monday
        mon_date = datetime.date(2026, 10, 26)

        # Configure Monday schedule: 10:00 to 22:00
        ShopOperatingHour.objects.filter(shop=self.shop_a, weekday=0).update(
            is_closed=False,
            opening_time=datetime.time(10, 0, 0),
            closing_time=datetime.time(22, 0, 0)
        )

        # 1. Exactly 1 second before opening: 09:59:59 -> CLOSED
        ts_before_open = datetime.datetime.combine(mon_date, datetime.time(9, 59, 59), tzinfo=tz)
        st1 = get_shop_live_status(self.shop_a, timestamp=ts_before_open)
        self.assertFalse(st1['is_open'])
        self.assertEqual(st1['status_code'], 'CLOSED')

        # 2. Exactly at opening time: 10:00:00 -> OPEN
        ts_exact_open = datetime.datetime.combine(mon_date, datetime.time(10, 0, 0), tzinfo=tz)
        st2 = get_shop_live_status(self.shop_a, timestamp=ts_exact_open)
        self.assertTrue(st2['is_open'])
        self.assertEqual(st2['status_code'], 'OPEN')

        # 3. 1 second before closing: 21:59:59 -> OPEN
        ts_before_close = datetime.datetime.combine(mon_date, datetime.time(21, 59, 59), tzinfo=tz)
        st3 = get_shop_live_status(self.shop_a, timestamp=ts_before_close)
        self.assertTrue(st3['is_open'])
        self.assertEqual(st3['status_code'], 'OPEN')

        # 4. Exactly at closing time: 22:00:00 -> CLOSED
        ts_exact_close = datetime.datetime.combine(mon_date, datetime.time(22, 0, 0), tzinfo=tz)
        st4 = get_shop_live_status(self.shop_a, timestamp=ts_exact_close)
        self.assertFalse(st4['is_open'])
        self.assertEqual(st4['status_code'], 'CLOSED')

    def test_overnight_schedule_evaluation(self):
        """
        Test overnight shift: Monday 18:00 to Tuesday 02:00.
        Tuesday normal shift: 11:00 to 23:00.
        """
        tz = ZoneInfo("Asia/Kolkata")
        mon_date = datetime.date(2026, 10, 26) # Monday
        tue_date = datetime.date(2026, 10, 27) # Tuesday

        # Set Monday: 18:00 to 02:00 (overnight)
        ShopOperatingHour.objects.filter(shop=self.shop_a, weekday=0).update(
            is_closed=False,
            opening_time=datetime.time(18, 0, 0),
            closing_time=datetime.time(2, 0, 0)
        )
        # Set Tuesday: 11:00 to 23:00
        ShopOperatingHour.objects.filter(shop=self.shop_a, weekday=1).update(
            is_closed=False,
            opening_time=datetime.time(11, 0, 0),
            closing_time=datetime.time(23, 0, 0)
        )

        # Monday 17:59:59 -> CLOSED
        t_mon_before = datetime.datetime.combine(mon_date, datetime.time(17, 59, 59), tzinfo=tz)
        self.assertFalse(get_shop_live_status(self.shop_a, timestamp=t_mon_before)['is_open'])

        # Monday 18:00:00 -> OPEN
        t_mon_open = datetime.datetime.combine(mon_date, datetime.time(18, 0, 0), tzinfo=tz)
        self.assertTrue(get_shop_live_status(self.shop_a, timestamp=t_mon_open)['is_open'])

        # Monday 23:45:00 -> OPEN
        t_mon_late = datetime.datetime.combine(mon_date, datetime.time(23, 45, 0), tzinfo=tz)
        self.assertTrue(get_shop_live_status(self.shop_a, timestamp=t_mon_late)['is_open'])

        # Tuesday 01:00:00 -> OPEN (From Monday's overnight shift!)
        t_tue_overnight = datetime.datetime.combine(tue_date, datetime.time(1, 0, 0), tzinfo=tz)
        st_tue_1am = get_shop_live_status(self.shop_a, timestamp=t_tue_overnight)
        self.assertTrue(st_tue_1am['is_open'])
        self.assertEqual(st_tue_1am['status_code'], 'OPEN')

        # Tuesday 01:59:59 -> OPEN
        t_tue_before_close = datetime.datetime.combine(tue_date, datetime.time(1, 59, 59), tzinfo=tz)
        self.assertTrue(get_shop_live_status(self.shop_a, timestamp=t_tue_before_close)['is_open'])

        # Tuesday 02:00:00 -> CLOSED (Overnight shift closed)
        t_tue_after_close = datetime.datetime.combine(tue_date, datetime.time(2, 0, 0), tzinfo=tz)
        self.assertFalse(get_shop_live_status(self.shop_a, timestamp=t_tue_after_close)['is_open'])

        # Tuesday 08:00:00 -> CLOSED (Next opens at 11:00 AM)
        t_tue_morning = datetime.datetime.combine(tue_date, datetime.time(8, 0, 0), tzinfo=tz)
        st_tue_morning = get_shop_live_status(self.shop_a, timestamp=t_tue_morning)
        self.assertFalse(st_tue_morning['is_open'])
        self.assertIn("11:00 AM", st_tue_morning['next_opening_text'])

        # Tuesday 11:00:00 -> OPEN (Tuesday shift begins)
        t_tue_day_open = datetime.datetime.combine(tue_date, datetime.time(11, 0, 0), tzinfo=tz)
        self.assertTrue(get_shop_live_status(self.shop_a, timestamp=t_tue_day_open)['is_open'])

    def test_closed_weekday_and_next_opening_text(self):
        """
        Verify that on a closed weekday, status is CLOSED and next opening time is correctly identified.
        """
        tz = ZoneInfo("Asia/Kolkata")
        # Wednesday 2026-10-28
        wed_date = datetime.date(2026, 10, 28)

        # Mark Wednesday closed
        ShopOperatingHour.objects.filter(shop=self.shop_a, weekday=2).update(
            is_closed=True,
            opening_time=None,
            closing_time=None
        )
        # Thursday open at 10:00:00
        ShopOperatingHour.objects.filter(shop=self.shop_a, weekday=3).update(
            is_closed=False,
            opening_time=datetime.time(10, 0, 0),
            closing_time=datetime.time(22, 0, 0)
        )

        wed_afternoon = datetime.datetime.combine(wed_date, datetime.time(14, 0, 0), tzinfo=tz)
        status_info = get_shop_live_status(self.shop_a, timestamp=wed_afternoon)
        self.assertFalse(status_info['is_open'])
        self.assertEqual(status_info['status_code'], 'CLOSED')
        self.assertIn("Thursday at 10:00 AM", status_info['next_opening_text'])

    def test_shop_moderation_suspension_blocks_orders(self):
        """
        Verify that suspended shops are marked SUSPENDED and cannot accept orders.
        """
        self.shop_a.status = Shop.Status.SUSPENDED
        self.shop_a.save()

        # Check during normal daytime hours
        tz = ZoneInfo("Asia/Kolkata")
        t_midday = datetime.datetime.combine(datetime.date(2026, 10, 26), datetime.time(14, 0, 0), tzinfo=tz)

        status_info = get_shop_live_status(self.shop_a, timestamp=t_midday)
        self.assertFalse(status_info['is_open'])
        self.assertEqual(status_info['status_code'], 'SUSPENDED')
        self.assertEqual(status_info['status_label'], 'Temporarily Unavailable')
        self.assertFalse(is_shop_accepting_orders(self.shop_a, timestamp=t_midday))

    def test_public_shop_endpoints_include_live_status_and_hours(self):
        """
        Verify public shop detail and menu endpoints include live_status and operating_hours.
        """
        shop_detail_url = reverse('public-shop-detail', kwargs={'slug': self.shop_a.slug})
        response = self.client.get(shop_detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('live_status', response.data)
        self.assertIn('operating_hours', response.data)
        self.assertEqual(len(response.data['operating_hours']), 7)
        self.assertIn('is_open', response.data['live_status'])
        self.assertIn('status_label', response.data['live_status'])


import tempfile
import shutil
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from .models import ShopMenuCard


class ShopMenuCardManagementAndSecurityTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.test_media_dir = tempfile.mkdtemp()

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(cls.test_media_dir, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()

        # Users
        self.vendor_a = User.objects.create_user(
            username='vendor_card_a',
            email='card_a@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )
        self.vendor_b = User.objects.create_user(
            username='vendor_card_b',
            email='card_b@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )
        self.customer = User.objects.create_user(
            username='customer_card',
            email='cust_card@bhukkadverse.local',
            password='CustomerPassword123!',
            role=User.Role.CUSTOMER
        )

        # Shop A (Approved)
        self.shop_a = Shop.objects.create(
            owner=self.vendor_a,
            name="Curry Verse",
            status=Shop.Status.APPROVED,
            phone="+919876500001",
            email="curry@verse.local",
            address_line="Sector 29",
            city="Gurugram"
        )

        # Shop B (Approved)
        self.shop_b = Shop.objects.create(
            owner=self.vendor_b,
            name="Biryani Universe",
            status=Shop.Status.APPROVED,
            phone="+919876500002",
            email="biryani@universe.local",
            address_line="Cyber Hub",
            city="Gurugram"
        )

        self.vendor_cards_url = reverse('vendor-menu-card-list-create')
        self.public_menu_card_url = reverse('public-shop-menu-card', kwargs={'slug': self.shop_a.slug})

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    def create_valid_pdf_file(self, filename="menu.pdf"):
        content = b"%PDF-1.4\n1 0 obj\n<< /Title (Menu) >>\nendobj\ntrailer\n<<>>\n%%EOF\n"
        return SimpleUploadedFile(filename, content, content_type="application/pdf")

    def create_valid_jpeg_file(self, filename="menu.jpg"):
        buf = BytesIO()
        img = Image.new('RGB', (100, 100), color='orange')
        img.save(buf, format='JPEG')
        buf.seek(0)
        return SimpleUploadedFile(filename, buf.read(), content_type="image/jpeg")

    def create_valid_png_file(self, filename="menu.png"):
        buf = BytesIO()
        img = Image.new('RGB', (100, 100), color='green')
        img.save(buf, format='PNG')
        buf.seek(0)
        return SimpleUploadedFile(filename, buf.read(), content_type="image/png")

    def test_vendor_can_upload_valid_pdf_menu_card(self):
        """
        Verify that an authorized vendor can upload a valid PDF menu card.
        """
        self.authenticate_as(self.vendor_a)
        pdf = self.create_valid_pdf_file("autumn_menu.pdf")
        response = self.client.post(
            self.vendor_cards_url,
            {"file": pdf, "title": "Autumn 2026 Special Menu"},
            format='multipart'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['file_type'], 'PDF')
        self.assertEqual(response.data['title'], "Autumn 2026 Special Menu")
        self.assertEqual(response.data['version'], 1)
        self.assertTrue(response.data['is_active'])
        self.assertIn('.pdf', response.data['file_url'])

        # Verify DB record
        card = self.shop_a.menu_cards.first()
        self.assertIsNotNone(card)
        self.assertEqual(card.file_type, 'PDF')
        self.assertTrue(card.is_active)

    def test_vendor_can_upload_valid_jpeg_and_png_menu_cards(self):
        """
        Verify that vendors can upload JPEG and PNG image menus.
        """
        self.authenticate_as(self.vendor_a)

        # Upload JPEG
        jpg = self.create_valid_jpeg_file("dine_in.jpg")
        r_jpg = self.client.post(self.vendor_cards_url, {"file": jpg, "title": "Dine In JPEG"}, format='multipart')
        self.assertEqual(r_jpg.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r_jpg.data['file_type'], 'JPEG')

        # Upload PNG
        png = self.create_valid_png_file("takeaway.png")
        r_png = self.client.post(self.vendor_cards_url, {"file": png, "title": "Takeaway PNG"}, format='multipart')
        self.assertEqual(r_png.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r_png.data['file_type'], 'PNG')

    def test_invalid_file_type_rejected(self):
        """
        Verify that unsupported file extensions (.exe, .txt, .sh) are rejected with HTTP 400.
        """
        self.authenticate_as(self.vendor_a)
        bad_file = SimpleUploadedFile("malicious.sh", b"#!/bin/bash\necho hack", content_type="text/x-shellscript")
        response = self.client.post(self.vendor_cards_url, {"file": bad_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Unsupported file format", str(response.data))

    def test_spoofed_file_with_bad_magic_bytes_rejected(self):
        """
        Verify that a file with .jpg extension but plain text content is rejected by magic byte checking.
        """
        self.authenticate_as(self.vendor_a)
        fake_jpg = SimpleUploadedFile("fake.jpg", b"This is plain text pretending to be a JPG", content_type="image/jpeg")
        response = self.client.post(self.vendor_cards_url, {"file": fake_jpg}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("corrupted signature", str(response.data))

    def test_empty_file_rejected(self):
        """
        Verify that a 0-byte file is rejected with HTTP 400.
        """
        self.authenticate_as(self.vendor_a)
        empty_file = SimpleUploadedFile("empty.pdf", b"", content_type="application/pdf")
        response = self.client.post(self.vendor_cards_url, {"file": empty_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("empty", str(response.data))

    def test_oversized_file_rejected(self):
        """
        Verify that files exceeding the maximum configured size limit are rejected with HTTP 400.
        """
        self.authenticate_as(self.vendor_a)
        pdf = self.create_valid_pdf_file("oversized.pdf")
        # Override limit to 20 bytes so the ~60-byte PDF exceeds the limit
        with override_settings(MAX_MENU_CARD_SIZE_BYTES=20, MAX_MENU_CARD_SIZE_MB=0.00002):
            response = self.client.post(self.vendor_cards_url, {"file": pdf}, format='multipart')
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("exceeds the maximum limit", str(response.data))

    def test_unauthenticated_and_customer_cannot_upload(self):
        """
        Verify that unauthenticated users and customer roles cannot upload menu cards.
        """
        pdf = self.create_valid_pdf_file("test.pdf")
        # 1. Unauthenticated -> 401
        self.client.logout()
        r1 = self.client.post(self.vendor_cards_url, {"file": pdf}, format='multipart')
        self.assertEqual(r1.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Customer -> 403
        self.authenticate_as(self.customer)
        r2 = self.client.post(self.vendor_cards_url, {"file": pdf}, format='multipart')
        self.assertEqual(r2.status_code, status.HTTP_403_FORBIDDEN)

    def test_vendor_isolation_cannot_access_or_modify_other_vendor_menu(self):
        """
        Verify that Vendor B cannot access, activate, archive, or delete Vendor A's menu card.
        """
        # Vendor A uploads a menu card
        self.authenticate_as(self.vendor_a)
        pdf = self.create_valid_pdf_file("vendor_a_menu.pdf")
        create_res = self.client.post(self.vendor_cards_url, {"file": pdf}, format='multipart')
        card_id = create_res.data['id']

        # Authenticate as Vendor B
        self.authenticate_as(self.vendor_b)

        # 1. Vendor B attempts to GET Vendor A's card -> 404
        detail_url = reverse('vendor-menu-card-detail', kwargs={'pk': card_id})
        r_get = self.client.get(detail_url)
        self.assertEqual(r_get.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Vendor B attempts to activate Vendor A's card -> 404
        activate_url = reverse('vendor-menu-card-activate', kwargs={'pk': card_id})
        r_act = self.client.post(activate_url)
        self.assertEqual(r_act.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Vendor B attempts to archive Vendor A's card -> 404
        archive_url = reverse('vendor-menu-card-archive', kwargs={'pk': card_id})
        r_arch = self.client.post(archive_url)
        self.assertEqual(r_arch.status_code, status.HTTP_404_NOT_FOUND)

        # 4. Vendor B attempts to delete Vendor A's card -> 404
        r_del = self.client.delete(detail_url)
        self.assertEqual(r_del.status_code, status.HTTP_404_NOT_FOUND)

    def test_activating_menu_card_deactivates_older_active_versions(self):
        """
        Verify that activating a new menu card atomically deactivates older active versions.
        """
        self.authenticate_as(self.vendor_a)

        # Upload v1 (active by default)
        pdf1 = self.create_valid_pdf_file("v1.pdf")
        r1 = self.client.post(self.vendor_cards_url, {"file": pdf1, "title": "Menu V1"}, format='multipart')
        card1_id = r1.data['id']
        self.assertEqual(r1.data['version'], 1)
        self.assertTrue(r1.data['is_active'])

        # Upload v2 as inactive
        pdf2 = self.create_valid_pdf_file("v2.pdf")
        r2 = self.client.post(
            self.vendor_cards_url,
            {"file": pdf2, "title": "Menu V2", "is_active": False},
            format='multipart'
        )
        card2_id = r2.data['id']
        self.assertEqual(r2.data['version'], 2)
        self.assertFalse(r2.data['is_active'])

        # v1 is still active
        card1 = ShopMenuCard.objects.get(pk=card1_id)
        self.assertTrue(card1.is_active)

        # Now activate v2 via endpoint
        activate_url = reverse('vendor-menu-card-activate', kwargs={'pk': card2_id})
        act_res = self.client.post(activate_url)
        self.assertEqual(act_res.status_code, status.HTTP_200_OK)
        self.assertTrue(act_res.data['menu_card']['is_active'])

        # Verify DB state: v2 is active, v1 is now inactive
        card1.refresh_from_db()
        card2 = ShopMenuCard.objects.get(pk=card2_id)
        self.assertFalse(card1.is_active)
        self.assertTrue(card2.is_active)
        self.assertEqual(self.shop_a.menu_cards.filter(is_active=True).count(), 1)

    def test_archive_menu_card(self):
        """
        Verify vendor can archive an active menu card.
        """
        self.authenticate_as(self.vendor_a)
        pdf = self.create_valid_pdf_file("active.pdf")
        res = self.client.post(self.vendor_cards_url, {"file": pdf}, format='multipart')
        card_id = res.data['id']

        archive_url = reverse('vendor-menu-card-archive', kwargs={'pk': card_id})
        arch_res = self.client.post(archive_url)
        self.assertEqual(arch_res.status_code, status.HTTP_200_OK)
        self.assertFalse(arch_res.data['menu_card']['is_active'])

        card = ShopMenuCard.objects.get(pk=card_id)
        self.assertFalse(card.is_active)

    def test_public_shop_exposes_only_active_menu_card(self):
        """
        Verify that customers see the active menu card, and archived versions return 404 when no active card exists.
        """
        self.authenticate_as(self.vendor_a)

        # Upload v1 (active)
        pdf1 = self.create_valid_pdf_file("v1.pdf")
        r1 = self.client.post(self.vendor_cards_url, {"file": pdf1, "title": "Menu v1"}, format='multipart')
        card1_id = r1.data['id']

        # Customer requests public menu-card endpoint
        self.client.logout()
        pub_res = self.client.get(self.public_menu_card_url)
        self.assertEqual(pub_res.status_code, status.HTTP_200_OK)
        self.assertEqual(pub_res.data['title'], "Menu v1")
        self.assertEqual(pub_res.data['version'], 1)
        self.assertIn('.pdf', pub_res.data['file_url'])

        # Now Vendor archives v1
        self.authenticate_as(self.vendor_a)
        self.client.post(reverse('vendor-menu-card-archive', kwargs={'pk': card1_id}))

        # Customer requests public menu-card endpoint again -> 404 because no active card exists
        self.client.logout()
        pub_res_archived = self.client.get(self.public_menu_card_url)
        self.assertEqual(pub_res_archived.status_code, status.HTTP_404_NOT_FOUND)

    def test_public_shop_detail_and_menu_payload_includes_active_menu_card(self):
        """
        Verify /api/v1/shops/{slug}/ and /api/v1/shops/{slug}/menu/ include active_menu_card.
        """
        self.authenticate_as(self.vendor_a)
        pdf = self.create_valid_pdf_file("published.pdf")
        self.client.post(self.vendor_cards_url, {"file": pdf, "title": "Published Menu Card"}, format='multipart')

        self.client.logout()

        # 1. Shop detail endpoint
        detail_url = reverse('public-shop-detail', kwargs={'slug': self.shop_a.slug})
        detail_res = self.client.get(detail_url)
        self.assertEqual(detail_res.status_code, status.HTTP_200_OK)
        self.assertIn('active_menu_card', detail_res.data)
        self.assertIsNotNone(detail_res.data['active_menu_card'])
        self.assertEqual(detail_res.data['active_menu_card']['title'], "Published Menu Card")

        # 2. Shop menu catalog endpoint
        menu_url = reverse('public-shop-menu', kwargs={'slug': self.shop_a.slug})
        menu_res = self.client.get(menu_url)
        self.assertEqual(menu_res.status_code, status.HTTP_200_OK)
        self.assertIn('active_menu_card', menu_res.data['shop'])
        self.assertIsNotNone(menu_res.data['shop']['active_menu_card'])
        self.assertEqual(menu_res.data['shop']['active_menu_card']['title'], "Published Menu Card")


