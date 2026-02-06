from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel
from apps.products.models import Product


class Store(models.Model):
    name = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} — {self.address}"
    

class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"  
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"


    is_finalized = models.BooleanField(default=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders"
    )

    customer_email = models.EmailField()
    shipping_address = models.TextField()

    status = models.CharField(
        max_length=20,
        default=Status.PENDING,
        db_index=True,
    )

    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    currency = models.CharField(
        max_length=10,
        default="USD"
    )
    idempotency_key = models.CharField(
    max_length=64,
    default="",  # или сгенерировать uuid при создании
    blank=True,
)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "idempotency_key"],
                name="unique_user_idempotency_key",
            )
        ]

    class DeliveryMethod(models.TextChoices):
        DELIVERY = "delivery", "Delivery"
        PICKUP = "pickup", "Pickup"

    delivery_method = models.CharField(
        max_length=20,
        choices=DeliveryMethod.choices,
    )

    phone_number = models.CharField(max_length=20)

    # Для доставки
    delivery_address = models.CharField(max_length=255, blank=True)
    delivery_time = models.DateTimeField(null=True, blank=True)

    # Для самовывоза
    store_address = models.CharField(max_length=255, blank=True)

    store = models.ForeignKey(
        Store,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    
    def __str__(self):
        return f"Order #{self.id}"




class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT
    )

    product_name = models.CharField(max_length=255)

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.product_name} x {self.quantity}"



class OrderStatusHistory(models.Model):
    order = models.ForeignKey(
        Order,
        related_name="status_history",
        on_delete=models.CASCADE,
    )

    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    comment = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order.id}: {self.from_status} → {self.to_status}"
