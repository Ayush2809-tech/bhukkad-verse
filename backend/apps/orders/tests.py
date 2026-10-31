from decimal import Decimal
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.shops.models import Shop
from apps.orders.models import (
    Order,
    OrderItem,
    RiderWallet,
    RiderCashLedger,
    VendorSettlementLedger,
)

User = get_user_model()


class RiderCodAndLedgerTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Admin
        self.admin_user = User.objects.create_superuser(
            username='cod_admin',
            email='admin@bhukkadverse.local',
            password='AdminPassword123!'
        )

        # 2. Vendor
        self.vendor_user = User.objects.create_user(
            username='vendor_chef',
            email='chef@bhukkadverse.local',
            password='VendorPassword123!',
            role=User.Role.VENDOR
        )
        self.shop = Shop.objects.create(
            name="Purani Dilli Chaat Bhandaar",
            slug="purani-dilli-chaat-bhandaar",
            owner=self.vendor_user,
            tier=Shop.Tier.STREET_FOOD,
            status=Shop.Status.APPROVED,
            is_active=True,
            latitude=Decimal('28.650000'),
            longitude=Decimal('77.230000'),
            delivery_radius_km=Decimal('5.00')
        )

        # 3. Customer
        self.customer = User.objects.create_user(
            username='food_lover',
            email='customer@bhukkadverse.local',
            password='CustomerPassword123!',
            role=User.Role.CUSTOMER
        )

        # 4. Delivery Fleet Rider
        self.rider_user = User.objects.create_user(
            username='fast_rider',
            email='rider@bhukkadverse.local',
            password='RiderPassword123!',
            role=User.Role.RIDER
        )
        self.wallet = RiderWallet.objects.create(
            user=self.rider_user,
            rider_name="Vikram Singh (Fleet 01)",
            phone="+91 98765 00001",
            vehicle_type="Electric Scooter",
            cash_in_hand=Decimal('0.00'),
            cash_limit=Decimal('1500.00'),
            lifetime_delivery_earnings=Decimal('0.00'),
            withdrawable_balance=Decimal('0.00'),
            is_blocked_from_cod=False
        )

        # URLs
        self.checkout_url = reverse('order-checkout')
        self.rider_wallet_url = reverse('rider-wallet')
        self.rider_collect_cash_url = reverse('rider-collect-cash')
        self.rider_deposit_cash_url = reverse('rider-deposit-cash')
        self.admin_cod_ledger_url = reverse('admin-cod-ledger')

    def test_checkout_creates_vendor_settlement_ledger(self):
        """Checkout creates order and PENDING VendorSettlementLedger with 90% payout."""
        payload = {
            "shop_id": str(self.shop.id),
            "customer_name": "Aarav Sharma",
            "customer_phone": "+91 99999 11111",
            "delivery_address": "Flat 402, Chandni Chowk, Delhi",
            "payment_method": Order.PaymentMethod.COD,
            "items": [
                {
                    "name": "Dahi Bhalla Papdi Chaat",
                    "price": "120.00",
                    "quantity": 2,
                    "dietary_type": "VEG"
                }
            ]
        }
        res = self.client.post(self.checkout_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['success'])

        order = Order.objects.get(order_number=res.data['order_number'])
        self.assertEqual(order.payment_method, Order.PaymentMethod.COD)
        self.assertEqual(order.status, Order.Status.CONFIRMED)

        # Subtotal: 120 * 2 = 240. Commission 10% = 24. Vendor payout = 216.
        settlement = VendorSettlementLedger.objects.get(order=order)
        self.assertEqual(settlement.shop, self.shop)
        self.assertEqual(settlement.status, VendorSettlementLedger.Status.PENDING)
        self.assertEqual(settlement.gross_food_amount, Decimal('240.00'))
        self.assertEqual(settlement.platform_commission_amount, Decimal('24.00'))
        self.assertEqual(settlement.net_vendor_payout, Decimal('216.00'))

    def test_rider_collect_cash_credits_wage_and_updates_ledger(self):
        """Rider collects COD cash: float increases, ₹35 wage credited, settlement approved."""
        order = Order.objects.create(
            order_number="BV-2026-TEST01",
            shop=self.shop,
            customer=self.customer,
            status=Order.Status.OUT_FOR_DELIVERY,
            payment_status=Order.PaymentStatus.PENDING,
            payment_method=Order.PaymentMethod.COD,
            subtotal=Decimal('300.00'),
            total_amount=Decimal('320.00'),
            customer_name="Aarav",
            customer_phone="9999911111",
            delivery_address_line="Old Delhi"
        )
        VendorSettlementLedger.objects.create(
            shop=self.shop,
            order=order,
            gross_food_amount=Decimal('300.00'),
            platform_commission_amount=Decimal('30.00'),
            net_vendor_payout=Decimal('270.00'),
            status=VendorSettlementLedger.Status.PENDING
        )

        self.client.force_authenticate(user=self.rider_user)
        res = self.client.post(self.rider_collect_cash_url, {
            "order_number": order.order_number,
            "cash_collected": "320.00"
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['cash_collected'], 320.00)
        self.assertEqual(res.data['delivery_wage_credited'], 35.00)
        self.assertEqual(res.data['new_cash_in_hand'], 320.00)
        self.assertFalse(res.data['is_blocked_from_cod'])

        # Check Wallet
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.cash_in_hand, Decimal('320.00'))
        self.assertEqual(self.wallet.withdrawable_balance, Decimal('35.00'))
        self.assertEqual(self.wallet.lifetime_delivery_earnings, Decimal('35.00'))

        # Check Ledger entries (2 created: COD_COLLECTED and DELIVERY_WAGE)
        ledgers = RiderCashLedger.objects.filter(wallet=self.wallet, order=order)
        self.assertEqual(ledgers.count(), 2)

        # Check Order & Settlement status updated
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.DELIVERED)
        self.assertEqual(order.payment_status, Order.PaymentStatus.PAID)

        settlement = VendorSettlementLedger.objects.get(order=order)
        self.assertEqual(settlement.status, VendorSettlementLedger.Status.APPROVED)

    def test_anti_theft_cash_limit_blocks_rider(self):
        """When rider cash float reaches or exceeds ₹1,500, rider is blocked from COD."""
        order = Order.objects.create(
            order_number="BV-2026-BIGCOD",
            shop=self.shop,
            customer=self.customer,
            status=Order.Status.OUT_FOR_DELIVERY,
            payment_status=Order.PaymentStatus.PENDING,
            payment_method=Order.PaymentMethod.COD,
            subtotal=Decimal('1500.00'),
            total_amount=Decimal('1580.00'),
            customer_name="Grand Party",
            customer_phone="9999911111",
            delivery_address_line="Civil Lines, Delhi"
        )

        self.client.force_authenticate(user=self.rider_user)
        res = self.client.post(self.rider_collect_cash_url, {
            "order_number": order.order_number,
            "cash_collected": "1580.00"
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['is_blocked_from_cod'])

        self.wallet.refresh_from_db()
        self.assertTrue(self.wallet.is_blocked_from_cod)

    def test_rider_deposit_cash_unblocks_rider(self):
        """Depositing accumulated cash unblocks the rider once float drops under ₹1,500."""
        # Set wallet already over limit
        self.wallet.cash_in_hand = Decimal('1600.00')
        self.wallet.is_blocked_from_cod = True
        self.wallet.save()

        self.client.force_authenticate(user=self.rider_user)
        res = self.client.post(self.rider_deposit_cash_url, {
            "deposit_amount": "1200.00",
            "reference_utr": "UPI-BANK-UTR-987654",
            "note": "HDFC UPI QR Deposit"
        }, format='json')

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['remaining_cash_in_hand'], 400.00)
        self.assertFalse(res.data['is_blocked_from_cod'])

        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.cash_in_hand, Decimal('400.00'))
        self.assertFalse(self.wallet.is_blocked_from_cod)

    def test_admin_cod_ledger_and_settlement_views(self):
        """Admin can view platform COD health and mark vendor settlement settled with UTR."""
        order = Order.objects.create(
            order_number="BV-2026-SETTLE01",
            shop=self.shop,
            customer=self.customer,
            status=Order.Status.DELIVERED,
            payment_status=Order.PaymentStatus.PAID,
            payment_method=Order.PaymentMethod.COD,
            subtotal=Decimal('500.00'),
            total_amount=Decimal('530.00'),
            customer_name="Pooja",
            customer_phone="9999911111",
            delivery_address_line="Connaught Place"
        )
        settlement = VendorSettlementLedger.objects.create(
            shop=self.shop,
            order=order,
            gross_food_amount=Decimal('500.00'),
            platform_commission_amount=Decimal('50.00'),
            net_vendor_payout=Decimal('450.00'),
            status=VendorSettlementLedger.Status.APPROVED
        )

        self.client.force_authenticate(user=self.admin_user)
        # Admin Ledger Overview
        res = self.client.get(self.admin_cod_ledger_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('summary', res.data)
        self.assertIn('total_cash_in_market', res.data['summary'])

        # Admin Settle Vendor Payout
        settle_url = reverse('admin-settle-vendor', kwargs={'settlement_id': settlement.id})
        settle_res = self.client.post(settle_url, {
            "bank_utr": "HDFC-NEFT-20261030-001"
        }, format='json')

        self.assertEqual(settle_res.status_code, status.HTTP_200_OK)
        self.assertEqual(settle_res.data['status'], VendorSettlementLedger.Status.SETTLED)

        settlement.refresh_from_db()
        self.assertEqual(settlement.status, VendorSettlementLedger.Status.SETTLED)
        self.assertEqual(settlement.bank_utr, "HDFC-NEFT-20261030-001")
        self.assertIsNotNone(settlement.settled_at)
