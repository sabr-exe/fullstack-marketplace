from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.models import Product


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='product.name', read_only=True
    )
    product_price = serializers.DecimalField(
        source='product.price',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = CartItem
        fields = (
            'id',
            'product',
            'product_name',
            'product_price',
            'quantity',
        )



class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ('id', 'items')



class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
        source="product"
    )
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        product = attrs["product"]
        quantity = attrs["quantity"]

        # 1. Проверяем, что товар активен
        if not product.is_active:
            raise serializers.ValidationError(
                {"product": "This product is not available for purchase"}
            )

        # 2. Проверяем, что quantity не превышает stock
        if quantity > product.stock:
            raise serializers.ValidationError(
                {"quantity": f"Only {product.stock} items available in stock"}
            )

        # 3. Проверяем существующее количество в корзине
        existing_qty = (
            CartItem.objects
            .filter(cart__user=user, product=product)
            .values_list("quantity", flat=True)
            .first() or 0
        )

        if existing_qty + quantity > product.stock:
            raise serializers.ValidationError(
                {"quantity": f"Total quantity exceeds stock ({product.stock})"}
            )

        return attrs




class UpdateCartItemSerializer(serializers.Serializer):
    item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)



class RemoveCartItemSerializer(serializers.Serializer):
    item_id = serializers.IntegerField()



# class AddToCartSerializer(serializers.Serializer):
#     product_id = serializers.PrimaryKeyRelatedField(
#         queryset=Product.objects.all(),
#         source="product"
#     )
    
#     quantity = serializers.IntegerField(min_value=1, default=1)

#     def validate(self, attrs):
#         product = attrs["product"]
#         quantity = attrs["quantity"]

#         if quantity > product.stock:
#             raise serializers.ValidationError(
#                 {
#                     "quantity": f"Only {product.stock} items available in stock"
#                 }
#             )
#         existing_qty = (
#             CartItem.objects
#             .filter(cart__user=self.context["request"].user, product=product)
#             .values_list("quantity", flat=True)
#             .first() or 0
#         )

#         if existing_qty + quantity > product.stock:
#             raise serializers.ValidationError(
#                 {"quantity": f"Total quantity exceeds stock ({product.stock})"}
#             )

#         return attrs
