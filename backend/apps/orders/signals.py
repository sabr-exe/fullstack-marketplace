# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from django.core.mail import send_mail
# from .models import Order


# @receiver(post_save, sender=Order)
# def order_status_changed(sender, instance, created, **kwargs):
#     if instance.status == 'shipped':
#         send_mail(
#             subject='Ваш заказ отправлен',
#             message=f'Ваш заказ №{instance.id} отправлен.',
#             from_email='shop@example.com',
#             recipient_list=[instance.user.email],
#             fail_silently=True,
#         )
