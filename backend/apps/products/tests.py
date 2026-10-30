from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient
from apps.shops.models import Shop
from .models import Category, Product, ProductVariant, AddonGroup, AddonItem

User = get_user_model()

class ProductCatalogAndMenuTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Vendor A with an APPROVED shop
        self.vendor_a = User.objects.create_user(
            username='chef_mario',
            email='mario@crust.local',
            password='Password123!',
            role=User.Role.VENDOR
        )
        self.shop_a = Shop.objects.create(
            owner=self.vendor_a,
            name="Mario's Pizza Kitchen",
            status=Shop.Status.APPROVED,
            phone="9811122233",
            email="mario@crust.local",
            address_line="Connaught Place",
            city="New Delhi"
        )

        # Create Vendor B with a separate APPROVED shop
        self.vendor_b = User.objects.create_user(
            username='chef_luigi',
            email='luigi@burger.local',
            password='Password123!',
            role=User.Role.VENDOR
        )
        self.shop_b = Shop.objects.create(
            owner=self.vendor_b,
            name="Luigi's Burger Haven",
            status=Shop.Status.APPROVED,
            phone="9822233344",
            email="luigi@burger.local",
            address_line="Hauz Khas",
            city="New Delhi"
        )

        # Create Vendor C with an UNAPPROVED (PENDING) shop
        self.vendor_c = User.objects.create_user(
            username='chef_pending',
            email='pending@local.test',
            password='Password123!',
            role=User.Role.VENDOR
        )
        self.shop_c = Shop.objects.create(
            owner=self.vendor_c,
            name="Pending Ghost Kitchen",
            status=Shop.Status.PENDING,
            phone="9833344455",
            email="pending@local.test",
            address_line="Saket"
        )

        # URLs
        self.vendor_categories_url = reverse('vendor-categories-list')
        self.vendor_products_url = reverse('vendor-products-list')
        self.vendor_addon_groups_url = reverse('vendor-addon-groups-list')

    def authenticate_as(self, user):
        self.client.force_authenticate(user=user)

    # ---------------------------------------------------------
    # 1. CATEGORY TESTS
    # ---------------------------------------------------------

    def test_vendor_can_create_category(self):
        """
        Verify that an authenticated vendor can create a category for their own shop.
        """
        self.authenticate_as(self.vendor_a)
        payload = {
            "name": "Veg Pizzas",
            "description": "Stone baked thin crust delights",
            "display_order": 1
        }
        response = self.client.post(self.vendor_categories_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Veg Pizzas")
        self.assertEqual(response.data['slug'], "veg-pizzas")

    def test_cross_vendor_category_access_denied(self):
        """
        Verify that Vendor B cannot edit or delete Vendor A's category.
        """
        cat_a = Category.objects.create(
            shop=self.shop_a,
            name="Pizzas",
            slug="pizzas"
        )

        self.authenticate_as(self.vendor_b)
        detail_url = reverse('vendor-category-detail', kwargs={'pk': cat_a.id})

        # Attempt to view Vendor A's category
        res_get = self.client.get(detail_url)
        self.assertEqual(res_get.status_code, status.HTTP_404_NOT_FOUND)

        # Attempt to patch Vendor A's category
        res_patch = self.client.patch(detail_url, {"name": "Hacked Pizzas"}, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_404_NOT_FOUND)

        cat_a.refresh_from_db()
        self.assertEqual(cat_a.name, "Pizzas")

    # ---------------------------------------------------------
    # 2. PRODUCT & VARIANTS TESTS
    # ---------------------------------------------------------

    def test_vendor_can_create_product_with_category(self):
        """
        Verify that a vendor can create a food product belonging to their category.
        """
        cat = Category.objects.create(shop=self.shop_a, name="Burgers", slug="burgers")
        self.authenticate_as(self.vendor_a)

        payload = {
            "category": str(cat.id),
            "name": "Crispy Paneer Burger",
            "description": "Herb marinated patty with spicy chipotle.",
            "base_price": "149.00",
            "dietary_type": "VEG",
            "preparation_time_minutes": 15
        }
        response = self.client.post(self.vendor_products_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Crispy Paneer Burger")
        self.assertEqual(response.data['base_price'], "149.00")

    def test_vendor_cannot_assign_other_shops_category(self):
        """
        Verify that a vendor is blocked from assigning another vendor's category to their product.
        """
        cat_b = Category.objects.create(shop=self.shop_b, name="Luigi Shakes", slug="shakes")
        self.authenticate_as(self.vendor_a)

        payload = {
            "category": str(cat_b.id),
            "name": "Illegal Burger",
            "base_price": "199.00"
        }
        response = self.client.post(self.vendor_products_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", response.data)

    def test_product_variants_pricing_and_lifecycle(self):
        """
        Verify creating variants (Regular ₹99, Medium ₹179, Large ₹299) and decimal validation.
        """
        cat = Category.objects.create(shop=self.shop_a, name="Pizzas", slug="pizzas")
        product = Product.objects.create(
            shop=self.shop_a,
            category=cat,
            name="Margherita Pizza",
            base_price="99.00"
        )

        self.authenticate_as(self.vendor_a)
        variants_url = reverse('vendor-variants-list', kwargs={'product_id': product.id})

        # Add Regular variant
        res1 = self.client.post(variants_url, {"name": "Regular", "price": "99.00", "is_default": True}, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Add Medium variant
        res2 = self.client.post(variants_url, {"name": "Medium", "price": "179.00"}, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        # Add Large variant
        res3 = self.client.post(variants_url, {"name": "Large", "price": "299.00"}, format='json')
        self.assertEqual(res3.status_code, status.HTTP_201_CREATED)

        product.refresh_from_db()
        self.assertTrue(product.has_variants)
        self.assertEqual(product.variants.count(), 3)

        # Verify negative price is rejected
        res_neg = self.client.post(variants_url, {"name": "Freebie", "price": "-50.00"}, format='json')
        self.assertEqual(res_neg.status_code, status.HTTP_400_BAD_REQUEST)

    # ---------------------------------------------------------
    # 3. ADD-ON GROUPS & ITEMS TESTS
    # ---------------------------------------------------------

    def test_addon_group_creation_and_limits(self):
        """
        Verify creating an AddonGroup with choices and enforcing selection limits.
        """
        self.authenticate_as(self.vendor_a)
        group_payload = {
            "name": "Crust Customization",
            "min_selections": 0,
            "max_selections": 1,
            "is_required": False
        }
        res_group = self.client.post(self.vendor_addon_groups_url, group_payload, format='json')
        self.assertEqual(res_group.status_code, status.HTTP_201_CREATED)
        group_id = res_group.data['id']

        # Add items to the group
        items_url = reverse('vendor-addon-items-list', kwargs={'group_id': group_id})
        res_item = self.client.post(items_url, {"name": "Cheese Burst", "price": "60.00"}, format='json')
        self.assertEqual(res_item.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_item.data['price'], "60.00")

        # Invalid limits: min > max
        res_invalid = self.client.post(self.vendor_addon_groups_url, {
            "name": "Bad Group",
            "min_selections": 3,
            "max_selections": 1
        }, format='json')
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)

    def test_vendor_cannot_assign_other_shops_addon_group(self):
        """
        Verify that a product cannot be linked to another vendor's add-on group.
        """
        group_b = AddonGroup.objects.create(shop=self.shop_b, name="Luigi Sauces")
        cat_a = Category.objects.create(shop=self.shop_a, name="Pastas", slug="pastas")

        self.authenticate_as(self.vendor_a)
        payload = {
            "category": str(cat_a.id),
            "name": "White Sauce Penne",
            "base_price": "180.00",
            "addon_groups": [str(group_b.id)]
        }
        response = self.client.post(self.vendor_products_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("addon_groups", response.data)

    # ---------------------------------------------------------
    # 4. PUBLIC STOREFRONT MENU VISIBILITY TESTS
    # ---------------------------------------------------------

    def test_public_menu_returns_active_categories_and_products(self):
        """
        Verify that GET /api/v1/shops/{slug}/menu/ returns active categories, products,
        variants, and addon groups for an approved shop.
        """
        cat = Category.objects.create(shop=self.shop_a, name="Pizzas", slug="pizzas")
        prod = Product.objects.create(
            shop=self.shop_a,
            category=cat,
            name="Farmhouse Supreme",
            base_price="249.00",
            has_variants=True
        )
        ProductVariant.objects.create(product=prod, name="Medium", price="249.00")
        group = AddonGroup.objects.create(shop=self.shop_a, name="Extra Toppings")
        AddonItem.objects.create(group=group, name="Black Olives", price="35.00")
        prod.addon_groups.add(group)

        # Deactivated category should be hidden
        Category.objects.create(shop=self.shop_a, name="Hidden Category", slug="hidden", is_active=False)

        self.client.logout()
        menu_url = reverse('public-shop-menu', kwargs={'slug': self.shop_a.slug})
        response = self.client.get(menu_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['shop']['name'], "Mario's Pizza Kitchen")
        # Only active category appears
        self.assertEqual(len(response.data['categories']), 1)
        self.assertEqual(response.data['categories'][0]['name'], "Pizzas")

        # Products under active category
        products = response.data['categories'][0]['products']
        self.assertEqual(len(products), 1)
        self.assertEqual(products[0]['name'], "Farmhouse Supreme")
        self.assertEqual(len(products[0]['variants']), 1)
        self.assertEqual(len(products[0]['addon_groups']), 1)
        self.assertEqual(products[0]['addon_groups'][0]['items'][0]['name'], "Black Olives")

    def test_unapproved_shop_menu_returns_404(self):
        """
        Verify that querying the public menu for an unapproved/pending shop returns HTTP 404.
        """
        self.client.logout()
        menu_url = reverse('public-shop-menu', kwargs={'slug': self.shop_c.slug})
        response = self.client.get(menu_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_vendor_toggle_product_daily_availability(self):
        """
        Verify the quick toggle endpoint for setting in-stock / sold-out status.
        """
        cat = Category.objects.create(shop=self.shop_a, name="Beverages", slug="beverages")
        prod = Product.objects.create(
            shop=self.shop_a,
            category=cat,
            name="Cold Coffee",
            base_price="90.00",
            is_available=True
        )

        self.authenticate_as(self.vendor_a)
        toggle_url = reverse('vendor-product-availability', kwargs={'pk': prod.id})

        # Toggle to sold out
        res1 = self.client.patch(toggle_url)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertFalse(res1.data['is_available'])

        prod.refresh_from_db()
        self.assertFalse(prod.is_available)

        # Toggle back to in stock
        res2 = self.client.patch(toggle_url)
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertTrue(res2.data['is_available'])
