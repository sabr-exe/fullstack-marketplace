import logging
from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver
from .models import ProductImage
from django.db import transaction

logger = logging.getLogger("products.signals")


def _delete_file(file_field):
    if not file_field:
        return

    try:
        storage = file_field.storage
        name = file_field.name

        if name and storage.exists(name):
            storage.delete(name)

    except Exception as exc:
        logger.error(
            "file_delete_failed",
            extra={
                "file": getattr(file_field, "name", None),
                "error": str(exc),
            },
            exc_info=True,
        )


@receiver(post_delete, sender=ProductImage)
def delete_image_file_on_delete(sender, instance, **kwargs):
    """
    Удаляет файл при удалении ProductImage.
    """
    image = instance.image 
    
    transaction.on_commit(lambda: _delete_file(image))

    logger.info(
        "product_image_deleted",
        extra={
            "product_id": instance.product_id,
            "image_id": instance.id,
        },
    )


@receiver(pre_save, sender=ProductImage)
def delete_old_image_on_update(sender, instance, **kwargs):
    """
    Удаляет старый файл при обновлении изображения.
    """
    if not instance.pk:
        return

    try:
        old = ProductImage.objects.get(pk=instance.pk)
    except ProductImage.DoesNotExist:
        return

    if old.image and old.image != instance.image:
        old_image = old.image 
        transaction.on_commit(lambda: _delete_file(old_image))
        
        logger.info(
            "product_image_replaced",
            extra={
                "product_id": instance.product_id,
                "image_id": instance.id,
            },
        )
