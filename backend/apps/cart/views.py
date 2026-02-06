from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import Cart, CartItem
from .serializers import CartSerializer, AddToCartSerializer, UpdateCartItemSerializer, RemoveCartItemSerializer
from apps.products.models import Product
from django.shortcuts import get_object_or_404
from django.db import transaction, IntegrityError


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            cart = Cart.objects.prefetch_related(
                "items__product"  # Двойное подчеркивание протаскивает join дальше
            ).get(user=request.user)
        except Cart.DoesNotExist:
            try:
                with transaction.atomic():
                    cart = Cart.objects.create(user=request.user)
            except IntegrityError:
                # корзину создал параллельный запрос
                cart = Cart.objects.prefetch_related(
                    "items__product"
                ).get(user=request.user)

        serializer = CartSerializer(cart)
        return Response(serializer.data)



class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        product: Product = serializer.validated_data["product"]
        quantity: int = serializer.validated_data["quantity"]

        cart, _ = Cart.objects.get_or_create(user=request.user)

        with transaction.atomic():
            item, created = CartItem.objects.select_for_update().get_or_create(
                cart=cart,
                product=product,
                defaults={"quantity": 0},
            )
            item.quantity += quantity
            item.save(update_fields=["quantity"])

        return Response({'message': 'Added to cart'}, status=status.HTTP_201_CREATED)




class UpdateCartItemView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UpdateCartItemSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        item_id = serializer.validated_data["item_id"]
        quantity = serializer.validated_data["quantity"]

        item = get_object_or_404(
             CartItem, id=item_id, cart__user=request.user )

        if quantity <= 0:
            item.delete()
            return Response({'message': 'Item removed'})

        item.quantity = quantity
        item.save()
        return Response({'message': 'Quantity updated'})




class RemoveFromCartView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RemoveCartItemSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        item_id = serializer.validated_data["item_id"]

        item = get_object_or_404(
            CartItem,
            id=item_id,
            cart__user=request.user
        )

        item.delete()

        return Response({'message': 'Item removed'})


