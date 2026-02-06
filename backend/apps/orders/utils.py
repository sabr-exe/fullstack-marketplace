# """
# Business rules for order status transitions.

# Provides:
# - OrderStatus enum-like constants (strings) to use across the codebase
# - OrderStatusFlow: deterministic rules which states can transit to which
# - helpers: can_change(), next_allowed(), is_terminal()

# Why:
# Centralizes business rules (Single Source of Truth). Tests and admin code
# should rely on these functions instead of ad-hoc checks spread around.
# """

# from typing import Set, Dict, Iterable, Optional


# class OrderStatus:
#     """
#     Canonical status names. Use these constants everywhere (models/serializers/services).
#     They are strings to match common Django storage patterns (CharField choices).
#     """
#     CREATED = "created"
#     PENDING = "pending"   # e.g. created but waiting for payment verification
#     PAID = "paid"
#     PROCESSING = "processing"  # warehouse picking/packing
#     SHIPPED = "shipped"
#     DELIVERED = "delivered"
#     CANCELED = "canceled"
#     FAILED = "failed"  # payment failed, etc.
#     RETURNED = "returned"

#     @classmethod
#     def all(cls) -> Iterable[str]:
#         return [
#             cls.CREATED, cls.PENDING, cls.PAID, cls.PROCESSING,
#             cls.SHIPPED, cls.DELIVERED, cls.CANCELED, cls.FAILED, cls.RETURNED
#         ]


# class OrderStatusFlow:
#     """
#     Defines allowed transitions between order statuses.

#     Rules are intentionally conservative. If you need to change business logic
#     (e.g. allow `paid -> returned`), update FLOW and add unit tests.
#     """

#     # FLOW[from_status] = set(of allowed to_status)
#     FLOW: Dict[str, Set[str]] = {
#         OrderStatus.CREATED: {OrderStatus.PENDING, OrderStatus.CANCELED},
#         OrderStatus.PENDING: {OrderStatus.PAID, OrderStatus.CANCELED, OrderStatus.FAILED},
#         OrderStatus.PAID: {OrderStatus.PROCESSING, OrderStatus.CANCELED},
#         OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.CANCELED},
#         OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.RETURNED},
#         OrderStatus.DELIVERED: set(),
#         OrderStatus.CANCELED: set(),
#         OrderStatus.FAILED: {OrderStatus.CANCELED},
#         OrderStatus.RETURNED: set(),
#     }

#     TERMINAL_STATES = {
#         OrderStatus.DELIVERED,
#         OrderStatus.CANCELED,
#         OrderStatus.RETURNED,
#     }

#     @classmethod
#     def can_change(cls, old_status: Optional[str], new_status: str) -> bool:
#         """
#         Returns True if transition old_status -> new_status is allowed.
#         If old_status is None, treat it as CREATED allowed.
#         """
#         if old_status is None:
#             old_status = OrderStatus.CREATED
#         old_status = str(old_status)
#         new_status = str(new_status)
#         allowed = cls.FLOW.get(old_status, set())
#         return new_status in allowed

#     @classmethod
#     def next_allowed(cls, old_status: Optional[str]) -> Set[str]:
#         """Return set of allowed next statuses from old_status."""
#         if old_status is None:
#             old_status = OrderStatus.CREATED
#         return set(cls.FLOW.get(str(old_status), set()))

#     @classmethod
#     def is_terminal(cls, status: Optional[str]) -> bool:
#         return str(status) in cls.TERMINAL_STATES


# # Optional: convenience function used in serializers / validators
# def validate_status_transition(old_status: Optional[str], new_status: str) -> None:
#     """
#     Raises ValueError if transition is not allowed (useful in serializers/services).
#     """
#     if not OrderStatusFlow.can_change(old_status, new_status):
#         raise ValueError(f"Cannot change order status from {old_status} to {new_status}")
