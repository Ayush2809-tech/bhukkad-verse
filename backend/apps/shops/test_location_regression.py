from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from .models import Shop

User = get_user_model()

class HonestLocationDiscoveryRegressionTests(TestCase):
    """
    Focused regression tests for honest location handling:
    1. Zero coordinates passed -> distance_km and is_deliverable MUST be None (no fake location assumed).
    2. Valid customer coordinates -> exact Haversine calculation and deliverability check.
    3. Customer outside delivery radius -> is_deliverable is False.
    4. deliverable_only=true filter -> excludes out-of-range shops cleanly.
    5. Malformed or non-float coordinates -> graceful fallback to unannotated shop list without 500 error.
    """

    def setUp(self):
        self.client = APIClient()
        self.vendor = User.objects.create_user(
            username='loc_vendor',
            email='vendor@location.local',
            password='VendorPass123!',
            role=User.Role.VENDOR
        )

        # Shop located in Connaught Place, New Delhi (lat=28.6289, lng=77.2065), radius=5km
        self.shop = Shop.objects.create(
            owner=self.vendor,
            name="Delhi Dawat Kitchen",
            slug="delhi-dawat-kitchen",
            phone="+919876543210",
            email="delhi@dawat.local",
            address_line="Connaught Place Outer Circle",
            city="New Delhi",
            postal_code="110001",
            latitude=28.628900,
            longitude=77.206500,
            delivery_radius_km=5.00,
            minimum_order_value=150.00,
            status=Shop.Status.APPROVED,
            is_active=True
        )

        self.url = reverse('public-shop-list')

    def test_no_coordinates_returns_none_for_distance_and_deliverability(self):
        """
        REGRESSION TEST:
        When a customer visits without sharing location or setting an address,
        the backend MUST NOT silently inject default coordinates or pretend to know distance.
        distance_km and is_deliverable must be null/None.
        """
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        shop_data = response.data[0]
        self.assertEqual(shop_data['id'], str(self.shop.id))
        self.assertIsNone(shop_data['distance_km'], "distance_km must be None when no coordinates provided")
        self.assertIsNone(shop_data['is_deliverable'], "is_deliverable must be None when no coordinates provided")

    def test_nearby_customer_gets_accurate_distance_and_deliverable_true(self):
        """
        Customer located ~1.5 km away (lat=28.6150, lng=77.2090) should see:
        - is_deliverable = True
        - distance_km approximately 1.5 - 1.7 km
        """
        response = self.client.get(f"{self.url}?lat=28.6150&lng=77.2090")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        shop_data = response.data[0]
        self.assertTrue(shop_data['is_deliverable'])
        self.assertIsNotNone(shop_data['distance_km'])
        self.assertAlmostEqual(shop_data['distance_km'], 1.56, delta=0.3)

    def test_distant_customer_gets_deliverable_false(self):
        """
        Customer located 25 km away in Gurgaon (lat=28.4595, lng=77.0266) is outside the 5km radius:
        - is_deliverable = False
        - distance_km > 20 km
        """
        response = self.client.get(f"{self.url}?lat=28.4595&lng=77.0266")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        shop_data = response.data[0]
        self.assertFalse(shop_data['is_deliverable'])
        self.assertGreater(shop_data['distance_km'], 20.0)

    def test_deliverable_only_filter_excludes_out_of_range_shops(self):
        """
        When deliverable_only=true is passed with distant coordinates,
        the shop outside radius must be filtered out, returning an empty list.
        """
        response = self.client.get(f"{self.url}?lat=28.4595&lng=77.0266&deliverable_only=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0, "Out-of-range shop should be excluded by deliverable_only")

    def test_invalid_coordinates_handled_gracefully(self):
        """
        Passing non-numeric coordinates (e.g. lat=abc&lng=xyz) must not raise 500.
        It should gracefully fallback to returning shops with null distance.
        """
        response = self.client.get(f"{self.url}?lat=invalid_lat&lng=invalid_lng")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIsNone(response.data[0]['distance_km'])
        self.assertIsNone(response.data[0]['is_deliverable'])

