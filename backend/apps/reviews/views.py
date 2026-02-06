from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination
from django.db import IntegrityError
from rest_framework.exceptions import ValidationError
from .models import Review
from .serializers import ReviewSerializer
from .permissions import HasPurchasedProduct


class ReviewPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


class ReviewViewSet(ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [HasPurchasedProduct] #IsAuthenticated
    filter_backends = [OrderingFilter]
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    pagination_class = ReviewPagination

    def get_queryset(self):
        return Review.objects.filter(
            product_id=self.kwargs['product_id']
        ).select_related('user')

    def perform_create(self, serializer):
        try:
            serializer.save(
                user=self.request.user,
                product_id=self.kwargs['product_id']
            )
        except IntegrityError:
            raise ValidationError(
                {"подробнее": "Вы уже ознакомились с этим продуктом"}
            )