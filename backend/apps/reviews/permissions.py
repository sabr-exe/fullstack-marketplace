from rest_framework.permissions import BasePermission
from apps.orders.models import OrderItem, Order


class HasPurchasedProduct(BasePermission):
    """
    - GET / LIST — разрешены всем
    - POST — только если пользователь покупал товар
    - PUT / DELETE — только автор отзыва
    """

    def has_permission(self, request, view):
        # SAFE методы всегда разрешены
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # Остальные — только для авторизованных
        if not request.user.is_authenticated:
            return False

        # Для создания отзыва проверяем покупку
        if request.method == "POST":
            product_id = view.kwargs.get("product_id")
            return OrderItem.objects.filter(
                order__user=request.user,
                order__status__in=[Order.Status.DELIVERED, Order.Status.COMPLETED],
                product_id=product_id,
            ).exists()

        return True

    def has_object_permission(self, request, view, obj):
        # SAFE методы — можно всем
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        # Редактировать/удалять может только автор
        return obj.user == request.user
