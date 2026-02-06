from django.contrib import admin, messages
from .models import Order, OrderItem, OrderStatusHistory
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.db import transaction

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "quantity", "price")


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = (
        "from_status",
        "to_status",
        "changed_by",
        "comment",
        "created_at",
    )
    can_delete = False

def _bulk_change_status(modeladmin, request, queryset, new_status):
    from .services import OrderService
    success = 0
    errors = []

    for order in queryset:
        try:
            with transaction.atomic():
                OrderService.change_status(
                    order_id=order.id,
                    new_status=new_status,
                    changed_by=request.user,
                    comment="Bulk change from admin"
                )
            success += 1
        except Exception as e:
            errors.append(f"#{order.id}: {e}")

    modeladmin.message_user(
        request,
        _("Changed %(count)s orders to %(status)s. %(errs)s") % {
            "count": success,
            "status": new_status,
            "errs": "" if not errors else "Errors: " + "; ".join(errors)
        }
    )

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "delivery_method",
        "phone_number",
        "total_price",
        "created_at",
    )

    list_filter = (
        "status",
        "delivery_method",
        "created_at",
    )

    search_fields = (
        "id",
        "user__email",
        "phone_number",
    )

    readonly_fields = (
        "id",
        "user",
        "total_price",
        "created_at",
    )

    inlines = [
        OrderItemInline,
        OrderStatusHistoryInline,
    ]

    actions = (
        "make_confirmed",
        "make_shipped",
        "make_cancelled",
    )

    fieldsets = (
        ("Main", {
            "fields": (
                "id",
                "user",
                "status",
                "total_price",
                "created_at",
            )
        }),
        ("Contact", {
            "fields": (
                "phone_number",
            )
        }),
        ("Delivery", {
            "fields": (
                "delivery_method",
                "delivery_address",
                "delivery_time",
                "store_address",
            )
        }),
    )

    def save_model(self, request, obj, form, change):
        """
        Если статус меняют через админку —
        используем сервис, а не прямое сохранение
        """
        if change:
            old = Order.objects.get(pk=obj.pk)

            if old.status != obj.status:
                from .services import OrderService
                try:
                    OrderService.change_status(
                        order_id=old.id,
                        new_status=obj.status,
                        changed_by=request.user,
                        comment="Changed from admin panel",
                    )
                    # синхронизируем obj.status с тем, что в базе (чтобы super().save_model не перезаписал)
                    obj.status = Order.objects.get(pk=old.id).status
                except ValidationError as e:
                    self.message_user(request, str(e), level=messages.ERROR)
            super().save_model(request, obj, form, change)


 

    def make_confirmed(self, request, queryset):
        return _bulk_change_status(self, request, queryset, Order.Status.CONFIRMED)
    make_confirmed.short_description = _("Mark selected orders as confirmed")

    def make_shipped(self, request, queryset):
        return _bulk_change_status(self, request, queryset, Order.Status.SHIPPED)
    make_shipped.short_description = _("Mark selected orders as shipped")

    def make_cancelled(self, request, queryset):
        return _bulk_change_status(self, request, queryset, Order.Status.CANCELLED)
    make_cancelled.short_description = _("Mark selected orders as cancelled")

    def make_delivered(self, request, queryset):
        return _bulk_change_status(self, request, queryset, Order.Status.DELIVERED)
    make_delivered.short_description = _("Mark selected orders as delivered")

    def make_completed(self, request, queryset):
        return _bulk_change_status(self, request, queryset, Order.Status.COMPLETED)
    make_completed.short_description = _("Mark selected orders as completed")


    # Внутри OrderAdmin:
    actions = (
    "make_confirmed",
    "make_shipped",
    "make_delivered",
    "make_completed",
    "make_cancelled",
    )

