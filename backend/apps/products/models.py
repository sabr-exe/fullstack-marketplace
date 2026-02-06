from .validators import validate_image_mime, validate_image_size
import uuid
from apps.common.models import TimeStampedModel
from django.core.exceptions import ValidationError
from django.db import models

class Category(TimeStampedModel):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'

    def __str__(self):
        return self.name

    def clean(self):
        """
        Защита от циклов:
        A -> B -> C -> A
        """
        parent = self.parent
        while parent:
            if parent == self:
                raise ValidationError("Category cannot be parent of itself or create a cycle")
            parent = parent.parent




class Product(TimeStampedModel):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )

    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    description = models.TextField(blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)

    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # рейтинг 0.0 – 5.0
    rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        default=0,
    )

    # остаток — только >= 0
    stock = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["price"]),
            models.Index(fields=["category", "is_active"]),
            models.Index(fields=["slug"]),
        ]
        constraints = [
            # защита от отрицательного остатка
            models.CheckConstraint(
                condition=models.Q(stock__gte=0),
                name="product_stock_non_negative",
            ),
            # рейтинг всегда в диапазоне 0–5
            models.CheckConstraint(
                condition=models.Q(rating__gte=0) & models.Q(rating__lte=5),
                name="product_rating_range",
            ),
        ]

    def __str__(self):
        return self.name


def product_image_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"products/{instance.product_id}/{filename}" 
    
class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )

    image = models.ImageField(
        upload_to=product_image_path,
        validators=[validate_image_size, validate_image_mime]
    )
    is_main = models.BooleanField(default=False)

    class Meta:
        # гарантируем: только одно главное изображение на продукт
        constraints = [
            models.UniqueConstraint(
                fields=["product"],
                condition=models.Q(is_main=True),
                name="unique_main_image_per_product",
            )
        ]
        indexes = [
            models.Index(fields=["product"]),
        ]
    def clean(self):
        # Если это главное изображение — проверяем, что оно единственное
        if self.is_main:
            qs = ProductImage.objects.filter(product=self.product, is_main=True)
            if self.pk:
                qs = qs.exclude(pk=self.pk)
            if qs.exists():
                raise ValidationError("Main image already exists for this product.")
            
    def __str__(self):
        return f"Image for {self.product.name}"


# products/models.py

class ProductAttribute(models.Model):
    TEXT = "text"
    NUMBER = "number"
    BOOLEAN = "bool"

    VALUE_TYPES = [
        (TEXT, "Text"),
        (NUMBER, "Number"),
        (BOOLEAN, "Boolean"),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    unit = models.CharField(max_length=20, blank=True)
    value_type = models.CharField(
        max_length=10,
        choices=VALUE_TYPES,
        default=TEXT
    )

    categories = models.ManyToManyField(
        Category,
        related_name="attributes"
    )
    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
        ]
    def __str__(self):
        return self.name


class ProductAttributeValue(models.Model):
    product = models.ForeignKey(
        Product,
        related_name="attributes",
        on_delete=models.CASCADE
    )
    attribute = models.ForeignKey(
        ProductAttribute,
        on_delete=models.CASCADE
    )
    value_text = models.CharField(max_length=255, blank=True)
    value_number = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True
    )
    value_bool = models.BooleanField(null=True, blank=True)

    class Meta:
        unique_together = ("product", "attribute")
        indexes = [
            models.Index(fields=["attribute", "value_text"]),
            models.Index(fields=["attribute", "value_number"]),
        ]
    def __str__(self):
        # возвращаем значение в зависимости от типа данных
        if self.value_number is not None:
            val = str(self.value_number)
        elif self.value_bool is not None:
            val = str(self.value_bool)
        else:
            val = self.value_text or ""
        return f"{self.product} | {self.attribute}: {val}"