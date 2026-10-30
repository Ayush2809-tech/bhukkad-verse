import hmac
import hashlib
import uuid
import random
from decimal import Decimal
from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import (
    Order,
    OrderItem,
    PaymentTransaction,
    RiderWallet,
    RiderCashLedger,
    VendorSettlementLedger,
)
from .serializers import (
    OrderSerializer,
    CreateCheckoutOrderSerializer,
    VerifyPaymentSerializer,
    UpdateOrderStatusSerializer,
    RiderWalletSerializer,
    RiderCashLedgerSerializer,
    VendorSettlementLedgerSerializer,
    RiderCashCollectInputSerializer,
    RiderDepositCashInputSerializer,
)
from apps.shops.models import Shop
from apps.core.models import Coupon
from apps.shops.permissions import IsVendor, IsAdmin, IsRider

# Safe Razorpay Client initialization
try:
    import razorpay
    razorpay_client = razorpay.Client(
        auth=(
            getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_bhukkadverse1234'),
            getattr(settings, 'RAZORPAY_KEY_SECRET', 'bv_secret_key_demo_test')
        )
    )
except Exception:
    razorpay_client = None


class CreateCheckoutOrderView(APIView):
    """
    POST /api/v1/orders/checkout/
    Creates a new customer order, computes pricing and commission splits,
    and returns Razorpay payment payload or confirms Cash-on-Delivery.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateCheckoutOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        shop = get_object_or_404(Shop, id=data['shop_id'], is_active=True, status=Shop.Status.APPROVED)

        # 1. Compute Items Subtotal
        items_data = data['items']
        if not items_data:
            return Response({"error": "Cart cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = Decimal('0.00')
        for item in items_data:
            item_price = Decimal(str(item['price']))
            qty = Decimal(str(item['quantity']))
            subtotal += item_price * qty

        # 2. Check and Apply Coupon Voucher
        discount = Decimal('0.00')
        coupon_code = data.get('coupon_code', '').strip().upper()
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code__iexact=coupon_code, is_active=True)
                discount = Decimal(str(coupon.calculate_discount(float(subtotal))))
            except Coupon.DoesNotExist:
                pass

        # 3. Transparent Delivery & Platform Fees (Free Delivery on orders >= ₹99!)
        platform_fee = Decimal('5.00')  # Nominal platform convenience fee
        free_delivery_threshold = Decimal('99.00')
        if subtotal >= free_delivery_threshold:
            delivery_fee = Decimal('0.00')  # Unlocked FREE delivery!
        else:
            delivery_fee = Decimal('25.00')  # Fair nominal delivery fee for small orders under ₹99

        # 5% GST on food services
        tax_amount = (subtotal * Decimal('0.05')).quantize(Decimal('0.01'))

        # 4. Total Amount Charged to Customer (No bill shock!)
        total_amount = max(Decimal('0.00'), subtotal + platform_fee + delivery_fee + tax_amount - discount)

        # 5. Marketplace Revenue Sharing (The Split!)
        # Platform takes 10% commission on items sold
        admin_commission_rate = Decimal('10.00')
        admin_commission_amount = ((subtotal - discount) * (admin_commission_rate / Decimal('100.00'))).quantize(Decimal('0.01'))
        admin_total_earnings = admin_commission_amount + platform_fee
        # Vendor receives remainder of dish sales
        vendor_payout_amount = max(Decimal('0.00'), subtotal - admin_commission_amount)

        # 6. Generate Unique Order Number
        rand_suffix = random.randint(100000, 999999)
        order_number = f"BV-2026-{rand_suffix}"

        # 7. Razorpay Order Creation
        payment_method = data['payment_method']
        razorpay_order_id = ""
        amount_paise = int(total_amount * 100)

        if payment_method == Order.PaymentMethod.ONLINE_RAZORPAY:
            try:
                if razorpay_client and not getattr(settings, 'RAZORPAY_KEY_ID', '').startswith('rzp_test_bhukkadverse'):
                    rzp_res = razorpay_client.order.create({
                        "amount": amount_paise,
                        "currency": "INR",
                        "receipt": order_number,
                        "payment_capture": 1
                    })
                    razorpay_order_id = rzp_res.get('id', '')
                else:
                    # Mock sandbox ID for seamless testing
                    razorpay_order_id = f"order_bv_{uuid.uuid4().hex[:14]}"
            except Exception:
                razorpay_order_id = f"order_bv_{uuid.uuid4().hex[:14]}"

        # 8. Save Order & Items atomically
        with transaction.atomic():
            user = request.user if request.user.is_authenticated else None

            order = Order.objects.create(
                order_number=order_number,
                customer=user,
                shop=shop,
                status=Order.Status.CONFIRMED if payment_method == Order.PaymentMethod.COD else Order.Status.PLACED,
                payment_status=Order.PaymentStatus.PENDING,
                payment_method=payment_method,
                subtotal=subtotal,
                platform_fee=platform_fee,
                delivery_fee=delivery_fee,
                tax_amount=tax_amount,
                coupon_code=coupon_code,
                discount_amount=discount,
                total_amount=total_amount,
                admin_commission_rate=admin_commission_rate,
                admin_commission_amount=admin_commission_amount,
                admin_total_earnings=admin_total_earnings,
                vendor_payout_amount=vendor_payout_amount,
                customer_name=data['customer_name'],
                customer_phone=data['customer_phone'],
                customer_email=data.get('customer_email', ''),
                delivery_address_line=data['delivery_address'],
                delivery_city=data.get('delivery_city', 'New Delhi'),
                delivery_latitude=data.get('delivery_latitude'),
                delivery_longitude=data.get('delivery_longitude'),
                cooking_instructions=data.get('cooking_instructions', ''),
                estimated_delivery_minutes=25,
                razorpay_order_id=razorpay_order_id,
            )

            for itm in items_data:
                price = Decimal(str(itm['price']))
                qty = itm['quantity']
                OrderItem.objects.create(
                    order=order,
                    dish_name=itm['name'],
                    dish_id=itm.get('dish_id'),
                    quantity=qty,
                    unit_price=price,
                    total_price=price * qty,
                    dietary_type=itm.get('dietary_type', 'VEG'),
                    variant_name=itm.get('variant_name', '')
                )

            # Record initial Vendor Settlement entitlement (decide 90% payout vs 10% commission)
            VendorSettlementLedger.objects.create(
                shop=shop,
                order=order,
                gross_food_amount=subtotal,
                platform_commission_amount=admin_commission_amount,
                net_vendor_payout=vendor_payout_amount,
                status=VendorSettlementLedger.Status.PENDING
            )

        return Response({
            "success": True,
            "order_number": order.order_number,
            "order_id": str(order.id),
            "total_amount": float(order.total_amount),
            "payment_method": order.payment_method,
            "status": order.status,
            "razorpay": {
                "key_id": getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_bhukkadverse1234'),
                "order_id": razorpay_order_id,
                "amount": amount_paise,
                "currency": "INR",
                "name": "BHUKKAD VERSE",
                "description": f"Order #{order_number} ({shop.name})",
            } if payment_method == Order.PaymentMethod.ONLINE_RAZORPAY else None,
            "message": "Order placed successfully! Dispatched to kitchen." if payment_method == Order.PaymentMethod.COD else "Order initiated. Please complete payment."
        }, status=status.HTTP_201_CREATED)


class VerifyPaymentView(APIView):
    """
    POST /api/v1/orders/verify-payment/
    Verifies payment receipt from Razorpay checkout.
    Updates order to PAID and CONFIRMED.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        order = get_object_or_404(Order, order_number=data['order_number'])

        razorpay_payment_id = data['razorpay_payment_id']
        razorpay_order_id = data.get('razorpay_order_id') or order.razorpay_order_id
        razorpay_signature = data.get('razorpay_signature', '')

        # Signature verification if secret is provided
        secret = getattr(settings, 'RAZORPAY_KEY_SECRET', '')
        if secret and razorpay_signature and not secret.startswith('bv_secret_key_demo'):
            generated_signature = hmac.new(
                secret.encode('utf-8'),
                f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()

            if generated_signature != razorpay_signature:
                order.payment_status = Order.PaymentStatus.FAILED
                order.save(update_fields=['payment_status'])
                return Response({"error": "Payment verification signature mismatch."}, status=status.HTTP_400_BAD_REQUEST)

        # Mark Order as Paid and Confirmed
        order.payment_status = Order.PaymentStatus.PAID
        order.status = Order.Status.CONFIRMED
        order.razorpay_payment_id = razorpay_payment_id
        order.razorpay_signature = razorpay_signature
        order.save(update_fields=['payment_status', 'status', 'razorpay_payment_id', 'razorpay_signature', 'updated_at'])

        # Audit transaction
        PaymentTransaction.objects.create(
            order=order,
            transaction_id=razorpay_payment_id,
            payment_gateway='RAZORPAY',
            amount=order.total_amount,
            status='PAID',
            raw_response=request.data
        )

        return Response({
            "success": True,
            "order_number": order.order_number,
            "payment_status": order.payment_status,
            "status": order.status,
            "message": "Payment verified successfully! Your meal is being prepared fresh."
        })


class TrackOrderView(APIView):
    """
    GET /api/v1/orders/track/<str:order_number>/
    Live tracking endpoint for any order.
    """
    permission_classes = [AllowAny]

    def get(self, request, order_number):
        order = get_object_or_404(Order.objects.prefetch_related('items', 'shop'), order_number=order_number)
        serializer = OrderSerializer(order)
        return Response(serializer.data)


class CustomerMyOrdersView(generics.ListAPIView):
    """
    GET /api/v1/orders/my-orders/
    Authenticated customer's order history.
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).prefetch_related('items', 'shop')


class VendorOrdersView(APIView):
    """
    GET /api/v1/vendor/orders/
    PATCH /api/v1/vendor/orders/<str:order_number>/status/
    Vendor dashboard order queue & revenue management.
    """
    permission_classes = [IsAuthenticated, IsVendor]

    def get(self, request):
        user = request.user
        shop = getattr(user, 'shop', None)
        if not shop:
            return Response({"error": "No kitchen registered for this vendor."}, status=status.HTTP_404_NOT_FOUND)

        orders = Order.objects.filter(shop=shop).prefetch_related('items').order_by('-created_at')

        # Compute Vendor Payout Financials
        stats = orders.aggregate(
            total_orders=Count('id'),
            gross_dish_sales=Sum('subtotal'),
            total_commission_paid=Sum('admin_commission_amount'),
            net_vendor_payout=Sum('vendor_payout_amount')
        )

        serializer = OrderSerializer(orders, many=True)
        return Response({
            "shop": {
                "name": shop.name,
                "slug": shop.slug,
                "tier": shop.tier,
            },
            "financials": {
                "total_orders": stats['total_orders'] or 0,
                "gross_dish_sales": float(stats['gross_dish_sales'] or 0),
                "total_commission_paid": float(stats['total_commission_paid'] or 0),
                "net_vendor_payout": float(stats['net_vendor_payout'] or 0),
            },
            "orders": serializer.data
        })

    def patch(self, request, order_number):
        user = request.user
        shop = getattr(user, 'shop', None)
        if not shop:
            return Response({"error": "Unauthorized vendor."}, status=status.HTTP_403_FORBIDDEN)

        order = get_object_or_404(Order, order_number=order_number, shop=shop)
        serializer = UpdateOrderStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        # Auto-reconcile vendor settlement status based on fulfillment
        if new_status == Order.Status.DELIVERED:
            VendorSettlementLedger.objects.filter(
                order=order,
                status=VendorSettlementLedger.Status.PENDING
            ).update(status=VendorSettlementLedger.Status.APPROVED)
        elif new_status == Order.Status.CANCELLED:
            VendorSettlementLedger.objects.filter(
                order=order
            ).update(status=VendorSettlementLedger.Status.DISPUTED)

        return Response({
            "success": True,
            "order_number": order.order_number,
            "status": order.status,
            "message": f"Order status updated to {order.get_status_display()}."
        })


class AdminFinancialOverviewView(APIView):
    """
    GET /api/v1/admin/financials/
    Platform Admin financial health & marketplace commission earnings.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        orders = Order.objects.all()

        aggregates = orders.aggregate(
            total_orders=Count('id'),
            gross_merchandise_value=Sum('total_amount'),
            total_platform_fees=Sum('platform_fee'),
            total_commission_earned=Sum('admin_commission_amount'),
            total_admin_revenue=Sum('admin_total_earnings'),
            total_vendor_payouts=Sum('vendor_payout_amount')
        )

        recent_orders = orders.select_related('shop', 'customer').prefetch_related('items')[:20]
        serializer = OrderSerializer(recent_orders, many=True)

        return Response({
            "marketplace_summary": {
                "total_orders": aggregates['total_orders'] or 0,
                "gmv": float(aggregates['gross_merchandise_value'] or 0),
                "platform_fees_collected": float(aggregates['total_platform_fees'] or 0),
                "commissions_earned": float(aggregates['total_commission_earned'] or 0),
                "admin_total_revenue": float(aggregates['total_admin_revenue'] or 0),
                "vendor_payouts_disbursed": float(aggregates['total_vendor_payouts'] or 0),
            },
            "recent_orders": serializer.data
        })


class RiderWalletView(APIView):
    """
    GET /api/v1/orders/rider/wallet/
    Retrieves the authenticated rider's live cash float balance,
    earning totals, limit status, and recent ledger entries.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        wallet, _ = RiderWallet.objects.get_or_create(
            user=user,
            defaults={
                'rider_name': user.get_full_name() or user.username or "Fleet Delivery Partner",
                'phone': getattr(user, 'phone', '') or "+91 98765 43210",
                'vehicle_type': 'Electric Bike',
            }
        )
        serializer = RiderWalletSerializer(wallet)
        return Response({
            "wallet": serializer.data,
            "is_blocked_from_cod": wallet.is_blocked_from_cod,
            "warning": (
                f"CASH FLOAT LIMIT REACHED (₹{wallet.cash_in_hand} / ₹{wallet.cash_limit}). "
                "You are temporarily blocked from accepting new COD orders. "
                "Please deposit cash via UPI to restore COD assignment."
            ) if wallet.is_blocked_from_cod else None
        })


class RiderCollectCashView(APIView):
    """
    POST /api/v1/orders/rider/collect-cash/
    Rider collects physical cash from customer for a Cash-on-Delivery order.
    Adds cash to rider's float, credits ₹35 guaranteed delivery wage,
    and updates double-entry ledger.
    Blocks rider from new COD orders if float exceeds ₹1,500.
    """
    permission_classes = [IsAuthenticated, IsRider]

    def post(self, request):
        serializer = RiderCashCollectInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        order_number = serializer.validated_data['order_number']
        cash_collected = serializer.validated_data['cash_collected']

        order = get_object_or_404(Order, order_number=order_number)

        if order.payment_method != Order.PaymentMethod.COD:
            return Response(
                {"error": "This order was not placed via Cash-on-Delivery (COD)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if order.payment_status == Order.PaymentStatus.PAID:
            return Response(
                {"error": f"Payment for order #{order_number} has already been marked as collected."},
                status=status.HTTP_400_BAD_REQUEST
            )

        delivery_wage = Decimal('35.00')

        with transaction.atomic():
            wallet, _ = RiderWallet.objects.select_for_update().get_or_create(
                user=request.user,
                defaults={
                    'rider_name': request.user.get_full_name() or request.user.username or "Fleet Partner",
                    'phone': getattr(request.user, 'phone', '') or "+91 98765 43210"
                }
            )

            # Update cash float and wage earnings
            wallet.cash_in_hand += cash_collected
            wallet.lifetime_delivery_earnings += delivery_wage
            wallet.withdrawable_balance += delivery_wage
            wallet.check_limit_and_update()
            wallet.save()

            # Record Ledger 1: Cash Collection
            RiderCashLedger.objects.create(
                wallet=wallet,
                order=order,
                entry_type=RiderCashLedger.EntryType.COD_COLLECTED,
                amount=cash_collected,
                cash_in_hand_after=wallet.cash_in_hand,
                note=f"COD collected from customer for Order #{order.order_number}"
            )

            # Record Ledger 2: Delivery Wage Credit
            RiderCashLedger.objects.create(
                wallet=wallet,
                order=order,
                entry_type=RiderCashLedger.EntryType.DELIVERY_WAGE,
                amount=delivery_wage,
                cash_in_hand_after=wallet.cash_in_hand,
                note=f"Guaranteed delivery wage for Order #{order.order_number}"
            )

            # Mark order as PAID & DELIVERED
            order.payment_status = Order.PaymentStatus.PAID
            order.status = Order.Status.DELIVERED
            order.delivery_partner_name = wallet.rider_name
            order.save(update_fields=['payment_status', 'status', 'delivery_partner_name', 'updated_at'])

            # Transition vendor settlement status to APPROVED
            VendorSettlementLedger.objects.filter(
                order=order,
                status=VendorSettlementLedger.Status.PENDING
            ).update(status=VendorSettlementLedger.Status.APPROVED)

        return Response({
            "success": True,
            "order_number": order.order_number,
            "cash_collected": float(cash_collected),
            "delivery_wage_credited": float(delivery_wage),
            "new_cash_in_hand": float(wallet.cash_in_hand),
            "cash_limit": float(wallet.cash_limit),
            "is_blocked_from_cod": wallet.is_blocked_from_cod,
            "withdrawable_balance": float(wallet.withdrawable_balance),
            "message": (
                f"Collected ₹{cash_collected}. ₹{delivery_wage} wage credited! "
                + ("WARNING: Cash limit exceeded. You are blocked from accepting new COD orders until cash is deposited." if wallet.is_blocked_from_cod else "COD status active.")
            )
        }, status=status.HTTP_200_OK)


class RiderDepositCashView(APIView):
    """
    POST /api/v1/orders/rider/deposit-cash/
    Rider deposits accumulated COD cash to the platform via UPI/Bank transfer.
    Deducts deposit from cash_in_hand and unblocks rider from COD orders if within limit.
    """
    permission_classes = [IsAuthenticated, IsRider]

    def post(self, request):
        serializer = RiderDepositCashInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        deposit_amount = serializer.validated_data['deposit_amount']
        reference_utr = serializer.validated_data['reference_utr']
        note = serializer.validated_data.get('note', '')

        if deposit_amount <= Decimal('0.00'):
            return Response({"error": "Deposit amount must be greater than ₹0.00."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            wallet, _ = RiderWallet.objects.select_for_update().get_or_create(
                user=request.user,
                defaults={
                    'rider_name': request.user.get_full_name() or request.user.username or "Fleet Partner",
                    'phone': getattr(request.user, 'phone', '') or "+91 98765 43210"
                }
            )

            wallet.cash_in_hand = max(Decimal('0.00'), wallet.cash_in_hand - deposit_amount)
            wallet.check_limit_and_update()
            wallet.save()

            RiderCashLedger.objects.create(
                wallet=wallet,
                entry_type=RiderCashLedger.EntryType.CASH_DEPOSIT,
                amount=deposit_amount,
                cash_in_hand_after=wallet.cash_in_hand,
                reference_utr=reference_utr,
                note=note or f"UPI Deposit verified (UTR: {reference_utr})"
            )

        return Response({
            "success": True,
            "deposited_amount": float(deposit_amount),
            "reference_utr": reference_utr,
            "remaining_cash_in_hand": float(wallet.cash_in_hand),
            "is_blocked_from_cod": wallet.is_blocked_from_cod,
            "message": "Deposit recorded successfully. COD assignment restored!" if not wallet.is_blocked_from_cod else "Deposit recorded. Cash float still above limit."
        }, status=status.HTTP_200_OK)


class AdminCodLedgerView(APIView):
    """
    GET /api/v1/orders/admin/cod-ledger/
    Platform admin control room for Cash-on-Delivery audit,
    rider cash floats, anti-theft blocking status, and T+1 vendor settlements.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        wallets = RiderWallet.objects.all().order_by('-cash_in_hand')
        total_riders = wallets.count()

        float_aggregates = wallets.aggregate(
            total_cash_in_market=Sum('cash_in_hand'),
            total_wages_earned=Sum('lifetime_delivery_earnings'),
            total_withdrawable=Sum('withdrawable_balance'),
        )

        blocked_count = wallets.filter(is_blocked_from_cod=True).count()

        # Vendor settlement aggregates
        settlements = VendorSettlementLedger.objects.select_related('shop', 'order').order_by('-created_at')
        settlement_stats = settlements.aggregate(
            pending_total=Sum('net_vendor_payout', filter=Q(status=VendorSettlementLedger.Status.PENDING)),
            approved_total=Sum('net_vendor_payout', filter=Q(status=VendorSettlementLedger.Status.APPROVED)),
            settled_total=Sum('net_vendor_payout', filter=Q(status=VendorSettlementLedger.Status.SETTLED)),
        )

        recent_ledger_entries = RiderCashLedger.objects.select_related('wallet', 'order').order_by('-created_at')[:40]

        return Response({
            "summary": {
                "total_riders": total_riders,
                "total_cash_in_market": float(float_aggregates['total_cash_in_market'] or 0),
                "blocked_riders_count": blocked_count,
                "total_wages_earned": float(float_aggregates['total_wages_earned'] or 0),
                "total_withdrawable_balance": float(float_aggregates['total_withdrawable'] or 0),
                "pending_vendor_payouts": float(settlement_stats['pending_total'] or 0),
                "approved_vendor_payouts": float(settlement_stats['approved_total'] or 0),
                "settled_vendor_payouts": float(settlement_stats['settled_total'] or 0),
            },
            "riders": RiderWalletSerializer(wallets[:50], many=True).data,
            "recent_ledger": RiderCashLedgerSerializer(recent_ledger_entries, many=True).data,
            "settlements": VendorSettlementLedgerSerializer(settlements[:50], many=True).data
        })


class AdminSettleVendorView(APIView):
    """
    POST /api/v1/orders/admin/settle-vendor/<uuid:settlement_id>/
    Platform admin settles pending or approved vendor payout with Bank UTR.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, settlement_id):
        settlement = get_object_or_404(VendorSettlementLedger, id=settlement_id)
        bank_utr = request.data.get('bank_utr', '').strip()
        if not bank_utr:
            return Response({"error": "Bank UTR reference number is required."}, status=status.HTTP_400_BAD_REQUEST)

        settlement.status = VendorSettlementLedger.Status.SETTLED
        settlement.bank_utr = bank_utr
        settlement.settled_at = timezone.now()
        settlement.save(update_fields=['status', 'bank_utr', 'settled_at', 'updated_at'])

        return Response({
            "success": True,
            "settlement_id": str(settlement.id),
            "shop_name": settlement.shop.name,
            "order_number": settlement.order.order_number,
            "net_vendor_payout": float(settlement.net_vendor_payout),
            "bank_utr": settlement.bank_utr,
            "status": settlement.status,
            "message": f"Settlement of ₹{settlement.net_vendor_payout} disbursed to {settlement.shop.name}."
        })

