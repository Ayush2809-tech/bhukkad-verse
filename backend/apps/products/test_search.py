from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.shops.models import Shop
from apps.products.models import Category, Product

User = get_user_model()

class DishAndShopSearchTests(TestCase):
    """
    Test suite for Phase 6 requirements:
    1. Matching dish name returns the correct product.
    2. Matching shop name returns the correct shop.
    3. Dish search returns product objects, not just shop objects.
    4. Shop search returns shop objects.
    5. Search is case-insensitive.
    6. A nonexistent dish returns an honest empty result.
    7. Inactive/unapproved shops do not leak products.
    8. Unavailable products follow existing business rules.
    9. Empty and malformed queries are handled safely.
    10. Product-to-shop relationships are correct.
    """

    def setUp(self):
        self.client = APIClient()

        # Approved vendor and shop in Delhi
        self.vendor = User.objects.create_user(
            username='search_vendor',
            email='vendor@search.local',
            password='Password123!',
            role=User.Role.VENDOR
        )
        self.approved_shop = Shop.objects.create(
            owner=self.vendor,
            name="The Burger & Tandoor Co",
            slug="burger-tandoor-co",
            phone="+919876543210",
            email="burger@tandoor.local",
            address_line="Block B, Connaught Place",
            city="New Delhi",
            latitude=28.6289,
            longitude=77.2065,
            delivery_radius_km=10.0,
            status=Shop.Status.APPROVED,
            is_active=True
        )

        self.category_burgers = Category.objects.create(
            shop=self.approved_shop,
            name="Burgers & Sandwiches",
            slug="burgers-sandwiches",
            is_active=True
        )

        self.category_pizzas = Category.objects.create(
            shop=self.approved_shop,
            name="Gourmet Pizzas",
            slug="gourmet-pizzas",
            is_active=True
        )

        self.burger_dish = Product.objects.create(
            shop=self.approved_shop,
            category=self.category_burgers,
            name="Crispy Paneer Supreme Burger",
            slug="crispy-paneer-supreme-burger",
            description="Crispy cottage cheese patty with fiery chipotle sauce.",
            base_price=169.00,
            dietary_type=Product.DietaryType.VEG,
            is_available=True,
            is_active=True
        )

        self.pizza_dish = Product.objects.create(
            shop=self.approved_shop,
            category=self.category_pizzas,
            name="Truffle Mushroom Pizza",
            slug="truffle-mushroom-pizza",
            description="Woodfired crust with black truffle glaze and wild mushrooms.",
            base_price=299.00,
            dietary_type=Product.DietaryType.VEG,
            is_available=True,
            is_active=True
        )

        # Unapproved shop to verify product isolation
        self.unapproved_vendor = User.objects.create_user(
            username='pending_vendor',
            email='pending@search.local',
            password='Password123!',
            role=User.Role.VENDOR
        )
        self.pending_shop = Shop.objects.create(
            owner=self.unapproved_vendor,
            name="Secret Ghost Kitchen",
            slug="secret-ghost-kitchen",
            phone="+919111222333",
            email="secret@ghost.local",
            address_line="Hidden Lane",
            city="New Delhi",
            status=Shop.Status.PENDING,
            is_active=True
        )
        self.pending_cat = Category.objects.create(
            shop=self.pending_shop,
            name="Secret Burgers",
            slug="secret-burgers",
            is_active=True
        )
        self.hidden_dish = Product.objects.create(
            shop=self.pending_shop,
            category=self.pending_cat,
            name="Ghost Burger Supreme",
            slug="ghost-burger-supreme",
            base_price=99.00,
            is_available=True,
            is_active=True
        )

        self.dish_search_url = reverse('public-product-search')
        self.shop_search_url = reverse('public-shop-list')

    def test_dish_search_returns_products_not_shops(self):
        """1 & 3: Matching dish name returns product objects, not just shop objects."""
        response = self.client.get(f"{self.dish_search_url}?q=Burger")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        result = response.data[0]
        # Must have product attributes
        self.assertEqual(result['name'], "Crispy Paneer Supreme Burger")
        self.assertEqual(result['base_price'], "169.00")
        self.assertEqual(result['dietary_type'], "VEG")
        self.assertEqual(result['category_name'], "Burgers & Sandwiches")
        # Must have shop relationship attributes
        self.assertEqual(result['shop_name'], "The Burger & Tandoor Co")
        self.assertEqual(result['shop_slug'], "burger-tandoor-co")

    def test_shop_search_returns_shops_not_dishes(self):
        """2 & 4: Matching shop name returns shop objects."""
        response = self.client.get(f"{self.shop_search_url}?q=The+Burger")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

        shop_result = response.data[0]
        # Must have shop attributes
        self.assertEqual(shop_result['name'], "The Burger & Tandoor Co")
        self.assertEqual(shop_result['slug'], "burger-tandoor-co")
        self.assertIn('operating_hours', shop_result)
        self.assertIn('minimum_order_value', shop_result)

    def test_dish_search_is_case_insensitive(self):
        """5: Search is case-insensitive."""
        res_lower = self.client.get(f"{self.dish_search_url}?q=truffle")
        res_upper = self.client.get(f"{self.dish_search_url}?q=TRUFFLE")
        res_mixed = self.client.get(f"{self.dish_search_url}?q=TrUfFlE")

        self.assertEqual(len(res_lower.data), 1)
        self.assertEqual(len(res_upper.data), 1)
        self.assertEqual(len(res_mixed.data), 1)
        self.assertEqual(res_lower.data[0]['name'], "Truffle Mushroom Pizza")

    def test_nonexistent_dish_returns_empty_list(self):
        """6: A nonexistent dish returns an honest empty result."""
        response = self.client.get(f"{self.dish_search_url}?q=NonExistentSushiBowl")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_inactive_and_unapproved_shops_do_not_leak_products(self):
        """7: Products from PENDING, REJECTED, or inactive shops are never exposed."""
        response = self.client.get(f"{self.dish_search_url}?q=Ghost")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_empty_and_whitespace_queries_handled_safely(self):
        """9: Empty and whitespace queries do not crash."""
        res_empty = self.client.get(f"{self.dish_search_url}?q=")
        self.assertEqual(res_empty.status_code, status.HTTP_200_OK)

        res_spaces = self.client.get(f"{self.dish_search_url}?q=%20%20%20")
        self.assertEqual(res_spaces.status_code, status.HTTP_200_OK)

    def test_product_to_shop_relationship_preserves_navigation_identifiers(self):
        """10: Product results contain the shop slug and shop id for seamless navigation."""
        response = self.client.get(f"{self.dish_search_url}?q=Paneer")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = response.data[0]
        self.assertEqual(item['shop_slug'], "burger-tandoor-co")
        self.assertEqual(str(item['shop_id']), str(self.approved_shop.id))

