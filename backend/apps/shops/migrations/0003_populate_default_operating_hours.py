from django.db import migrations

def populate_operating_hours(apps, schema_editor):
    Shop = apps.get_model('shops', 'Shop')
    ShopOperatingHour = apps.get_model('shops', 'ShopOperatingHour')

    for shop in Shop.objects.all():
        for weekday in range(7):
            ShopOperatingHour.objects.get_or_create(
                shop=shop,
                weekday=weekday,
                defaults={
                    'is_closed': False,
                    'opening_time': shop.opening_time or '10:00:00',
                    'closing_time': shop.closing_time or '23:00:00',
                }
            )

def reverse_populate(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('shops', '0002_shop_order_pause_reason_shop_order_paused_at_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_operating_hours, reverse_populate),
    ]
