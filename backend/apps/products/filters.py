import django_filters
from django.db.models import Q
from .models import Product, Category


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="gte",
    )
    max_price = django_filters.NumberFilter(
        field_name="price",
        lookup_expr="lte",
    )

    category = django_filters.CharFilter(
        method="filter_category"
    )

    in_stock = django_filters.BooleanFilter(
        method="filter_in_stock"
    )

    class Meta:
        model = Product
        fields = [
            "category",
            "min_price",
            "max_price",
            "in_stock",
        ]

    def filter_category(self, queryset, name, value):
        """
        value = slug категории
        """
        try:
            category = Category.objects.get(slug=value)
        except Category.DoesNotExist:
            return queryset.none()

        # если есть MPTT
        if hasattr(category, "get_descendants"):
            categories = category.get_descendants(include_self=True)
            return queryset.filter(category__in=categories)

        # fallback: если нет MPTT — вручную (2 уровня)
        child_ids = Category.objects.filter(
            Q(id=category.id) |
            Q(parent=category) |
            Q(parent__parent=category)
        ).values_list("id", flat=True)

        return queryset.filter(category_id__in=child_ids)

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset
