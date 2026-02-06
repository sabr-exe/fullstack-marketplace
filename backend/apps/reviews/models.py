from django.conf import settings
from django.db import models
from apps.products.models import Product
from django.core.validators import MinValueValidator, MaxValueValidator



class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE
    )
    product = models.ForeignKey(
        Product,
        related_name='reviews',
        on_delete=models.CASCADE
    )
    rating = models.PositiveSmallIntegerField(
         validators=[MinValueValidator(1), MaxValueValidator(5)] )
    text = models.TextField(blank=True, max_length=250)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
