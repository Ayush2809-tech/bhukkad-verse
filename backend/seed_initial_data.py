"""
BHUKKAD VERSE — Master Initial Data Seeder
Populates a fresh database with:
- Super Admin, Vendor, and Customer user accounts
- 3 Culinary Tier Shops (Street Food, Luxury Dining, Fresh Cloud Kitchen)
- Core Categories and Dishes with pricing & images
- Homepage Showcase Videos (Behind the Scenes)
- Dynamic Homepage Settings (Curtain video, Hero badges, Mascot)
"""
import os
import sys
from decimal import Decimal
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / 'apps'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bhukkadverse.settings')

import django
django.setup()

from apps.authentication.models import User
from apps.shops.models import Shop, ShopOperatingHour
from apps.products.models import Category, Product, ProductVariant, AddonGroup, AddonItem
from apps.core.models import PlatformSettings, ShowcaseVideo

def run_seed():
    print("🚀 Seeding BHUKKAD VERSE master database...")

    # 1. Users
    admin_user, _ = User.objects.get_or_create(
        email='admin@bhukkadverse.local',
        defaults={
            'username': 'admin',
            'first_name': 'Ayush',
            'last_name': 'Saxena',
            'phone': '9876543210',
            'role': User.Role.ADMIN,
            'is_staff': True,
            'is_superuser': True,
        }
    )
    admin_user.set_password('admin123')
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.role = User.Role.ADMIN
    admin_user.save()
    print("  ✅ Admin: admin@bhukkadverse.local / admin123")

    vendor1, _ = User.objects.get_or_create(
        email='vendor@bhukkadverse.local',
        defaults={
            'username': 'vendor_tandoor',
            'first_name': 'Vikram',
            'last_name': 'Malhotra',
            'phone': '9876543211',
            'role': User.Role.VENDOR,
        }
    )
    vendor1.set_password('vendor123')
    vendor1.role = User.Role.VENDOR
    vendor1.save()

    vendor2, _ = User.objects.get_or_create(
        email='vendor2@bhukkadverse.local',
        defaults={
            'username': 'vendor_chandu',
            'first_name': 'Chandu',
            'last_name': 'Lal',
            'phone': '9876543212',
            'role': User.Role.VENDOR,
        }
    )
    vendor2.set_password('vendor123')
    vendor2.role = User.Role.VENDOR
    vendor2.save()

    customer, _ = User.objects.get_or_create(
        email='customer@bhukkadverse.local',
        defaults={
            'username': 'customer_rohit',
            'first_name': 'Rohit',
            'last_name': 'Verma',
            'phone': '9876543213',
            'role': User.Role.CUSTOMER,
        }
    )
    customer.set_password('customer123')
    customer.role = User.Role.CUSTOMER
    customer.save()
    print("  ✅ Vendors & Customer accounts ready")

    # 2. Shops
    shop1, _ = Shop.objects.get_or_create(
        owner=vendor1,
        defaults={
            'name': 'Live Tandoor & Grill',
            'slug': 'live-tandoor-grill',
            'tier': Shop.Tier.FRESH_KITCHEN,
            'description': 'Handcrafted charcoal grills, gourmet wood-fired pizzas, and rich slow-simmered gravies made to order.',
            'phone': '9876543211',
            'email': 'tandoor@bhukkadverse.local',
            'address_line': 'Plot 42, Knowledge Park III',
            'city': 'Greater Noida',
            'postal_code': '201306',
            'delivery_radius_km': Decimal('12.00'),
            'latitude': Decimal('28.451752'),
            'longitude': Decimal('77.507742'),
            'status': Shop.Status.APPROVED,
            'is_active': True,
        }
    )

    shop2, _ = Shop.objects.get_or_create(
        owner=vendor2,
        defaults={
            'name': 'Chandu Halwai & Street Chaat',
            'slug': 'chandu-halwai-street-chaat',
            'tier': Shop.Tier.STREET_FOOD,
            'description': 'Legendary Chandni Chowk style samosas, kachoris, and tangy dahi bhallas prepared with generational secret spice mixes.',
            'phone': '9876543212',
            'email': 'chandu@bhukkadverse.local',
            'address_line': 'Shop 12, Main Bazaar, Sector 18',
            'city': 'Greater Noida',
            'postal_code': '201301',
            'delivery_radius_km': Decimal('10.00'),
            'latitude': Decimal('28.451752'),
            'longitude': Decimal('77.507742'),
            'status': Shop.Status.APPROVED,
            'is_active': True,
        }
    )

    print("  ✅ 2 Verified Kitchens ready")

    # 3. Categories
    cat_chaat, _ = Category.objects.get_or_create(shop=shop2, slug='street-chaat', defaults={'name': 'Street Chaat & Samosas', 'display_order': 1})
    cat_pizza, _ = Category.objects.get_or_create(shop=shop1, slug='gourmet-pizzas', defaults={'name': 'Gourmet Pizzas', 'display_order': 1})
    cat_grills, _ = Category.objects.get_or_create(shop=shop1, slug='tandoor-grills', defaults={'name': 'Tandoor & Grills', 'display_order': 2})
    cat_shakes, _ = Category.objects.get_or_create(shop=shop1, slug='beverages-shakes', defaults={'name': 'Beverages & Shakes', 'display_order': 3})

    # 4. Dishes
    dish1, _ = Product.objects.get_or_create(
        shop=shop2,
        slug='special-crispy-aloo-samosa',
        defaults={
            'category': cat_chaat,
            'name': 'Special Crispy Aloo Samosa (2 Pcs)',
            'description': 'Handcrafted authentic Delhi 6 street samosas fried golden crispy in fresh groundnut oil. Served with saunth chutney.',
            'dietary_type': Product.DietaryType.VEG,
            'base_price': Decimal('40.00'),
            'compare_at_price': Decimal('50.00'),
            'is_available': True,
            'is_active': True,
            'image_url': '/brand/mascot-hero.jpg',
        }
    )

    dish2, _ = Product.objects.get_or_create(
        shop=shop1,
        slug='handcrafted-truffle-paneer-tikka',
        defaults={
            'category': cat_grills,
            'name': 'Handcrafted Truffle Paneer Tikka',
            'description': 'Farm-fresh malai paneer cubes marinated overnight in hung curd, yellow mustard, and infused with subtle white truffle oil.',
            'dietary_type': Product.DietaryType.VEG,
            'base_price': Decimal('349.00'),
            'compare_at_price': Decimal('420.00'),
            'is_available': True,
            'is_active': True,
            'image_url': '/brand/mascot-hero.jpg',
        }
    )

    dish3, _ = Product.objects.get_or_create(
        shop=shop1,
        slug='overloaded-farmhouse-pizza',
        defaults={
            'category': cat_pizza,
            'name': 'Overloaded Gourmet Farmhouse Pizza',
            'description': 'Slow-fermented dough topped with San Marzano herb sauce, fresh mozzarella, bell peppers, golden corn, and black olives.',
            'dietary_type': Product.DietaryType.VEG,
            'base_price': Decimal('289.00'),
            'compare_at_price': Decimal('349.00'),
            'is_available': True,
            'is_active': True,
            'image_url': '/brand/mascot-hero.jpg',
        }
    )

    dish4, _ = Product.objects.get_or_create(
        shop=shop1,
        slug='belgian-dark-chocolate-shake',
        defaults={
            'category': cat_shakes,
            'name': 'Belgian Dark Chocolate Thick Shake',
            'description': 'Double chocolate indulgence blended with whole milk and rich 70% dark Belgian ganache, crowned with dark chocolate curls.',
            'dietary_type': Product.DietaryType.VEG,
            'base_price': Decimal('149.00'),
            'compare_at_price': Decimal('180.00'),
            'is_available': True,
            'is_active': True,
            'image_url': '/brand/mascot-hero.jpg',
        }
    )
    print("  ✅ Signature Menu Items ready")

    # 5. Showcase Videos (Behind the Scenes Slider)
    ShowcaseVideo.objects.get_or_create(
        title='Crispy Samosa & Street Chaat Live Fry',
        defaults={
            'shop': shop2,
            'product': dish1,
            'video_url': '/brand/curtain_loop.mp4',
            'caption': 'Handcrafted authentic Delhi 6 street samosas fried golden crispy in fresh groundnut oil.',
            'uploaded_by': admin_user,
            'display_order': 1,
            'is_active': True,
        }
    )

    ShowcaseVideo.objects.get_or_create(
        title='Smoked Charcoal Paneer Tikka Sizzle',
        defaults={
            'shop': shop1,
            'product': dish2,
            'video_url': '/brand/curtain_loop.mp4',
            'caption': 'Direct from the 800-degree clay tandoor basted with aromatic desi ghee.',
            'uploaded_by': admin_user,
            'display_order': 2,
            'is_active': True,
        }
    )
    print("  ✅ Sizzling Kitchen Reels ready")

    # 6. Dynamic Platform CMS Settings
    settings = PlatformSettings.get_settings()
    settings.curtain_enabled = True
    settings.curtain_video_url = '/brand/curtain_loop.mp4'
    settings.curtain_badge = 'AUTHENTIC NEIGHBORHOOD KITCHENS'
    settings.curtain_headline = 'BHUKKAD VERSE'
    settings.curtain_tagline = 'YOUR CRAVINGS. YOUR UNIVERSE.'
    settings.curtain_quote = 'Authentic neighborhood cloud kitchens, artisanal eateries, and gourmet masters cooked fresh to your exact taste.❤️'
    settings.hero_headline_primary = 'YOUR CRAVINGS.'
    settings.hero_headline_highlight = 'YOUR UNIVERSE.'
    settings.hero_subtitle = 'Order directly from verified neighborhood cloud kitchens, artisanal eateries, and local culinary masters. Freshly cooked, customized to your taste, delivered hot.'
    settings.hero_badge_left = 'Verified Local Kitchens'
    settings.hero_badge_right = 'Hot & Fresh Direct Delivery'
    settings.hero_mascot_image_url = '/brand/mascot-hero.jpg'
    settings.save()
    print("  ✅ Platform CMS Settings configured")

    print("\n✨ BHUKKAD VERSE Seed Complete! Database is 100% turnkey ready.")

if __name__ == '__main__':
    run_seed()
