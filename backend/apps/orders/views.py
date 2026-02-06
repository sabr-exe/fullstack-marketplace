from .serializers import OrderSerializer
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Order
from .services import OrderService
from django.core.exceptions import ValidationError
from .serializers import CreateOrderSerializer, ChangeOrderStatusSerializer, OrderStatusHistorySerializer


class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        idempotency_key = request.headers.get("Idempotency-Key")

        if not idempotency_key:
            return Response(
                {"detail": "Idempotency-Key header is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = CreateOrderSerializer(data=request.data, context={"request": request})
        # проверка на ошибку
        if not serializer.is_valid(): 
            print("ERRORS:", serializer.errors) 
            return Response(serializer.errors, status=400)
        #
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        try:
            order, created = OrderService.create_order(
                user=request.user,
                idempotency_key=idempotency_key,
                phone_number=data["phone_number"],
                delivery_method=data["delivery_method"],
                delivery_address=data.get("delivery_address", ""),
                delivery_time=data.get("delivery_time"),
                store_address=data.get("store_address", ""),
                customer_email=data.get("customer_email"),
                shipping_address=data.get("shipping_address"),
            )
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "order_id": order.id,
                "status": order.status,
                "total_price": order.total_price,
                "delivery_method": order.delivery_method,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )



class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user)
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)



class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(
            Order.objects
            .filter(user=request.user)
            .prefetch_related(
                "items__product",
                "status_history",
            ),
            id=pk,
        )

        serializer = OrderSerializer(order)
        # views.py
        #serializer = OrderSerializer(data=request.data)
        #print(request.data)
        #print(serializer.errors)

        return Response(serializer.data)


class ChangeOrderStatusView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Order not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ChangeOrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            # Вызов сервиса: используем order_id чтобы соответствовать сигнатуре OrderService.change_status(order_id, ...)
            OrderService.change_status(
                order_id=order.id,
                new_status=serializer.validated_data["status"],
                changed_by=request.user,
                comment=serializer.validated_data.get("comment", ""),
            )
        except ValidationError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Обновим объект из БД чтобы вернуть актуальный статус
        order.refresh_from_db()

        return Response(
            {
                "order_id": order.id,
                "status": order.status,
            }
        )
