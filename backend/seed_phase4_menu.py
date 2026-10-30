import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bhukkadverse.settings')
django.setup()

from apps.shops.models import Shop
from apps.products.models import Category, Product, ProductVariant, AddonGroup, AddonItem

def seed_menu():
    shop = Shop.objects.filter(slug='live-tandoor-grill').first()
    if not shop:
        print("Shop 'live-tandoor-grill' not found.")
        return

    print(f"Seeding menu for shop: {shop.name} ({shop.slug})")

    # 1. Add-on Groups
    crust_group, _ = AddonGroup.objects.get_or_create(
        shop=shop,
        name="Choose Pizza Crust",
        defaults={
            "is_required": True,
            "min_selections": 1,
            "max_selections": 1,
            "display_order": 1,
            "is_active": True,
        }
    )
    AddonItem.objects.get_or_create(
        group=crust_group,
        name="Classic New Hand-Tossed",
        defaults={"price": Decimal("0.00"), "display_order": 1, "is_available": True}
    )
    AddonItem.objects.get_or_create(
        group=crust_group,
        name="Crispy Thin Crust",
        defaults={"price": Decimal("30.00"), "display_order": 2, "is_available": True}
    )
    AddonItem.objects.get_or_create(
        group=crust_group,
        name="Cheese Burst Gourmet Crust",
        defaults={"price": Decimal("75.00"), "display_order": 3, "is_available": True}
    )

    toppings_group, _ = AddonGroup.objects.get_or_create(
        shop=shop,
        name="Extra Cheese & Gourmet Toppings",
        defaults={
            "is_required": False,
            "min_selections": 0,
            "max_selections": 3,
            "display_order": 2,
            "is_active": True,
        }
    )
    AddonItem.objects.get_or_create(
        group=toppings_group,
        name="Extra Mozzarella Cheese",
        defaults={"price": Decimal("45.00"), "display_order": 1, "is_available": True}
    )
    AddonItem.objects.get_or_create(
        group=toppings_group,
        name="Jalapeños & Black Olives",
        defaults={"price": Decimal("35.00"), "display_order": 2, "is_available": True}
    )
    AddonItem.objects.get_or_create(
        group=toppings_group,
        name="Sweet Golden Corn",
        defaults={"price": Decimal("30.00"), "display_order": 3, "is_available": True}
    )
    AddonItem.objects.get_or_create(
        group=toppings_group,
        name="Peri Peri Spice Drizzle",
        defaults={"price": Decimal("20.00"), "display_order": 4, "is_available": True}
    )

    shake_group, _ = AddonGroup.objects.get_or_create(
        shop=shop,
        name="Shake Toppings & Customizations",
        defaults={
            "is_required": False,
            "min_selections": 0,
            "max_selections": 2,
            "display_order": 3,
            "is_active": True,
        }
    )
    AddonItem.objects.get_or_create(
        group=shake_group,
        name="Whipped Cream Cloud",
        defaults={"price": Decimal("30.00"), "display_order": 1, "is_available": True}
    )
    AddonItem.objects.get_or_create(
        group=shake_group,
        name="Choco Chips & Drizzle",
        defaults={"price": Decimal("25.00"), "display_order": 2, "is_available": True}
    )

    # 2. Categories
    cat_pizza, _ = Category.objects.get_or_create(
        shop=shop,
        slug="veg-pizzas",
        defaults={
            "name": "Veg Pizzas",
            "description": "Authentic stone-oven baked pizzas with artisan mozzarella and farm-fresh toppings.",
            "display_order": 1,
            "is_active": True,
        }
    )

    cat_burgers, _ = Category.objects.get_or_create(
        shop=shop,
        slug="burgers-and-sandwiches",
        defaults={
            "name": "Burgers & Sandwiches",
            "description": "Juicy grilled patties, crispy lettuce, melted cheese, and toasted brioche buns.",
            "display_order": 2,
            "is_active": True,
        }
    )

    cat_pasta, _ = Category.objects.get_or_create(
        shop=shop,
        slug="pasta-and-noodles",
        defaults={
            "name": "Pasta & Noodles",
            "description": "Slow-cooked Italian sauces, tossed durum wheat pasta, and stir-fried wok noodles.",
            "display_order": 3,
            "is_active": True,
        }
    )

    cat_fries, _ = Category.objects.get_or_create(
        shop=shop,
        slug="fries-and-starters",
        defaults={
            "name": "French Fries & Starters",
            "description": "Crispy golden sides, spicy dips, and crowd-pleasing snacks.",
            "display_order": 4,
            "is_active": True,
        }
    )

    cat_shakes, _ = Category.objects.get_or_create(
        shop=shop,
        slug="shakes-and-beverages",
        defaults={
            "name": "Shakes & Beverages",
            "description": "Thick premium milkshakes, chilled refreshers, and hot artisan beverages.",
            "display_order": 5,
            "is_active": True,
        }
    )

    # 3. Products & Variants

    # Pizza 1
    p1, _ = Product.objects.get_or_create(
        shop=shop,
        slug="farmhouse-gourmet-veggie-pizza",
        defaults={
            "category": cat_pizza,
            "name": "Farmhouse Gourmet Veggie Pizza",
            "description": "Crispy capsicum, sweet corn, mushrooms, ripe tomatoes, and golden mozzarella on herb tomato sauce.",
            "base_price": Decimal("199.00"),
            "dietary_type": "VEG",
            "preparation_time_minutes": 20,
            "has_variants": True,
            "is_available": True,
            "is_active": True,
            "display_order": 1,
        }
    )
    p1.addon_groups.set([crust_group, toppings_group])
    ProductVariant.objects.get_or_create(
        product=p1,
        name="Regular (7 inch)",
        defaults={"price": Decimal("199.00"), "is_default": True, "display_order": 1, "is_available": True}
    )
    ProductVariant.objects.get_or_create(
        product=p1,
        name="Medium (10 inch)",
        defaults={"price": Decimal("349.00"), "is_default": False, "display_order": 2, "is_available": True}
    )
    ProductVariant.objects.get_or_create(
        product=p1,
        name="Large (12 inch)",
        defaults={"price": Decimal("499.00"), "is_default": False, "display_order": 3, "is_available": True}
    )

    # Pizza 2
    p2, _ = Product.objects.get_or_create(
        shop=shop,
        slug="paneer-tikka-makhani-pizza",
        defaults={
            "category": cat_pizza,
            "name": "Paneer Tikka Makhani Pizza",
            "description": "Tandoori marinated spiced paneer cubes, red paprika, onion crunch, and rich makhani gravy drizzle.",
            "base_price": Decimal("239.00"),
            "dietary_type": "VEG",
            "preparation_time_minutes": 20,
            "has_variants": True,
            "is_available": True,
            "is_active": True,
            "display_order": 2,
        }
    )
    p2.addon_groups.set([crust_group, toppings_group])
    ProductVariant.objects.get_or_create(
        product=p2,
        name="Regular (7 inch)",
        defaults={"price": Decimal("239.00"), "is_default": True, "display_order": 1, "is_available": True}
    )
    ProductVariant.objects.get_or_create(
        product=p2,
        name="Medium (10 inch)",
        defaults={"price": Decimal("399.00"), "is_default": False, "display_order": 2, "is_available": True}
    )
    ProductVariant.objects.get_or_create(
        product=p2,
        name="Large (12 inch)",
        defaults={"price": Decimal("549.00"), "is_default": False, "display_order": 3, "is_available": True}
    )

    # Burger 1
    p3, _ = Product.objects.get_or_create(
        shop=shop,
        slug="bhukkad-cheese-volcano-burger",
        defaults={
            "category": cat_burgers,
            "name": "Bhukkad Cheese Volcano Burger",
            "description": "Double spiced vegetable patty, molten cheddar cheese explosion, pickled gherkins, and smoked chipotle mayo.",
            "base_price": Decimal("149.00"),
            "dietary_type": "VEG",
            "preparation_time_minutes": 15,
            "has_variants": False,
            "is_available": True,
            "is_active": True,
            "display_order": 1,
        }
    )
    p3.addon_groups.set([toppings_group])

    # Burger 2
    p4, _ = Product.objects.get_or_create(
        shop=shop,
        slug="crispy-aloo-tikki-supreme-burger",
        defaults={
            "category": cat_burgers,
            "name": "Crispy Aloo Tikki Supreme Burger",
            "description": "Golden crispy potato herb patty, shredded iceberg lettuce, fresh onions, and tangy mint mayo.",
            "base_price": Decimal("89.00"),
            "dietary_type": "VEG",
            "preparation_time_minutes": 10,
            "has_variants": False,
            "is_available": True,
            "is_active": True,
            "display_order": 2,
        }
    )

    # Pasta
    p5, _ = Product.objects.get_or_create(
        shop=shop,
        slug="creamy-alfredo-white-sauce-pasta",
        defaults={
            "category": cat_pasta,
            "name": "Creamy Alfredo White Sauce Pasta",
            "description": "Penne tossed in silky parmesan cream sauce with sautéed mushrooms, bell peppers, and garlic butter.",
            "base_price": Decimal("179.00"),
            "dietary_type": "VEG",
            "preparation_time_minutes": 15,
            "has_variants": False,
            "is_available": True,
            "is_active": True,
            "display_order": 1,
        }
    )
    p5.addon_groups.set([toppings_group])

    # Fries
    p6, _ = Product.objects.get_or_create(
        shop=shop,
        slug="spicy-peri-peri-french-fries",
        defaults={
            "category": cat_fries,
            "name": "Spicy Peri-Peri French Fries",
            "description": "Hot salted skin-on french fries vigorously shaken in fiery peri-peri masala seasoning.",
            "base_price": Decimal("119.00"),
            "dietary_type": "VEG",
            "preparation_time_minutes": 10,
            "has_variants": False,
            "is_available": True,
            "is_active": True,
            "display_order": 1,
        }
    )

    # Shake
    p7, _ = Product.objects.get_or_create(
        shop=shop,
        slug="thick-belgian-chocolate-shake",
        defaults={
            "category": cat_shakes,
            "name": "Thick Belgian Chocolate Shake",
            "description": "Creamy full-fat milk blended with authentic dark Belgian cocoa, vanilla ice cream scoop, and fudge swirls.",
            "base_price": Decimal("139.00"),
            "dietary_type": "VEG",
            "preparation_time_minutes": 10,
            "has_variants": True,
            "is_available": True,
            "is_active": True,
            "display_order": 1,
        }
    )
    p7.addon_groups.set([shake_group])
    ProductVariant.objects.get_or_create(
        product=p7,
        name="Regular (300 ml)",
        defaults={"price": Decimal("139.00"), "is_default": True, "display_order": 1, "is_available": True}
    )
    ProductVariant.objects.get_or_create(
        product=p7,
        name="Large (500 ml)",
        defaults={"price": Decimal("189.00"), "is_default": False, "display_order": 2, "is_available": True}
    )

    print("Menu seed complete! 5 categories, 7 dishes, variants, and add-on groups created.")

if __name__ == '__main__':
    seed_menu()
