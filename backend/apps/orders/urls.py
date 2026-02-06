from django.urls import path
from .views import (
    CreateOrderView,
    OrderListView,
    OrderDetailView,
    ChangeOrderStatusView,
)

urlpatterns = [
    path('orders/', OrderListView.as_view()),
    path('orders/create/', CreateOrderView.as_view()),
    path('orders/<int:pk>/', OrderDetailView.as_view()),
    path("orders/<int:order_id>/change-status/", ChangeOrderStatusView.as_view()),

]
