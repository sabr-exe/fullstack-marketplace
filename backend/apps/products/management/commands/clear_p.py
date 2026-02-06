from faker import Faker
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.contrib.auth import get_user_model

from apps.products.models import (
    Category,
    Product,
    ProductImage,
    ProductAttribute,
    ProductAttributeValue,
)
from apps.reviews.models import Review
from apps.orders.models import Order, OrderItem, Store
from apps.cart.models import Cart, CartItem

fake = Faker()
User = get_user_model()


class Command(BaseCommand):
    help = "Clear all product-related data safely and consistently"

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Clearing database..."))
        self.clear_all()
        self.stdout.write(self.style.SUCCESS("Database cleared successfully."))

    # ============================================================
    # CLEAR ALL DATA (correct FK order)
    # ============================================================
    def clear_all(self):
        # 1. Reviews → OrderItem → Order
        Review.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()

        # 2. CartItem → Cart
        CartItem.objects.all().delete()
        Cart.objects.all().delete()

        # 3. Product images (safe deletion via signals)
        ProductImage.objects.all().delete()

        # 4. Product attributes
        ProductAttributeValue.objects.all().delete()
        ProductAttribute.objects.all().delete()

        # 5. Products
        Product.objects.all().delete()

        # 6. Categories
        Category.objects.all().delete()

        # 7. Stores
        Store.objects.all().delete()

        # 8. Users (except superuser)
        User.objects.exclude(is_superuser=True).delete()
