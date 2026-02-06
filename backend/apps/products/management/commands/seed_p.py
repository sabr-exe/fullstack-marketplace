import random
import requests
from faker import Faker
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.contrib.auth import get_user_model
from django.db import transaction

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
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

fake = Faker()
User = get_user_model()


class Command(BaseCommand):
    help = "Idempotent seed: users, categories, attributes, products, images, reviews, orders"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Clear all data before seeding"
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.reset_database()

        self.stdout.write(self.style.WARNING("Seeding database..."))

        self.seed_users()
        self.seed_categories()
        self.seed_attributes()
        self.seed_products()
        self.seed_reviews()
        self.seed_orders()

        self.stdout.write(self.style.SUCCESS("SEED COMPLETED."))

    # ============================================================
    # RESET DATABASE
    # ============================================================
    def reset_database(self):
        self.stdout.write(self.style.WARNING("Resetting database..."))

        Review.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        CartItem.objects.all().delete()
        Cart.objects.all().delete()
        ProductImage.objects.all().delete()
        ProductAttributeValue.objects.all().delete()
        Product.objects.all().delete()
        ProductAttribute.objects.all().delete()
        Category.objects.all().delete()
        Store.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()

        self.stdout.write(self.style.SUCCESS("Database cleared."))

    # ============================================================
    # USERS
    # ============================================================
    def seed_users(self):
        self.stdout.write(self.style.WARNING("Creating users..."))

        target = 10
        existing = User.objects.count()
        to_create = max(0, target - existing)

        for _ in range(to_create):
            email = fake.unique.email()
            user = User.objects.create_user(
                email=email,
                password="password123",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
            )
            Cart.objects.get_or_create(user=user)

        self.stdout.write(self.style.SUCCESS("Users OK."))

    # ============================================================
    # CATEGORIES
    # ============================================================
    def seed_categories(self):
        self.stdout.write(self.style.WARNING("Creating categories..."))

        tree = {
            "Electronics": ["Smartphones", "Laptops", "Monitors", "Headphones"],
            "Home": ["Smart Home", "Kitchen", "Lighting"],
            "Gaming": ["Keyboards", "Mice", "Consoles"],
            "Clothing": ["T-Shirts", "Jeans", "Dresses", "Jackets"],
            "Sports": ["Fitness", "Outdoor", "Team Sports"],
            "Books": ["Fiction", "Non-Fiction", "Educational"],
            "Music": ["Instruments", "Records", "Accessories", "Studio Gear"],
            "Art": ["Painting", "Drawing", "Sculpting", "Craft Supplies"],
            "Travel": ["Luggage", "Accessories", "Outdoor Gear", "Maps"],
        }

        parent_map = {}

        for parent_name in tree.keys():
            slug = slugify(parent_name)
            parent, _ = Category.objects.get_or_create(
                slug=slug,
                defaults={"name": parent_name}
            )
            parent_map[parent_name] = parent

        for parent_name, children in tree.items():
            parent = parent_map[parent_name]
            for child_name in children:
                slug = slugify(child_name)
                Category.objects.get_or_create(
                    slug=slug,
                    defaults={"name": child_name, "parent": parent}
                )

        self.stdout.write(self.style.SUCCESS("Categories OK."))

    # ============================================================
    # ATTRIBUTES
    # ============================================================
    def seed_attributes(self):
        self.stdout.write(self.style.WARNING("Creating attributes..."))

        attribute_definitions = [
            ("Color", "color", ProductAttribute.TEXT, ""),
            ("Weight", "weight", ProductAttribute.NUMBER, "kg"),
            ("Wireless", "wireless", ProductAttribute.BOOLEAN, ""),
            ("Waterproof", "waterproof", ProductAttribute.BOOLEAN, ""),
            ("Brand", "brand", ProductAttribute.TEXT, ""),
        ]

        attributes = []

        for name, slug, value_type, unit in attribute_definitions:
            attr, _ = ProductAttribute.objects.get_or_create(
                slug=slug,
                defaults={"name": name, "value_type": value_type, "unit": unit}
            )
            attributes.append(attr)

        for cat in Category.objects.all():
            for attr in attributes:
                cat.attributes.add(attr)

        self.attributes = attributes
        self.stdout.write(self.style.SUCCESS("Attributes OK."))

    # ============================================================
    # PRODUCTS
    # ============================================================
    def seed_products(self):
        self.stdout.write(self.style.WARNING("Creating products..."))

        categories = Category.objects.filter(parent__isnull=False)
        target = 30 #КОЛИЧЕСТВО
        existing = Product.objects.count()
        to_create = max(0, target - existing)

        for _ in range(to_create):
            category = random.choice(categories)
            name = fake.sentence(nb_words=3).replace(".", "")
            slug = slugify(name)

            if Product.objects.filter(slug=slug).exists():
                slug = f"{slug}-{random.randint(1000, 9999)}"

            product = Product.objects.create(
                category=category,
                name=name,
                slug=slug,
                description=fake.paragraph(nb_sentences=5),
                price=random.randint(20, 2000),
                old_price=random.randint(20, 2000),
                stock=random.randint(0, 100),
                rating=round(random.uniform(0, 5), 1),
            )

            # ATTRIBUTE VALUES
            for attr in self.attributes:
                if attr.value_type == ProductAttribute.TEXT:
                    ProductAttributeValue.objects.create(
                        product=product,
                        attribute=attr,
                        value_text=fake.word()
                    )
                elif attr.value_type == ProductAttribute.NUMBER:
                    ProductAttributeValue.objects.create(
                        product=product,
                        attribute=attr,
                        value_number=round(random.uniform(0.1, 5.0), 2)
                    )
                elif attr.value_type == ProductAttribute.BOOLEAN:
                    ProductAttributeValue.objects.create(
                        product=product,
                        attribute=attr,
                        value_bool=random.choice([True, False, None])
                    )

            # IMAGES
            if not product.images.exists():
                for i in range(3):
                    url = f"https://picsum.photos/seed/{random.randint(1, 999999)}/600/600"
                    response = requests.get(url, verify=False, timeout=30)
                    if response.status_code == 200:
                        img_name = f"{product.slug}_{i}.jpg"
                        image = ProductImage(product=product, is_main=(i == 0))
                        image.image.save(img_name, ContentFile(response.content), save=True)

        self.stdout.write(self.style.SUCCESS("Products OK."))

    # ============================================================
    # REVIEWS
    # ============================================================
    def seed_reviews(self):
        self.stdout.write(self.style.WARNING("Creating reviews..."))

        users = list(User.objects.all())
        products = list(Product.objects.all())

        for product in products:
            # Если у продукта уже есть отзывы — пропускаем (idempotent)
            existing_users = set(
                Review.objects.filter(product=product).values_list("user_id", flat=True)
            )

            # Сколько отзывов хотим создать
            target_count = random.randint(1, 5)

            # Выбираем пользователей, которые ещё НЕ оставляли отзыв
            available_users = [u for u in users if u.id not in existing_users]

            # Если пользователей меньше, чем нужно — ограничиваем
            selected_users = random.sample(
                available_users,
                k=min(target_count, len(available_users))
            )

            for user in selected_users:
                Review.objects.create(
                    product=product,
                    user=user,
                    rating=random.randint(1, 5),
                    text=fake.paragraph(nb_sentences=3),
                )

        self.stdout.write(self.style.SUCCESS("Reviews OK."))


    # ============================================================
    # ORDERS
    # ============================================================
    def seed_orders(self):
        self.stdout.write(self.style.WARNING("Creating orders..."))

        users = list(User.objects.all())
        products = list(Product.objects.all())

        for _ in range(20):
            user = random.choice(users)

            order = Order.objects.create(
                user=user,
                customer_email=user.email,
                shipping_address=fake.address(),
                phone_number=fake.phone_number(),
                delivery_method=Order.DeliveryMethod.DELIVERY,
                total_price=0,
                idempotency_key=fake.uuid4(),
            )

            total = 0
            for _ in range(random.randint(1, 4)):
                product = random.choice(products)
                qty = random.randint(1, 3)

                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    price=product.price,
                    quantity=qty,
                )

                total += product.price * qty

            order.total_price = total
            order.save()

        self.stdout.write(self.style.SUCCESS("Orders OK."))
