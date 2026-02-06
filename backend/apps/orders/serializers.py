from rest_framework import serializers
from .models import Order, OrderItem
from django.utils import timezone
from .models import Order, OrderStatusHistory



class CreateOrderSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=20)
    delivery_method = serializers.ChoiceField(
        choices=Order.DeliveryMethod.choices
    )

    # delivery
    delivery_address = serializers.CharField(
        required=False,
        allow_blank=True
    )
    delivery_time = serializers.DateTimeField(
        required=False, allow_null=True
    )

    # pickup
    store_address = serializers.CharField(
        required=False,
        allow_blank=True
    )
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    shipping_address = serializers.CharField(required=False, allow_blank=True)
 
    def validate_phone_number(self, value):
        digits = [c for c in value if c.isdigit()]
        if len(digits) < 10:
            raise serializers.ValidationError("Invalid phone number")
        return value

    def validate(self, attrs):
        method = attrs.get("delivery_method")

        # fallback email
        if not attrs.get("customer_email"):
            user = self.context["request"].user
            attrs["customer_email"] = getattr(user, "email", None)

        if not attrs["customer_email"]:
            raise serializers.ValidationError({
                "customer_email": "Email is required"
            })

        # DELIVERY
        if method == Order.DeliveryMethod.DELIVERY:
            if not attrs.get("delivery_address"):
                raise serializers.ValidationError({
                    "delivery_address": "Delivery address is required"
                })

            delivery_time = attrs.get("delivery_time")
            if not delivery_time:
                raise serializers.ValidationError({
                    "delivery_time": "Delivery time is required"
                })

            if delivery_time < timezone.now():
                raise serializers.ValidationError({
                    "delivery_time": "Delivery time must be in the future"
                })

        # PICKUP
        elif method == Order.DeliveryMethod.PICKUP:
            if not attrs.get("store_address"):
                raise serializers.ValidationError({
                    "store_address": "Store address is required for pickup"
                })

        return attrs




class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            'product',
            'product_name',
            'price',
            'quantity',
        )
        read_only_fields = ("product_name", "price")

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = serializers.StringRelatedField()

    class Meta:
        model = OrderStatusHistory
        fields = (
            "from_status",
            "to_status",
            "changed_by",
            "comment",
            "created_at",
        )




class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(
        many=True,
        read_only=True,
        
        #source="status_history"
    )

    class Meta:
        model = Order
        fields = (
             "id",
            "status",
            "delivery_method",
            "phone_number",
            "delivery_address",
            "delivery_time",
            "store_address",
            "total_price",
            "created_at",
            "items",
            "status_history",

        )


class ChangeOrderStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)
    comment = serializers.CharField(required=False, allow_blank=True)


    
