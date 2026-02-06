from django.urls import path
from .views import (
    CartView,
    AddToCartView,
    UpdateCartItemView,
    RemoveFromCartView,
)

urlpatterns = [
    path('cart/', CartView.as_view()),
    path('cart/add/', AddToCartView.as_view()),
    path('cart/update/', UpdateCartItemView.as_view()),
    path('cart/remove/', RemoveFromCartView.as_view()),
]
