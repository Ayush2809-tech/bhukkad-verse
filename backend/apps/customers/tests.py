from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from apps.shops.models import Shop
from apps.customers.models import CustomerAddress

User = get_user_model()

class CustomerAddressAndServiceabilityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Customer 1
        self.customer1 = User.objects.create_user(
            username='cust_alex',
            email='alex@example.com',
            password='Password123!',
            role=User.Role.CUSTOMER
        )

        # Customer 2
        self.customer2 = User.objects.create_user(
            username='cust_priya',
            email='priya@example.com',
            password='Password123!',
            role=User.Role.CUSTOMER
        )

        # Vendor and Approved Shop
        self.vendor = User.objects.create_user(
            username='vendor_rohit',
            email='rohit@example.com',
            password='Password123!',
            role=User.Role.VENDOR
        )
        self.shop = Shop.objects.create(
            owner=self.vendor,
            name="Delhi Darbar Express",
            slug="delhi-darbar-express",
            phone="9876543210",
            email="rohit@example.com",
            address_line="Connaught Place Block B",
            city="New Delhi",
            postal_code="110001",
            latitude=Decimal("28.631500"),
            longitude=Decimal("77.216700"),
            delivery_radius_km=Decimal("5.00"),
            status=Shop.Status.APPROVED,
            is_active=True,
            is_accepting_orders=True
        )

    def test_create_customer_address_auto_default(self):
        self.client.force_authenticate(user=self.customer1)
        payload = {
            "label": "HOME",
            "recipient_name": "Alex Smith",
            "recipient_phone": "9876500000",
            "address_line1": "Flat 402, Sunshine Heights",
            "address_line2": "Barakhamba Road",
            "landmark": "Near Metro Gate 2",
            "city": "New Delhi",
            "state": "Delhi",
            "postal_code": "110001",
            "latitude": "28.632000",
            "longitude": "77.220000",
            "delivery_instructions": "Leave with security guard",
        }
        res = self.client.post('/api/v1/customer/addresses/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['recipient_name'], "Alex Smith")
        # First address should automatically be default
        self.assertTrue(res.data['is_default'])

    def test_customer_address_user_isolation(self):
        # Create address for Customer 1
        addr1 = CustomerAddress.objects.create(
            user=self.customer1,
            label=CustomerAddress.Label.HOME,
            recipient_name="Alex Smith",
            recipient_phone="9876500000",
            address_line1="Flat 402, Sunshine Heights",
            city="New Delhi",
            postal_code="110001",
            latitude=Decimal("28.632000"),
            longitude=Decimal("77.220000"),
            is_default=True
        )

        # Authenticate as Customer 2
        self.client.force_authenticate(user=self.customer2)
        # Attempt to get customer 1's address
        res = self.client.get(f'/api/v1/customer/addresses/{addr1.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        # Customer 2's list should be empty
        list_res = self.client.get('/api/v1/customer/addresses/')
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 0)

    def test_default_address_switch(self):
        addr1 = CustomerAddress.objects.create(
            user=self.customer1,
            label=CustomerAddress.Label.HOME,
            recipient_name="Alex Home",
            recipient_phone="9876500000",
            address_line1="House 1",
            city="New Delhi",
            postal_code="110001",
            latitude=Decimal("28.632000"),
            longitude=Decimal("77.220000"),
            is_default=True
        )
        addr2 = CustomerAddress.objects.create(
            user=self.customer1,
            label=CustomerAddress.Label.WORK,
            recipient_name="Alex Work",
            recipient_phone="9876500000",
            address_line1="Office 2",
            city="New Delhi",
            postal_code="110001",
            latitude=Decimal("28.635000"),
            longitude=Decimal("77.225000"),
            is_default=False
        )

        self.client.force_authenticate(user=self.customer1)
        res = self.client.post(f'/api/v1/customer/addresses/{addr2.id}/set-default/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        addr1.refresh_from_db()
        addr2.refresh_from_db()
        self.assertFalse(addr1.is_default)
        self.assertTrue(addr2.is_default)

    def test_soft_delete_address(self):
        addr = CustomerAddress.objects.create(
            user=self.customer1,
            label=CustomerAddress.Label.HOME,
            recipient_name="Alex Home",
            recipient_phone="9876500000",
            address_line1="House 1",
            city="New Delhi",
            postal_code="110001",
            latitude=Decimal("28.632000"),
            longitude=Decimal("77.220000"),
            is_default=True
        )
        self.client.force_authenticate(user=self.customer1)
        res = self.client.delete(f'/api/v1/customer/addresses/{addr.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        addr.refresh_from_db()
        self.assertFalse(addr.is_active)
        self.assertFalse(addr.is_default)

    def test_haversine_serviceability_within_radius(self):
        # Customer is at Mandi House (~1.2 km away from shop in CP)
        # Shop has 5.0 km delivery radius
        mandi_house_lat = "28.6256"
        mandi_house_lng = "77.2345"

        res = self.client.get(f'/api/v1/shops/?lat={mandi_house_lat}&lng={mandi_house_lng}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

        shop_data = res.data[0]
        self.assertIsNotNone(shop_data['distance_km'])
        self.assertTrue(shop_data['is_deliverable'])
        # Distance should be around 1.8 - 2.2 km
        self.assertLess(shop_data['distance_km'], 5.0)

    def test_haversine_serviceability_out_of_radius(self):
        # Customer is in Noida Sector 62 (~15 km away from shop in CP)
        # Shop has 5.0 km delivery radius
        noida_lat = "28.6280"
        noida_lng = "77.3649"

        # 1. Query without deliverable_only: returns shop, but marked is_deliverable=False
        res = self.client.get(f'/api/v1/shops/?lat={noida_lat}&lng={noida_lng}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        shop_data = res.data[0]
        self.assertFalse(shop_data['is_deliverable'])
        self.assertGreater(shop_data['distance_km'], 10.0)

        # 2. Query with deliverable_only=true: excludes out-of-range shop
        filtered_res = self.client.get(f'/api/v1/shops/?lat={noida_lat}&lng={noida_lng}&deliverable_only=true')
        self.assertEqual(filtered_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(filtered_res.data), 0)
