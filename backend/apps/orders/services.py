from django.db import transaction, IntegrityError
from django.core.exceptions import ValidationError
from .models import Order, OrderItem, OrderStatusHistory
from apps.cart.models import CartItem
from apps.products.models import Product
import logging
from decimal import Decimal
from uuid import uuid4

logger = logging.getLogger(__name__)


class OrderService:
    @staticmethod
    def create_order(
        user,
        idempotency_key,
        phone_number,
        delivery_method,
        delivery_address=None,
        delivery_time=None,
        store_address=None,
        customer_email=None,
        shipping_address=None,
    ):
        # Генерация idempotency_key, если фронт не прислал 
        if not idempotency_key: 
            idempotency_key = str(uuid4())
        """
        Idempotent, deadlock-safe order creation with full observability.
        """
        # Observability: start
        try:
            cart_size = CartItem.objects.filter(cart__user=user).count()
        except Exception:
            cart_size = None

        logger.info(
            "checkout_started",
            extra={
                "user_id": getattr(user, "id", None),
                "idempotency_key": idempotency_key,
                "cart_size": cart_size,
            },
        )

        try:
            with transaction.atomic():
                # 1) Idempotency fast-path (block existing order row if exists)
                existing = (
                    Order.objects
                    .select_for_update()
                    .filter(user=user, idempotency_key=idempotency_key)
                    .first()
                )
                if existing:
                    logger.info(
                        "checkout_idempotent_hit",
                        extra={"order_id": existing.id, "user_id": getattr(user, "id", None)},
                    )
                    return existing, False

                # 2) Получаем позиции корзины в детерминированном порядке
                cart_items_qs = (
                    CartItem.objects
                    .select_related("product", "cart")
                    .filter(cart__user=user)
                    .order_by("product_id")   # <- важно для детерминированной блокировки
                )

                if not cart_items_qs.exists():
                    logger.warning(
                        "checkout_empty_cart",
                        extra={"user_id": getattr(user, "id", None)},
                    )
                    raise ValidationError("Cart is empty")

                # 3) Блокируем Product-строки в детерминированном порядке (по pk)
                product_ids = list(cart_items_qs.values_list("product_id", flat=True).distinct())
                products_qs = Product.objects.filter(pk__in=product_ids).order_by("pk").select_for_update()
                products = {p.pk: p for p in products_qs}

                # 4) Проверяем stock и резервируем (меняем объект и сохраняем)
                total_price = Decimal("0")
                order_items = []

                for ci in cart_items_qs:
                    p = products.get(ci.product_id)
                    if p is None:
                        logger.error(
                            "checkout_product_missing",
                            extra={"product_id": ci.product_id, "user_id": getattr(user, "id", None)},
                        )
                        raise ValidationError(f"Product {ci.product_id} not found")

                    if p.stock < ci.quantity:
                        logger.warning(
                            "checkout_out_of_stock",
                            extra={
                                "product_id": p.pk,
                                "available": p.stock,
                                "requested": ci.quantity,
                                "user_id": getattr(user, "id", None),
                            },
                        )
                        raise ValidationError(f"Not enough stock for product {p.pk}")

                    # резервируем
                    p.stock -= ci.quantity
                    p.save(update_fields=["stock"])

                    # подготовка OrderItem
                    order_items.append(
                        OrderItem(
                            order=None,  # временно, присвоим order после создания
                            product=p,
                            product_name=p.name if hasattr(p, "name") else "",
                            quantity=ci.quantity,
                            price=p.price,
                        )
                    )

                    # суммирование
                    total_price += (p.price * ci.quantity)

                # 5) Создаём Order (после успешного резервирования)
                try:
                    order = Order.objects.create(
                        user=user,
                        idempotency_key=idempotency_key,
                        phone_number=phone_number,
                        delivery_method=delivery_method,
                        delivery_address=delivery_address or "",
                        delivery_time=delivery_time,
                        store_address=store_address or "",
                        customer_email=customer_email,
                        shipping_address=shipping_address or "",
                        status=Order.Status.PENDING,
                        total_price=total_price,   # ✅ сразу правильная цена
                        is_finalized=True,
                    )
                except IntegrityError:
                    # Редкая гонка — кто-то параллельно создал заказ с тем же idempotency_key
                    existing = Order.objects.filter(user=user, idempotency_key=idempotency_key).first()
                    if existing:
                        logger.info(
                            "checkout_idempotent_race_resolved",
                            extra={
                                "order_id": existing.id, 
                                "user_id": getattr(user, "id", None),
                                "idempotency_key": idempotency_key,  
                                },
                        )
                        return existing, False
                    raise

                # 6) Сохраняем OrderItems, присвоив order
                for oi in order_items:
                    oi.order = order
                OrderItem.objects.bulk_create(order_items)

                # 7) Финализируем заказ
                # order.total_price = total_price
                # order.is_finalized = True
                # order.save(update_fields=["total_price", "is_finalized"])

                # 8) Очищаем корзину
                cart_items_qs.delete()

                logger.info(
                    "checkout_created",
                    extra={
                        "order_id": order.id,
                        "user_id": getattr(user, "id", None),
                        "total_price": str(order.total_price),
                        "items_count": len(order_items),
                    },
                )

                return order, True

        except Exception as exc:
            logger.exception(
                "checkout_failed",
                exc_info=exc,
                extra={"user_id": getattr(user, "id", None), "idempotency_key": idempotency_key},
            )
            raise


    @staticmethod
    def change_status(order_id, new_status, changed_by=None, comment=""):
        """
        Change order status atomically, write history and send notifications.
        """
        try:
            with transaction.atomic():
                # lock order
                order = Order.objects.select_for_update().get(pk=order_id)
                old_status = order.status

                if old_status == new_status:
                    return order, False

                # Optional business-rule check
                try:
                    from .utils import OrderStatusFlow
                    if not OrderStatusFlow.can_change(old_status, new_status):
                        raise ValidationError(f"Cannot change status from {old_status} to {new_status}")
                except ImportError:
                    pass

                order.status = new_status
                order.save(update_fields=["status"])

                OrderStatusHistory.objects.create(
                    order=order,
                    from_status=old_status,
                    to_status=new_status,
                    changed_by=changed_by,
                    comment=comment,
                )

            # outside transaction: send notification (or send asynchronously inside job)
            if str(new_status).lower() == "shipped":
                try:
                    from .notifications import send_order_shipped_email
                    send_order_shipped_email(order)
                except Exception:
                    logger.exception("failed_to_send_order_shipped_email", extra={"order_id": order.id})

            logger.info(
                "order_status_changed",
                extra={
                    "order_id": order.id,
                    "from_status": old_status,
                    "to_status": new_status,
                    "changed_by": getattr(changed_by, "id", None),
                },
            )

            return order, True

        except Exception as exc:
            logger.exception(
                "order_status_change_failed",
                exc_info=exc,
                extra={
                    "order_id": order_id,
                    "from_status": locals().get("old_status", None),
                    "to_status": new_status,
                    "changed_by": getattr(changed_by, "id", None),
                },
            )
            raise


class OrderStatusFlow:

    ALLOWED_TRANSITIONS = {
        Order.Status.PENDING: [Order.Status.CONFIRMED, Order.Status.CANCELLED],
        Order.Status.CONFIRMED: [Order.Status.SHIPPED, Order.Status.CANCELLED],
        Order.Status.SHIPPED: [Order.Status.DELIVERED],       
        Order.Status.DELIVERED: [Order.Status.COMPLETED],     
        Order.Status.COMPLETED: [],                            
        Order.Status.CANCELLED: [],
    }

    @classmethod
    def can_change(cls, from_status, to_status):
        return to_status in cls.ALLOWED_TRANSITIONS.get(from_status, [])
