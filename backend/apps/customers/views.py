from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count
from apps.authentication.permissions import IsVendorUser, IsPlatformAdmin
from .models import CustomerAddress, SupportTicket
from .serializers import CustomerAddressSerializer, SupportTicketSerializer

class CustomerAddressListCreateView(generics.ListCreateAPIView):
    """
    GET /api/v1/customer/addresses/
    List all active delivery addresses for the authenticated customer.

    POST /api/v1/customer/addresses/
    Save a new confirmed delivery address with coordinates and landmark.
    """
    serializer_class = CustomerAddressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomerAddress.objects.filter(
            user=self.request.user,
            is_active=True
        )


class CustomerAddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/v1/customer/addresses/{id}/
    Retrieve address details.

    PATCH /api/v1/customer/addresses/{id}/
    Update address lines, landmark, coordinates, or instructions.

    DELETE /api/v1/customer/addresses/{id}/
    Soft-deactivate address (marks is_active=False).
    """
    serializer_class = CustomerAddressSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pk'

    def get_queryset(self):
        return CustomerAddress.objects.filter(
            user=self.request.user,
            is_active=True
        )

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.is_default = False
        instance.save(update_fields=['is_active', 'is_default'])


class CustomerAddressSetDefaultView(APIView):
    """
    POST /api/v1/customer/addresses/{id}/set-default/
    Set the specified address as the customer's primary default address.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        address = get_object_or_404(
            CustomerAddress,
            pk=pk,
            user=request.user,
            is_active=True
        )
        address.is_default = True
        address.save()
        return Response(
            {"detail": f"Address '{address.label}' is now your default delivery address."},
            status=status.HTTP_200_OK
        )


# =============================================================
# SUPPORT TICKETS & COMPLAINTS VIEWS
# =============================================================

class SupportTicketCreateView(APIView):
    """
    POST /api/v1/customer/support/tickets/
    Allow customers or guests to submit support inquiries or shop-specific complaints.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SupportTicketSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            ticket = serializer.save()
            return Response(
                {
                    "detail": "Support ticket registered successfully.",
                    "ticket": SupportTicketSerializer(ticket).data,
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerSupportTicketListView(APIView):
    """
    GET /api/v1/customer/support/my-tickets/
    List all support inquiries submitted by the logged-in customer.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tickets = SupportTicket.objects.filter(customer=request.user)
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VendorShopComplaintsView(APIView):
    """
    GET /api/v1/vendor/support/tickets/
    Allows an authenticated vendor to inspect customer complaints/queries
    filed against their specific kitchen so they can handle and resolve them.
    """
    permission_classes = [IsVendorUser]

    def get(self, request):
        if not hasattr(request.user, 'shop'):
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)

        shop = request.user.shop
        tickets = SupportTicket.objects.filter(shop=shop)
        serializer = SupportTicketSerializer(tickets, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class VendorResolveComplaintView(APIView):
    """
    PATCH /api/v1/vendor/support/tickets/{id}/
    Allows a vendor to update status (e.g. RESOLVED) and add resolution notes.
    """
    permission_classes = [IsVendorUser]

    def patch(self, request, pk):
        if not hasattr(request.user, 'shop'):
            return Response({"detail": "Vendor has no registered shop."}, status=status.HTTP_400_BAD_REQUEST)

        ticket = get_object_or_404(SupportTicket, pk=pk, shop=request.user.shop)
        new_status = request.data.get('status')
        resolution_notes = request.data.get('resolution_notes', '')

        if new_status in SupportTicket.Status.values:
            ticket.status = new_status
        if resolution_notes:
            ticket.resolution_notes = resolution_notes
        ticket.resolved_by = request.user
        ticket.save()

        return Response(
            {
                "detail": f"Ticket #{ticket.ticket_number} updated to {ticket.status}.",
                "ticket": SupportTicketSerializer(ticket).data,
            },
            status=status.HTTP_200_OK
        )


class AdminSupportTicketsView(APIView):
    """
    GET /api/v1/admin/support/tickets/
    Allows platform admins to review all customer complaints across kitchens,
    see complaint frequency per shop ('kis shop se jyada shikayat hai'), and resolve disputes.
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        shop_id = request.query_params.get('shop_id')
        status_filter = request.query_params.get('status')

        qs = SupportTicket.objects.select_related('shop', 'customer').all()
        if shop_id:
            qs = qs.filter(shop_id=shop_id)
        if status_filter:
            qs = qs.filter(status=status_filter)

        # Calculate shop-wise complaint analytics
        shop_stats = (
            SupportTicket.objects.filter(shop__isnull=False)
            .values('shop__id', 'shop__name')
            .annotate(complaint_count=Count('id'))
            .order_by('-complaint_count')
        )

        serializer = SupportTicketSerializer(qs, many=True)
        return Response(
            {
                "tickets": serializer.data,
                "shop_complaint_ranking": list(shop_stats),
                "total_tickets": qs.count(),
            },
            status=status.HTTP_200_OK
        )


class AdminResolveTicketView(APIView):
    """
    PATCH /api/v1/admin/support/tickets/{id}/
    Platform Admin resolves or updates a customer dispute.
    """
    permission_classes = [IsPlatformAdmin]

    def patch(self, request, pk):
        ticket = get_object_or_404(SupportTicket, pk=pk)
        new_status = request.data.get('status')
        resolution_notes = request.data.get('resolution_notes')

        if new_status in SupportTicket.Status.values:
            ticket.status = new_status
        if resolution_notes is not None:
            ticket.resolution_notes = resolution_notes
        ticket.resolved_by = request.user
        ticket.save()

        return Response(
            {
                "detail": f"Ticket #{ticket.ticket_number} marked as {ticket.status}.",
                "ticket": SupportTicketSerializer(ticket).data,
            },
            status=status.HTTP_200_OK
        )
