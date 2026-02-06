from django.core.checks import register, Error
from django.conf import settings
import os


@register()
def check_production_settings(app_configs, **kwargs):
    errors = []

    # DEBUG не должен быть включён в проде
    if not settings.DEBUG:
        pass
    else:
        errors.append(
            Error(
                "DEBUG is enabled in production",
                hint="Set DEBUG=False in production settings",
                id="core.E001",
            )
        )

    # SECRET_KEY должен приходить из env
    if not os.environ.get("DJANGO_SECRET_KEY"):
        errors.append(
            Error(
                "DJANGO_SECRET_KEY is not set",
                hint="Export DJANGO_SECRET_KEY in environment variables",
                id="core.E002",
            )
        )

    # ALLOWED_HOSTS не пуст
    if not settings.ALLOWED_HOSTS:
        errors.append(
            Error(
                "ALLOWED_HOSTS is empty",
                hint="Set ALLOWED_HOSTS in production",
                id="core.E003",
            )
        )

    return errors
