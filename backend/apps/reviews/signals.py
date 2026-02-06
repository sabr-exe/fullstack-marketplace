from django.db.models import Avg
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Review
from apps.products.models import Product



@receiver([post_save, post_delete], sender=Review)
def update_product_rating(sender, instance, **kwargs):
    product = instance.product
    avg = product.reviews.aggregate(
        avg=Avg('rating')
    )['avg'] or 0
    product.rating = round(avg, 1)
    product.save(update_fields=['rating'])
