from django.db.models import Count, Prefetch
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from rest_framework.viewsets import ReadOnlyModelViewSet, ModelViewSet
from rest_framework.pagination import PageNumberPagination
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from .filters import ProductFilter

from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


# PAGINATION
class StandardResultsPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100



# PRODUCT VIEWSET
class ProductViewSet(ModelViewSet):
    """
    Product catalog API:
    - filtering (category, price, stock)
    - search (name, description)
    - ordering (price, rating, created_at)
    - pagination
    - caching (list + retrieve)
    """
    pagination_class = StandardResultsPagination

    # фильтры
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = ProductFilter      # ВАЖНО: используем свой фильтр
    search_fields = ["name", "description"]
    ordering_fields = ["price", "rating", "created_at"]
    ordering = ["-created_at"]


    # ---- QUERYSET ----
    def get_queryset(self):
        qs = (
            Product.objects
            .select_related("category")
            .prefetch_related(
                Prefetch(
                    "images",
                    queryset=ProductImage.objects.order_by("-is_main", "id")
                )
            )
            .annotate(reviews_count=Count("reviews", distinct=True))
        )

        user = self.request.user
        # staff видит всё
        if user.is_authenticated and user.is_staff:
            return qs
        
        # обычные пользователи — только активные товары
        return qs.filter(is_active=True)
    
    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer

        if self.action == "retrieve":
            return ProductDetailSerializer

        # create / update / delete — отдельный сериалайзер можно потом вынести
        return ProductDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        Cache product list for 60 seconds
        """
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(300))
    def retrieve(self, request, *args, **kwargs):
        """
        Cache product detail for 5 minutes
        """
        return super().retrieve(request, *args, **kwargs)


class CategoryViewSet(ReadOnlyModelViewSet):
    queryset = (
        Category.objects
        .filter(is_active=True, parent__isnull=True)
        .prefetch_related("children")
        .order_by("name")
    )

    serializer_class = CategorySerializer

    @method_decorator(cache_page(300))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
