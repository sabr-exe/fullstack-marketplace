from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel
from apps.products.models import Product
import uuid

class Cart(TimeStampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart'
    )

    def __str__(self):
        return f'Cart of {self.user}'



class CartItem(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # ✅ новый публичный идентификатор unique=True

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        #unique_together = ('cart', 'product')
        constraints = [
            models.UniqueConstraint(fields=['cart', 'product'], name='unique_cart_product')
        ]

    def __str__(self):
        return f'{self.product} x {self.quantity}'
